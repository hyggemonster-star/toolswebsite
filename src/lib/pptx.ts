import { readZipEntry } from "./docx";

export const MAX_PPTX_BYTES = 50 * 1024 * 1024;
export const MAX_PPTX_TEXT_CHARACTERS = 120_000;
const MAX_PPTX_ZIP_ENTRY_BYTES = 12 * 1024 * 1024;

const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const PRESENTATION_NAMESPACE = "http://schemas.openxmlformats.org/presentationml/2006/main";
const DRAWINGML_NAMESPACE = "http://schemas.openxmlformats.org/drawingml/2006/main";
const RELATIONSHIPS_NAMESPACE = "http://schemas.openxmlformats.org/package/2006/relationships";
const DOCUMENT_RELATIONSHIP_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export function isPptxFile(file: File) {
  return file.type === PPTX_MIME || /\.pptx$/i.test(file.name);
}

export function validatePptxFile(file: File) {
  if (!isPptxFile(file)) throw new Error("当前版本只支持 PPTX 文件，不支持旧版 .ppt。 ");
  if (file.size > MAX_PPTX_BYTES) throw new Error("PPTX 超过 50 MB，暂不建议在浏览器中处理。 ");
}

function parseXml(bytes: Uint8Array, message: string) {
  const document = new DOMParser().parseFromString(new TextDecoder().decode(bytes), "application/xml");
  if (document.querySelector("parsererror")) throw new Error(message);
  return document;
}

function resolvePresentationTarget(target: string) {
  const normalized = target.replace(/\\/g, "/").replace(/^\/+/, "");
  const source = normalized.startsWith("ppt/") ? normalized.split("/") : ["ppt", ...normalized.split("/")];
  const segments: string[] = [];
  for (const segment of source) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join("/");
}

function paragraphText(paragraph: Element) {
  return Array.from(paragraph.getElementsByTagNameNS(DRAWINGML_NAMESPACE, "t")).map((item) => item.textContent ?? "").join("").trim();
}

async function extractSlideText(bytes: Uint8Array, path: string) {
  const document = parseXml(await readZipEntry(bytes, path, MAX_PPTX_ZIP_ENTRY_BYTES), "PPTX 幻灯片无法解析，文件可能损坏。 ");
  return Array.from(document.getElementsByTagNameNS(DRAWINGML_NAMESPACE, "p")).map(paragraphText).filter(Boolean).join("\n");
}

export async function extractPptxText(file: File) {
  validatePptxFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const presentation = parseXml(await readZipEntry(bytes, "ppt/presentation.xml", MAX_PPTX_ZIP_ENTRY_BYTES), "PPTX 演示文稿无法解析，文件可能损坏。 ");
  const relationships = parseXml(await readZipEntry(bytes, "ppt/_rels/presentation.xml.rels", MAX_PPTX_ZIP_ENTRY_BYTES), "PPTX 幻灯片关系无法解析，文件可能损坏。 ");
  const relationshipMap = new Map(Array.from(relationships.getElementsByTagNameNS(RELATIONSHIPS_NAMESPACE, "Relationship")).map((item) => [item.getAttribute("Id") ?? "", item.getAttribute("Target") ?? ""]));
  const slideIds = Array.from(presentation.getElementsByTagNameNS(PRESENTATION_NAMESPACE, "sldId"));
  const sections: string[] = [];

  for (const [index, slide] of slideIds.entries()) {
    const relationshipId = slide.getAttributeNS(DOCUMENT_RELATIONSHIP_NAMESPACE, "id") ?? slide.getAttribute("r:id") ?? "";
    const target = relationshipMap.get(relationshipId);
    if (!target) continue;
    const text = await extractSlideText(bytes, resolvePresentationTarget(target));
    if (text) sections.push(`【第 ${index + 1} 页】\n${text}`);
  }

  const text = sections.join("\n\n").trim();
  if (!text) throw new Error("没有提取到可转换的幻灯片文字；当前版本不处理纯图片或空白演示文稿。 ");
  if (Array.from(text).length > MAX_PPTX_TEXT_CHARACTERS) throw new Error(`幻灯片文字超过 ${MAX_PPTX_TEXT_CHARACTERS.toLocaleString()} 字，请先拆分 PPTX。 `);
  return text;
}
