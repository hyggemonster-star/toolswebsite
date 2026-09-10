export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;
export const MAX_AUDIO_COMPRESS_SECONDS = 10 * 60;

export type AudioOutput = {
  blob: Blob;
  name: string;
  mime: string;
};

export function isAudioFile(file: File) {
  return file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|oga|flac|webm)$/i.test(file.name);
}

export function validateAudioFile(file: File) {
  if (!isAudioFile(file)) throw new Error("请选择 MP3、WAV、M4A、AAC、OGG 或其他浏览器支持的音频文件。 ");
  if (file.size > MAX_AUDIO_BYTES) throw new Error("音频超过 200 MB，暂不建议在浏览器中处理。 ");
}

function getAudioRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") throw new Error("当前浏览器不支持本地音频导出，请使用最新版 Chrome、Edge 或 Firefox。 ");
  const candidates = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function waitForAudioMetadata(audio: HTMLAudioElement) {
  return new Promise<void>((resolve, reject) => {
    const onLoaded = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("浏览器无法读取这个音频，请换一个 MP3、WAV 或 M4A 文件。 ")); };
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
    };
    audio.addEventListener("loadedmetadata", onLoaded, { once: true });
    audio.addEventListener("error", onError, { once: true });
  });
}

function waitForAudioEnd(audio: HTMLAudioElement) {
  return new Promise<void>((resolve, reject) => {
    const onEnded = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("浏览器播放这个音频时遇到错误，请换一个文件后重试。 ")); };
    const cleanup = () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
    audio.addEventListener("ended", onEnded, { once: true });
    audio.addEventListener("error", onError, { once: true });
  });
}

function getAudioContextConstructor() {
  const context = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? context.webkitAudioContext;
}

function outputExtension(mime: string) {
  return mime.startsWith("audio/ogg") ? "ogg" : "webm";
}

export async function compressAudio(file: File, audioBitsPerSecond = 96_000): Promise<AudioOutput> {
  validateAudioFile(file);
  const mime = getAudioRecorderMimeType();
  if (!mime) throw new Error("当前浏览器没有可用的 OGG/WebM 音频录制格式，请使用最新版 Chrome、Edge 或 Firefox。 ");
  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) throw new Error("当前浏览器不支持 Web Audio 本地处理，请使用最新版 Chrome、Edge 或 Firefox。 ");
  const url = URL.createObjectURL(file);
  const audio = document.createElement("audio");
  audio.preload = "auto";
  audio.src = url;
  const context = new AudioContextConstructor();
  let source: MediaElementAudioSourceNode | null = null;
  let destination: MediaStreamAudioDestinationNode | null = null;
  try {
    await waitForAudioMetadata(audio);
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) throw new Error("音频没有可读取的时长。 ");
    if (audio.duration > MAX_AUDIO_COMPRESS_SECONDS) throw new Error("音频超过 10 分钟，暂不建议在浏览器中压缩。 ");
    source = context.createMediaElementSource(audio);
    destination = context.createMediaStreamDestination();
    source.connect(destination);
    if (context.state === "suspended") await context.resume();
    const bitrate = Math.min(192_000, Math.max(32_000, Math.round(Number(audioBitsPerSecond) || 96_000)));
    const recorder = new MediaRecorder(destination.stream, { mimeType: mime, audioBitsPerSecond: bitrate });
    const chunks: Blob[] = [];
    const recording = new Promise<Blob>((resolve, reject) => {
      recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
      recorder.addEventListener("stop", () => resolve(new Blob(chunks, { type: mime })), { once: true });
      recorder.addEventListener("error", () => reject(new Error("音频压缩导出失败，请换一个文件或使用最新版浏览器。 ")), { once: true });
    });
    recorder.start(250);
    try {
      const audioEnded = waitForAudioEnd(audio);
      await audio.play();
      await audioEnded;
    } finally {
      if (recorder.state !== "inactive") recorder.stop();
    }
    const blob = await recording;
    if (!blob.size) throw new Error("没有生成有效的音频结果，请换一个文件后重试。 ");
    return { blob, name: `${file.name.replace(/\.[^.]+$/, "") || "audio"}-compressed.${outputExtension(mime)}`, mime };
  } finally {
    source?.disconnect();
    if (context.state !== "closed") await context.close();
    audio.removeAttribute("src");
    audio.load();
    URL.revokeObjectURL(url);
  }
}
