import type { ImageOutput } from "./image";

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_VIDEO_REMOVE_AUDIO_SECONDS = 5 * 60;
export const MAX_VIDEO_GIF_SECONDS = 8;
export const MAX_VIDEO_GIF_DIMENSION = 480;

export type VideoOutput = {
  blob: Blob;
  name: string;
  mime: string;
};

export function isVideoFile(file: File) {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
}

export function validateVideoFile(file: File) {
  if (!isVideoFile(file)) throw new Error("请选择 MP4、WEBM、MOV 或其他浏览器支持的视频文件。 ");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("视频超过 200 MB，暂不建议在浏览器中处理。 ");
}

function waitForEvent(element: HTMLVideoElement, eventName: "loadeddata" | "loadedmetadata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("浏览器无法读取这个视频，请换一个 MP4 或 WEBM 文件。 "));
    };
    const cleanup = () => {
      element.removeEventListener(eventName, onSuccess);
      element.removeEventListener("error", onError);
    };
    element.addEventListener(eventName, onSuccess, { once: true });
    element.addEventListener("error", onError, { once: true });
  });
}

function outputName(name: string, suffix: string) {
  return `${name.replace(/\.[^.]+$/, "") || "video"}${suffix}.jpg`;
}

function mutedVideoOutputName(name: string) {
  return `${name.replace(/\.[^.]+$/, "") || "video"}-no-audio.webm`;
}

function getVideoCaptureStream(video: HTMLVideoElement) {
  const captureStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream
    ?? (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).mozCaptureStream;
  if (!captureStream) throw new Error("当前浏览器不支持本地去除音轨，请使用最新版 Chrome、Edge 或 Firefox。 ");
  return captureStream.call(video);
}

function getRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") throw new Error("当前浏览器不支持本地视频导出，请使用最新版 Chrome、Edge 或 Firefox。 ");
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function waitForVideoEnd(video: HTMLVideoElement) {
  return new Promise<void>((resolve, reject) => {
    const onEnded = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("浏览器播放这个视频时遇到错误，请换一个 MP4 或 WEBM 文件。 ")); };
    const cleanup = () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("ended", onEnded, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

export async function removeVideoAudio(file: File): Promise<VideoOutput> {
  validateVideoFile(file);
  const mime = getRecorderMimeType();
  if (!mime) throw new Error("当前浏览器没有可用的 WebM 视频录制格式，请使用最新版 Chrome、Edge 或 Firefox。 ");
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  let capture: MediaStream | null = null;
  let videoOnlyStream: MediaStream | null = null;
  try {
    await waitForEvent(video, "loadedmetadata");
    if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) throw new Error("视频没有可读取的画面或时长。 ");
    if (video.duration > MAX_VIDEO_REMOVE_AUDIO_SECONDS) throw new Error("视频超过 5 分钟，暂不建议在浏览器中去除音轨。 ");
    capture = getVideoCaptureStream(video);
    const videoTracks = capture.getVideoTracks();
    if (!videoTracks.length) throw new Error("浏览器没有提供可录制的视频画面。 ");
    videoOnlyStream = new MediaStream(videoTracks);
    const recorder = new MediaRecorder(videoOnlyStream, { mimeType: mime });
    const chunks: Blob[] = [];
    const recording = new Promise<Blob>((resolve, reject) => {
      recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
      recorder.addEventListener("stop", () => resolve(new Blob(chunks, { type: mime })), { once: true });
      recorder.addEventListener("error", () => reject(new Error("视频导出失败，请换一个文件或使用最新版浏览器。 ")), { once: true });
    });
    recorder.start(250);
    try {
      const videoEnded = waitForVideoEnd(video);
      await video.play();
      await videoEnded;
    } finally {
      if (recorder.state !== "inactive") recorder.stop();
    }
    const blob = await recording;
    if (!blob.size) throw new Error("没有生成有效的视频结果，请换一个文件后重试。 ");
    return { blob, name: mutedVideoOutputName(file.name), mime };
  } finally {
    videoOnlyStream?.getTracks().forEach((track) => track.stop());
    capture?.getTracks().forEach((track) => track.stop());
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export type GifFrame = {
  pixels: Uint8ClampedArray;
  delayCentiseconds: number;
};

function pushAscii(bytes: number[], value: string) {
  for (let index = 0; index < value.length; index += 1) bytes.push(value.charCodeAt(index));
}

function quantizePixels(pixels: Uint8ClampedArray) {
  const indexes = new Uint8Array(pixels.length / 4);
  for (let pixel = 0; pixel < indexes.length; pixel += 1) {
    const offset = pixel * 4;
    const red = Math.round(pixels[offset] * 7 / 255);
    const green = Math.round(pixels[offset + 1] * 7 / 255);
    const blue = Math.round(pixels[offset + 2] * 3 / 255);
    indexes[pixel] = (red << 5) | (green << 2) | blue;
  }
  return indexes;
}

function lzwEncode(indexes: Uint8Array) {
  const clearCode = 256;
  const endCode = 257;
  const dictionary = new Map<number, number>();
  const bytes: number[] = [];
  let codeSize = 9;
  let nextCode = 258;
  let bitBuffer = 0;
  let bitCount = 0;

  function emit(code: number) {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      bytes.push(bitBuffer & 0xff);
      bitBuffer >>>= 8;
      bitCount -= 8;
    }
  }

  function reset() {
    dictionary.clear();
    codeSize = 9;
    nextCode = 258;
  }

  if (!indexes.length) return new Uint8Array([clearCode & 0xff, endCode & 0xff]);
  emit(clearCode);
  let prefix = indexes[0];
  for (let index = 1; index < indexes.length; index += 1) {
    const value = indexes[index];
    const key = (prefix << 8) | value;
    const existing = dictionary.get(key);
    if (existing !== undefined) {
      prefix = existing;
      continue;
    }
    emit(prefix);
    if (nextCode < 4096) {
      dictionary.set(key, nextCode);
      nextCode += 1;
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize += 1;
    } else {
      emit(clearCode);
      reset();
    }
    prefix = value;
  }
  emit(prefix);
  emit(endCode);
  if (bitCount > 0) bytes.push(bitBuffer & 0xff);
  return new Uint8Array(bytes);
}

function createGifPalette() {
  const palette: number[] = [];
  for (let red = 0; red < 8; red += 1) {
    for (let green = 0; green < 8; green += 1) {
      for (let blue = 0; blue < 4; blue += 1) {
        palette.push(Math.round(red * 255 / 7), Math.round(green * 255 / 7), Math.round(blue * 255 / 3));
      }
    }
  }
  return palette;
}

export function encodeGif(frames: GifFrame[], width: number, height: number) {
  if (!frames.length || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error("GIF 帧数据无效。 ");
  const expectedLength = width * height * 4;
  if (width * height > MAX_VIDEO_GIF_DIMENSION * 900) throw new Error("GIF 尺寸过大，请降低输出尺寸后重试。 ");
  const bytes: number[] = [];
  pushAscii(bytes, "GIF89a");
  bytes.push(width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff, 0xf7, 0x00, 0x00);
  bytes.push(...createGifPalette());
  bytes.push(0x21, 0xff, 0x0b);
  pushAscii(bytes, "NETSCAPE2.0");
  bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);

  for (const frame of frames) {
    if (frame.pixels.length !== expectedLength) throw new Error("GIF 帧尺寸不一致。 ");
    const delay = Math.max(1, Math.min(65535, Math.round(frame.delayCentiseconds)));
    bytes.push(0x21, 0xf9, 0x04, 0x00, delay & 0xff, (delay >> 8) & 0xff, 0x00, 0x00);
    bytes.push(0x2c, 0x00, 0x00, 0x00, 0x00, width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff, 0x00);
    bytes.push(0x08);
    const compressed = lzwEncode(quantizePixels(frame.pixels));
    for (let offset = 0; offset < compressed.length; offset += 255) {
      const length = Math.min(255, compressed.length - offset);
      bytes.push(length, ...compressed.subarray(offset, offset + length));
    }
    bytes.push(0x00);
  }
  bytes.push(0x3b);
  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}

function gifOutputName(name: string) {
  return `${name.replace(/\.[^.]+$/, "") || "video"}.gif`;
}

export async function createVideoGif(file: File, seconds = 5, fps = 10): Promise<ImageOutput> {
  validateVideoFile(file);
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    await waitForEvent(video, "loadedmetadata");
    if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) throw new Error("视频没有可读取的画面或时长。 ");
    const safeSeconds = Math.min(MAX_VIDEO_GIF_SECONDS, Math.max(1, Number(seconds) || 5));
    const safeFps = Math.min(12, Math.max(4, Math.round(Number(fps) || 10)));
    const duration = Math.min(video.duration, safeSeconds);
    const scale = Math.min(1, MAX_VIDEO_GIF_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(1, Math.round(video.videoWidth * scale));
    const height = Math.max(1, Math.round(video.videoHeight * scale));
    const frameCount = Math.max(1, Math.ceil(duration * safeFps));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器不支持 Canvas 动图导出。 ");
    if (video.readyState < 2) await waitForEvent(video, "loadeddata");
    const frames: GifFrame[] = [];
    for (let index = 0; index < frameCount; index += 1) {
      const target = Math.min(index / safeFps, Math.max(0, duration - 0.01));
      if (index > 0 || target > 0) {
        video.currentTime = target;
        await waitForEvent(video, "seeked");
      }
      context.drawImage(video, 0, 0, width, height);
      frames.push({ pixels: context.getImageData(0, 0, width, height).data, delayCentiseconds: 100 / safeFps });
    }
    const blob = encodeGif(frames, width, height);
    return { blob, name: gifOutputName(file.name), mime: "image/gif" } satisfies ImageOutput;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export async function captureVideoFrame(file: File, seconds: number, suffix = "-screenshot"): Promise<ImageOutput> {
  validateVideoFile(file);
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    await waitForEvent(video, "loadedmetadata");
    if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) throw new Error("视频没有可读取的画面或时长。 ");
    const target = Math.min(Math.max(0, Number(seconds) || 0), Math.max(0, video.duration - 0.01));
    video.currentTime = target;
    await waitForEvent(video, "seeked");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器不支持视频截图。 ");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("无法生成截图，请换一个视频后重试。 ")), "image/jpeg", 0.92);
    });
    return { blob, name: outputName(file.name, suffix), mime: "image/jpeg" };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
