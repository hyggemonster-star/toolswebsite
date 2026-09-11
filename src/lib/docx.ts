export const MAX_DOCX_BYTES = 50 * 1024 * 1024;
export const MAX_DOCX_TEXT_CHARACTERS = 120_000;

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const DEFAULT_MAX_ZIP_ENTRY_BYTES = MAX_DOCX_TEXT_CHARACTERS * 8;

export function isDocxFile(file: File) {
  return file.type === DOCX_MIME || /\.docx$/i.test(file.name);
}

export function validateDocxFile(file: File) {
  if (!isDocxFile(file)) throw new Error("当前版本只支持 DOCX 文件，不支持旧版 .doc。 ");
  if (file.size > MAX_DOCX_BYTES) throw new Error("DOCX 超过 50 MB，暂不建议在浏览器中处理。 ");
}

function findEndOfCentralDirectory(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error("无法读取压缩包目录，文件可能损坏。 ");
}

function getZipEntry(bytes: Uint8Array, fileName: string, maxUncompressedBytes = DEFAULT_MAX_ZIP_ENTRY_BYTES) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOffset = findEndOfCentralDirectory(bytes);
  const entryCount = view.getUint16(endOffset + 10, true);
  const centralOffset = view.getUint32(endOffset + 16, true);
  const decoder = new TextDecoder();
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error("压缩包目录不完整。 ");
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    const localOffset = view.getUint32(cursor + 42, true);
    if (name === fileName) {
      if (uncompressedSize > maxUncompressedBytes) throw new Error(`压缩内容解压后超过 ${maxUncompressedBytes.toLocaleString()} 字节，无法在浏览器中安全处理。 `);
      const localView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (localView.getUint32(localOffset, true) !== 0x04034b50) throw new Error("压缩包入口无效。 ");
      const localNameLength = localView.getUint16(localOffset + 26, true);
      const localExtraLength = localView.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      return { method, compressed };
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error("压缩包中没有找到指定内容。 ");
}

async function decompressZipEntry(entry: { method: number; compressed: Uint8Array }, maxUncompressedBytes: number) {
  if (entry.method === 0) return entry.compressed;
  if (entry.method !== 8 || typeof DecompressionStream === "undefined") throw new Error("当前浏览器不支持 Office 文档解压，请使用最新版 Chrome、Edge 或 Firefox。 ");
  const compressed = entry.compressed.slice().buffer as ArrayBuffer;
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const output = new Uint8Array(await new Response(stream).arrayBuffer());
  if (output.byteLength > maxUncompressedBytes) throw new Error(`压缩内容解压后超过 ${maxUncompressedBytes.toLocaleString()} 字节，无法在浏览器中安全处理。 `);
  return output;
}

export async function readZipEntry(bytes: Uint8Array, fileName: string, maxUncompressedBytes = DEFAULT_MAX_ZIP_ENTRY_BYTES) {
  return decompressZipEntry(getZipEntry(bytes, fileName, maxUncompressedBytes), maxUncompressedBytes);
}

export async function extractDocxText(file: File) {
  validateDocxFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const xmlBytes = await readZipEntry(bytes, "word/document.xml");
  const xml = new TextDecoder().decode(xmlBytes);
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) throw new Error("DOCX 正文 XML 无法解析，文件可能损坏。 ");
  const paragraphs = Array.from(document.getElementsByTagNameNS(WORD_NAMESPACE, "p")).map((paragraph) => Array.from(paragraph.getElementsByTagNameNS(WORD_NAMESPACE, "t")).map((text) => text.textContent ?? "").join(""));
  const text = paragraphs.join("\n").replace(/[ \t]+\n/g, "\n").trim();
  if (!text) throw new Error("没有提取到可转换的正文文字；当前版本不处理纯图片扫描文档。 ");
  if (Array.from(text).length > MAX_DOCX_TEXT_CHARACTERS) throw new Error(`正文超过 ${MAX_DOCX_TEXT_CHARACTERS.toLocaleString()} 字，请先拆分 DOCX。 `);
  return text;
}
