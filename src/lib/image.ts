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

export function enhancePixelBuffer(data: Uint8ClampedArray, width: number, height: number, sharpen: number, contrast: number) {
  if (width < 1 || height < 1 || data.length !== width * height * 4) throw new Error("图片像素数据无效，无法增强。 ");
  const original = new Uint8ClampedArray(data);
  const safeSharpen = clamp(sharpen, 0, 0.75);
  const safeContrast = clamp(contrast, -100, 100);
  const contrastFactor = (259 * (safeContrast + 255)) / (255 * (259 - safeContrast));
  const pixelAt = (x: number, y: number, channel: number) => original[(y * width + x) * 4 + channel];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const center = original[offset + channel];
        const neighbors = pixelAt(Math.max(0, x - 1), y, channel) + pixelAt(Math.min(width - 1, x + 1), y, channel) + pixelAt(x, Math.max(0, y - 1), channel) + pixelAt(x, Math.min(height - 1, y + 1), channel);
        const sharpened = center + safeSharpen * (center * 4 - neighbors);
        data[offset + channel] = clamp((sharpened - 128) * contrastFactor + 128, 0, 255);
      }
    }
  }

  return data;
}

export type BackgroundCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type RgbColor = { red: number; green: number; blue: number };

export function removeSolidBackground(data: Uint8ClampedArray, width: number, height: number, tolerance: number, corner: BackgroundCorner = "top-left") {
  if (width < 1 || height < 1 || data.length !== width * height * 4) throw new Error("图片像素数据无效，无法移除背景。 ");
  const safeTolerance = clamp(tolerance, 4, 80);
  const threshold = safeTolerance * safeTolerance * 3;
  const innerThreshold = threshold * 0.72;
  const cornerX = corner.endsWith("right") ? width - 1 : 0;
  const cornerY = corner.startsWith("bottom") ? height - 1 : 0;
  const seedOffset = (cornerY * width + cornerX) * 4;
  const seedRed = data[seedOffset];
  const seedGreen = data[seedOffset + 1];
  const seedBlue = data[seedOffset + 2];
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;
  let changedPixels = 0;

  function matchesBackground(index: number) {
    const offset = index * 4;
    const redDelta = data[offset] - seedRed;
    const greenDelta = data[offset + 1] - seedGreen;
    const blueDelta = data[offset + 2] - seedBlue;
    return redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta <= threshold;
  }

  function enqueue(index: number) {
    if (visited[index] || !matchesBackground(index)) return;
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  }

  enqueue(cornerY * width + cornerX);
  while (head < tail) {
    const index = queue[head];
    head += 1;
    const offset = index * 4;
    const redDelta = data[offset] - seedRed;
    const greenDelta = data[offset + 1] - seedGreen;
    const blueDelta = data[offset + 2] - seedBlue;
    const distance = redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta;
    const alpha = distance <= innerThreshold ? 0 : Math.round(255 * (distance - innerThreshold) / (threshold - innerThreshold));
    if (data[offset + 3] !== alpha) {
      data[offset + 3] = alpha;
      changedPixels += 1;
    }

    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y < height - 1) enqueue(index + width);
  }

  return changedPixels;
}

export function compositeTransparentPixels(data: Uint8ClampedArray, color: RgbColor) {
  if (data.length % 4 !== 0) throw new Error("图片像素数据无效，无法替换背景。 ");
  const red = clamp(Math.round(color.red), 0, 255);
  const green = clamp(Math.round(color.green), 0, 255);
  const blue = clamp(Math.round(color.blue), 0, 255);
  for (let offset = 0; offset < data.length; offset += 4) {
    const opacity = data[offset + 3] / 255;
    data[offset] = Math.round(red * (1 - opacity) + data[offset] * opacity);
    data[offset + 1] = Math.round(green * (1 - opacity) + data[offset + 1] * opacity);
    data[offset + 2] = Math.round(blue * (1 - opacity) + data[offset + 2] * opacity);
    data[offset + 3] = 255;
  }
  return data;
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
