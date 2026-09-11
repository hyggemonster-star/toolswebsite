"use client";

import { FileText, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { createPdfFromImages, formatPdfBytes, type PdfOutput } from "@/lib/pdf";
import { extractDocxText, isDocxFile, MAX_DOCX_TEXT_CHARACTERS, validateDocxFile } from "@/lib/docx";
import { formatBytes } from "@/lib/image";
import { FileDownloadLink, FileDropField, ProcessingStatus, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_MARGIN = 96;
const TEXT_SIZE = 30;
const LINE_HEIGHT = 48;

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : "DOCX 转 PDF 失败，请换一个文件后重试。";
}

function useObjectUrl(source: Blob | null) {
  const url = useMemo(() => source ? URL.createObjectURL(source) : "", [source]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function WordFilePicker({ file, onChange, onReject }: { file: File | null; onChange: (file: File | null) => void; onReject: (message: string) => void }) {
  const label = file ? file.name : "选择 DOCX 文件";
  const hint = file ? `${formatBytes(file.size)} · 只在浏览器本地读取` : "支持拖拽或点击选择 .docx 文件；不支持旧版 .doc";

  function accept(next: File | undefined) {
    if (!next) return;
    if (!isDocxFile(next)) {
      onChange(null);
      onReject("当前版本只支持 DOCX 文件，不支持旧版 .doc。 ");
      return;
    }
    try {
      validateDocxFile(next);
      onChange(next);
      onReject("");
    } catch (reason) {
      onChange(null);
      onReject(errorMessage(reason));
    }
  }

  return <FileDropField icon={FileText} className="pdf-upload-drop" label={label} hint={hint} accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onFilesSelected={(files) => accept(files[0])} />;
}

function wrapLine(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  const characters = Array.from(value);
  if (!characters.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const character of characters) {
    const candidate = current + character;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function canvasToJpegFile(canvas: HTMLCanvasElement, pageNumber: number) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("无法生成 PDF 页面图像。 ")), "image/jpeg", 0.92);
  });
  return new File([blob], `word-page-${String(pageNumber).padStart(3, "0")}.jpg`, { type: "image/jpeg" });
}

async function createTextPages(text: string) {
  const pages: File[] = [];
  type PageState = { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D };
  function createPage(): PageState {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器不支持 Canvas PDF 排版。 ");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    context.fillStyle = "#17233f";
    context.font = `${TEXT_SIZE}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
    context.textBaseline = "top";
    return { canvas, context };
  }

  async function flushPage(page: PageState) {
    pages.push(await canvasToJpegFile(page.canvas, pages.length + 1));
  }

  let page = createPage();
  let y = PAGE_MARGIN;
  const maxWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  for (const paragraph of text.split(/\r?\n/)) {
    const lines = wrapLine(page.context, paragraph, maxWidth);
    for (const line of lines) {
      if (y + LINE_HEIGHT > PAGE_HEIGHT - PAGE_MARGIN) {
        await flushPage(page);
        if (pages.length >= 20) throw new Error("正文超过 20 页，请先拆分 DOCX。 ");
        page = createPage();
        y = PAGE_MARGIN;
      }
      page.context.fillText(line, PAGE_MARGIN, y);
      y += LINE_HEIGHT;
    }
    y += LINE_HEIGHT * 0.35;
  }
  await flushPage(page);
  return pages;
}

function WordPdfOutputPanel({ output }: { output: PdfOutput | null }) {
  const url = useObjectUrl(output?.blob ?? null);
  if (!output) return null;
  return <div className="pdf-output-card"><div className="pdf-output-header"><div><span>处理结果</span><strong>{output.name}</strong><small>{output.pageCount} 页 · {formatPdfBytes(output.blob.size)}</small></div><FileDownloadLink url={url} name={output.name} label="下载 PDF" /></div></div>;
}

export function WordPdfToolRenderer({ tool }: { tool: ToolRecord }) {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function convert() {
    if (!file) return;
    setWorking(true);
    setError("");
    setOutput(null);
    try {
      const text = await extractDocxText(file);
      const pages = await createTextPages(text);
      setOutput(await createPdfFromImages(pages, `${file.name.replace(/\.docx$/i, "") || "document"}-converted.pdf`));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    setFile(null);
    setOutput(null);
    setError("");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="在浏览器本地提取 DOCX 正文文字，排版生成一份可打印的基础 PDF。" /><WordFilePicker file={file} onChange={(next) => { setFile(next); setOutput(null); setError(""); }} onReject={setError} />{file && <div className="pdf-file-list"><div className="pdf-file-row"><FileText size={15} /><span>{file.name}</span><small>{formatBytes(file.size)}</small></div><p>DOCX 正文只在当前设备内读取，最多 {MAX_DOCX_TEXT_CHARACTERS.toLocaleString()} 字、20 页。</p></div>}<div className="workspace-actions"><button type="button" className="primary-button" onClick={() => void convert()} disabled={!file || working}>{working ? <ProcessingStatus label="正在排版 PDF…" /> : <><FileText size={17} />转换为 PDF</>}</button><button type="button" className="soft-button" onClick={reset} disabled={working}><RefreshCw size={16} />重新选择</button><span className="count-note">只在当前浏览器处理，不上传 DOCX</span></div>{error && <p className="field-error">{error}</p>}<WordPdfOutputPanel output={output} /><ToolNotice tone="warning">当前版本只支持 DOCX 正文文字；图片、复杂版式、表格、页眉页脚、批注、目录和旧版 .doc 可能不会保留。结果是新的基础 PDF，适合阅读、打印和分享，不等同于原 Word 的版式级转换。</ToolNotice></div>;
}
