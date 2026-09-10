export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

export type ImageOutput = {
  blob: Blob;
  name: string;
  mime: string;
};

export const imageFormats: Array<{ mime: ImageMime; label: string; extension: string }> = [
  { mime: "image/jpeg", label: "JPG", extension: "jpg" },
  { mime: "image/png", label: "PNG", extension: "png" },
  { mime: "image/webp", label: "WEBP", extension: "webp" },
];

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "") || "image";
}

export function getExtension(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/x-icon" || mime === "image/vnd.microsoft.icon") return "ico";
  return "jpg";
}

export function outputMimeForFile(file: File): ImageMime {
  return file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
}

export function loadImage(source: Blob | string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = typeof source === "string" ? null : URL.createObjectURL(source);
    image.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("无法读取这张图片。请换一张 JPG、PNG 或 WEBP 图片。"));
    };
    image.src = objectUrl ?? (source as string);
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: ImageMime = "image/jpeg", quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("浏览器无法生成图片结果，请换一张图片后重试。"));
    }, mime, quality);
  });
}

export function makeCanvas(width: number, height: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error("图片尺寸必须是大于 0 的整数。 ");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持 Canvas 图片处理。 ");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return { canvas, context };
}

export async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("无法读取图片数据。"));
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(value: string) {
  const input = value.trim();
  if (!input) throw new Error("请先粘贴 Base64 图片数据。 ");

  const match = input.match(/^data:([^;,\s]+)(;base64)?,([\s\S]*)$/i);
  const mime = match?.[1] || "image/png";
  const payload = match?.[3] ?? input;
  if (!mime.startsWith("image/")) throw new Error("数据类型不是图片，无法生成图片文件。 ");

  try {
    const normalized = payload.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new Blob([bytes], { type: mime });
  } catch {
    throw new Error("Base64 图片数据无效，请确认没有缺少内容或多余字符。 ");
  }
}

/**
 * ICO files may contain a PNG payload. This keeps favicon generation fully
 * browser-side without adding a binary or image-processing dependency.
 */
export async function pngToIco(png: Blob) {
  const bytes = new Uint8Array(await png.arrayBuffer());
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
    throw new Error("无法生成 ICO，请先使用 PNG 图片结果。 ");
  }

  const header = new ArrayBuffer(22);
  const view = new DataView(header);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, 0);
  view.setUint8(7, 0);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, bytes.length, true);
  view.setUint32(18, 22, true);
  return new Blob([header, bytes], { type: "image/x-icon" });
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function safeInteger(value: string, fallback: number, min = 1, max = 10000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(Math.round(parsed), min, max);
}
