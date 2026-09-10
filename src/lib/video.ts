import type { ImageOutput } from "./image";

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

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
