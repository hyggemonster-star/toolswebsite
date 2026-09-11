"use client";

import { FileText, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { formatPdfBytes, type PdfOutput } from "@/lib/pdf";
import { extractDocxText, isDocxFile, MAX_DOCX_TEXT_CHARACTERS, validateDocxFile } from "@/lib/docx";
import { formatBytes } from "@/lib/image";
import { createTextPdf, MAX_TEXT_PDF_PAGES } from "@/lib/text-pdf";
import { FileDownloadLink, FileDropField, ProcessingStatus, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

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
      setOutput(await createTextPdf(text, `${file.name.replace(/\.docx$/i, "") || "document"}-converted.pdf`));
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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="在浏览器本地提取 DOCX 正文文字，排版生成一份可打印的基础 PDF。" /><WordFilePicker file={file} onChange={(next) => { setFile(next); setOutput(null); setError(""); }} onReject={setError} />{file && <div className="pdf-file-list"><div className="pdf-file-row"><FileText size={15} /><span>{file.name}</span><small>{formatBytes(file.size)}</small></div><p>DOCX 正文只在当前设备内读取，最多 {MAX_DOCX_TEXT_CHARACTERS.toLocaleString()} 字、{MAX_TEXT_PDF_PAGES} 页。</p></div>}<div className="workspace-actions"><button type="button" className="primary-button" onClick={() => void convert()} disabled={!file || working}>{working ? <ProcessingStatus label="正在排版 PDF…" /> : <><FileText size={17} />转换为 PDF</>}</button><button type="button" className="soft-button" onClick={reset} disabled={working}><RefreshCw size={16} />重新选择</button><span className="count-note">只在当前浏览器处理，不上传 DOCX</span></div>{error && <p className="field-error">{error}</p>}<WordPdfOutputPanel output={output} /><ToolNotice tone="warning">当前版本只支持 DOCX 正文文字；图片、复杂版式、表格、页眉页脚、批注、目录和旧版 .doc 可能不会保留。结果是新的基础 PDF，适合阅读、打印和分享，不等同于原 Word 的版式级转换。</ToolNotice></div>;
}
