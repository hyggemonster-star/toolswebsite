import type { ImageOutput } from "./image";

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_VIDEO_REMOVE_AUDIO_SECONDS = 5 * 60;

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

function waitForEvent(element: HTMLVideoElement, eventName: "loadedmetadata" | "seeked") {
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
