import { PDFDocument } from "pdf-lib";

export const PDF_MIME = "application/pdf";
export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const MAX_PDF_FILES = 20;

export type PdfOutput = {
  blob: Blob;
  name: string;
  pageCount: number;
};

export function isPdfFile(file: File) {
  return file.type === PDF_MIME || /\.pdf$/i.test(file.name);
}

export function validatePdfFiles(files: File[], multiple = false) {
  if (!files.length) throw new Error("请先选择 PDF 文件。 ");
  if (!multiple && files.length > 1) throw new Error("这个工具一次只处理一个 PDF 文件。 ");
  if (files.length > MAX_PDF_FILES) throw new Error(`一次最多处理 ${MAX_PDF_FILES} 个文件。 `);
  for (const file of files) {
    if (!isPdfFile(file)) throw new Error(`“${file.name}”不是 PDF 文件，请重新选择。 `);
    if (file.size > MAX_PDF_BYTES) throw new Error(`“${file.name}”超过 50 MB，暂不建议在浏览器中处理。 `);
  }
}

export async function loadPdf(file: File) {
  validatePdfFiles([file]);
  try {
    return await PDFDocument.load(await file.arrayBuffer());
  } catch (reason) {
    if (reason instanceof Error && /encrypt|password/i.test(reason.message)) {
      throw new Error("这个 PDF 受密码保护或加密，当前浏览器工具无法读取。 ");
    }
    throw new Error("无法读取这个 PDF，文件可能损坏或使用了暂不支持的格式。 ");
  }
}

export function pdfBaseName(name: string) {
  return name.replace(/\.pdf$/i, "") || "document";
}

export function pdfOutputName(file: File, suffix: string) {
  return `${pdfBaseName(file.name)}${suffix}.pdf`;
}

export function formatPdfBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function pageSpecToIndices(spec: string, pageCount: number) {
  if (!pageCount) throw new Error("没有读取到 PDF 页面。 ");
  const normalized = spec.trim().replace(/[，、]/g, ",");
  if (!normalized || normalized.toLowerCase() === "all" || normalized === "全部") {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  const indices: number[] = [];
  for (const rawPart of normalized.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;
    const range = part.match(/^(\d+)\s*[-~至]\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start > end) throw new Error(`页面范围“${part}”需要从小到大填写。 `);
      for (let page = start; page <= end; page += 1) indices.push(page - 1);
    } else if (/^\d+$/.test(part)) {
      indices.push(Number(part) - 1);
    } else {
      throw new Error(`无法识别页面范围“${part}”，示例：1-3,5。 `);
    }
  }

  if (!indices.length) throw new Error("请填写要处理的页面范围。 ");
  if (indices.some((index) => index < 0 || index >= pageCount)) {
    throw new Error(`页面范围超出 PDF 页数（共 ${pageCount} 页）。 `);
  }
  if (new Set(indices).size !== indices.length) throw new Error("页面范围不能包含重复页码。 ");
  return indices;
}

export function pageOrderToIndices(spec: string, pageCount: number) {
  const indices = pageSpecToIndices(spec, pageCount);
  if (indices.length !== pageCount || new Set(indices).size !== pageCount) {
    throw new Error(`页面排序需要包含全部 ${pageCount} 页，且每页只能出现一次。 `);
  }
  return indices;
}

export async function savePdf(document: PDFDocument, name: string): Promise<PdfOutput> {
  const bytes = await document.save({ useObjectStreams: true, addDefaultPage: false });
  const blobBytes = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return {
    blob: new Blob([blobBytes], { type: PDF_MIME }),
    name,
    pageCount: document.getPageCount(),
  };
}

export async function copyPagesToNewDocument(source: PDFDocument, indices: number[]) {
  const target = await PDFDocument.create();
  const pages = await target.copyPages(source, indices);
  pages.forEach((page) => target.addPage(page));
  return target;
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`无法读取图片“${file.name}”。 `));
    };
    image.src = url;
  });
}

async function imageToPngBytes(file: File) {
  const image = await loadImageElement(file);
  if (!image.naturalWidth || !image.naturalHeight) throw new Error(`图片“${file.name}”没有有效尺寸。 `);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持图片转 PDF。 ");
  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("无法生成图片 PDF 数据。 ")), "image/png");
  });
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: image.naturalWidth, height: image.naturalHeight };
}

export async function createPdfFromImages(files: File[], name = "images.pdf") {
  if (!files.length) throw new Error("请先选择图片。 ");
  if (files.length > MAX_PDF_FILES) throw new Error(`一次最多处理 ${MAX_PDF_FILES} 张图片。 `);
  const document = await PDFDocument.create();
  for (const file of files) {
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      throw new Error(`“${file.name}”不是支持的图片文件。 `);
    }
    const image = await embedImageForPdf(document, file);
    const imageSize = image.scale(1);
    const imageRatio = imageSize.width / imageSize.height;
    const pageWidth = imageRatio > 1 ? 841.89 : 595.28;
    const pageHeight = imageRatio > 1 ? 595.28 : 841.89;
    const margin = 36;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const scale = Math.min(maxWidth / imageSize.width, maxHeight / imageSize.height, 1);
    const width = imageSize.width * scale;
    const height = imageSize.height * scale;
    const page = document.addPage([pageWidth, pageHeight]);
    page.drawImage(image, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    });
  }
  return savePdf(document, name);
}

async function embedImageForPdf(document: PDFDocument, file: File) {
  if (file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name)) {
    return document.embedJpg(await file.arrayBuffer());
  }
  if (file.type === "image/png" || /\.png$/i.test(file.name)) {
    return document.embedPng(await file.arrayBuffer());
  }
  const imageData = await imageToPngBytes(file);
  return document.embedPng(imageData.bytes);
}

export async function createTextStamp(text: string) {
  const value = text.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!value) throw new Error("请输入水印文字。 ");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持 PDF 水印。 ");
  const fontSize = 64;
  const padding = 24;
  context.font = `700 ${fontSize}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
  const width = Math.ceil(context.measureText(value).width) + padding * 2;
  canvas.width = Math.max(160, width);
  canvas.height = fontSize + padding * 2;
  context.font = `700 ${fontSize}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
  context.textBaseline = "middle";
  context.fillStyle = "#17233f";
  context.fillText(value, padding, canvas.height / 2);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("无法生成水印数据。 ")), "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}
