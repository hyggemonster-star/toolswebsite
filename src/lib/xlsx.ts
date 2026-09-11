import { readZipEntry } from "./docx";

export const MAX_XLSX_BYTES = 50 * 1024 * 1024;
export const MAX_XLSX_TEXT_CHARACTERS = 120_000;
const MAX_XLSX_ZIP_ENTRY_BYTES = 12 * 1024 * 1024;

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const SPREADSHEET_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELATIONSHIPS_NAMESPACE = "http://schemas.openxmlformats.org/package/2006/relationships";
const DOCUMENT_RELATIONSHIP_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export function isXlsxFile(file: File) {
  return file.type === XLSX_MIME || /\.xlsx$/i.test(file.name);
}

export function validateXlsxFile(file: File) {
  if (!isXlsxFile(file)) throw new Error("当前版本只支持 XLSX 文件，不支持旧版 .xls。 ");
  if (file.size > MAX_XLSX_BYTES) throw new Error("XLSX 超过 50 MB，暂不建议在浏览器中处理。 ");
}

function parseXml(bytes: Uint8Array, message: string) {
  const document = new DOMParser().parseFromString(new TextDecoder().decode(bytes), "application/xml");
  if (document.querySelector("parsererror")) throw new Error(message);
  return document;
}

function resolveWorkbookTarget(target: string) {
  const normalized = target.replace(/\\/g, "/").replace(/^\/+/, "");
  const source = normalized.startsWith("xl/") ? normalized.split("/") : ["xl", ...normalized.split("/")];
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

function getNodeText(node: Element, name: string) {
  return Array.from(node.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, name)).map((item) => item.textContent ?? "").join("");
}

async function readSharedStrings(bytes: Uint8Array) {
  try {
    const sharedBytes = await readZipEntry(bytes, "xl/sharedStrings.xml", MAX_XLSX_ZIP_ENTRY_BYTES);
    const document = parseXml(sharedBytes, "XLSX 共享字符串无法解析，文件可能损坏。 ");
    return Array.from(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "si")).map((item) => getNodeText(item, "t"));
  } catch (reason) {
    if (reason instanceof Error && /没有找到/.test(reason.message)) return [];
    throw reason;
  }
}

function cellValue(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute("t");
  if (type === "s") {
    const index = Number(getNodeText(cell, "v"));
    return Number.isInteger(index) ? (sharedStrings[index] ?? "") : "";
  }
  if (type === "inlineStr") return getNodeText(cell, "t");
  if (type === "b") return getNodeText(cell, "v") === "1" ? "TRUE" : "FALSE";
  return getNodeText(cell, "v");
}

async function extractWorksheetText(bytes: Uint8Array, path: string, sharedStrings: string[]) {
  const document = parseXml(await readZipEntry(bytes, path, MAX_XLSX_ZIP_ENTRY_BYTES), "XLSX 工作表无法解析，文件可能损坏。 ");
  return Array.from(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "row")).map((row) => {
    const cells = Array.from(row.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "c"));
    return cells.map((cell) => cellValue(cell, sharedStrings).trim()).join("\t").replace(/\t+$/, "");
  }).filter((row) => row.trim()).join("\n");
}

export async function extractXlsxText(file: File) {
  validateXlsxFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const workbook = parseXml(await readZipEntry(bytes, "xl/workbook.xml", MAX_XLSX_ZIP_ENTRY_BYTES), "XLSX 工作簿无法解析，文件可能损坏。 ");
  const relationships = parseXml(await readZipEntry(bytes, "xl/_rels/workbook.xml.rels", MAX_XLSX_ZIP_ENTRY_BYTES), "XLSX 工作表关系无法解析，文件可能损坏。 ");
  const relationshipMap = new Map(Array.from(relationships.getElementsByTagNameNS(RELATIONSHIPS_NAMESPACE, "Relationship")).map((item) => [item.getAttribute("Id") ?? "", item.getAttribute("Target") ?? ""]));
  const sharedStrings = await readSharedStrings(bytes);
  const sections: string[] = [];

  for (const sheet of Array.from(workbook.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "sheet"))) {
    const name = sheet.getAttribute("name")?.trim() || "未命名工作表";
    const relationshipId = sheet.getAttributeNS(DOCUMENT_RELATIONSHIP_NAMESPACE, "id") ?? sheet.getAttribute("r:id") ?? "";
    const target = relationshipMap.get(relationshipId);
    if (!target) continue;
    const text = await extractWorksheetText(bytes, resolveWorkbookTarget(target), sharedStrings);
    if (text) sections.push(`【${name}】\n${text}`);
  }

  const text = sections.join("\n\n").trim();
  if (!text) throw new Error("没有提取到可转换的工作表文字；当前版本不处理纯图片或空白工作簿。 ");
  if (Array.from(text).length > MAX_XLSX_TEXT_CHARACTERS) throw new Error(`工作表文字超过 ${MAX_XLSX_TEXT_CHARACTERS.toLocaleString()} 字，请先拆分 XLSX。 `);
  return text;
}
