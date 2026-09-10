"use client";

/* PDF previews are local object URLs and intentionally bypass image optimization. */
/* eslint-disable @next/next/no-img-element */

import { FileText, Files, Hash, ImagePlus, ListOrdered, RefreshCw, RotateCw, Scissors, Stamp, Trash2, type LucideIcon } from "lucide-react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ToolRecord } from "@/data/tools";
import { canvasToBlob, type ImageMime, type ImageOutput } from "@/lib/image";
import {
  createPdfFromImages,
  createTextStamp,
  copyPagesToNewDocument,
  formatPdfBytes,
  isPdfFile,
  loadPdf,
  pdfBaseName,
  pageOrderToIndices,
  pageSpecToIndices,
  pdfOutputName,
  savePdf,
  validatePdfFiles,
  type PdfOutput,
} from "@/lib/pdf";
import { FileDownloadLink, FileDropField, ProcessingStatus, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

type PickerKind = "pdf" | "image";
type PdfImageFormat = "png" | "jpeg";
type PdfImageOutput = ImageOutput & { pageNumber: number; width: number; height: number };

const MAX_RENDER_PAGES = 15;
const MAX_RENDER_PAGE_PIXELS = 8_000_000;
const MAX_RENDER_TOTAL_PIXELS = 30_000_000;

function pdfImageName(file: File, pageNumber: number, format: PdfImageFormat) {
  return `${pdfBaseName(file.name)}-page-${String(pageNumber).padStart(3, "0")}.${format === "png" ? "png" : "jpg"}`;
}

async function renderPdfPages(file: File, pageSpec: string, scale: number, format: PdfImageFormat) {
  validatePdfFiles([file]);
  if (!Number.isFinite(scale) || scale < 0.75 || scale > 2) throw new Error("导出清晰度不在支持范围内，请重新选择。 ");

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), maxImageSize: MAX_RENDER_PAGE_PIXELS });
  const document = await loadingTask.promise;

  try {
    const pageNumbers = pageSpecToIndices(pageSpec, document.numPages).map((index) => index + 1);
    if (pageNumbers.length > MAX_RENDER_PAGES) throw new Error(`一次最多导出 ${MAX_RENDER_PAGES} 页，以免浏览器占用过多内存。 `);

    const mime: ImageMime = format === "png" ? "image/png" : "image/jpeg";
    const outputs: PdfImageOutput[] = [];
    let totalPixels = 0;
    for (const pageNumber of pageNumbers) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const width = Math.ceil(viewport.width);
      const height = Math.ceil(viewport.height);
      const pixels = width * height;
      if (pixels > MAX_RENDER_PAGE_PIXELS) throw new Error(`第 ${pageNumber} 页导出尺寸过大，请降低清晰度。 `);
      totalPixels += pixels;
      if (totalPixels > MAX_RENDER_TOTAL_PIXELS) throw new Error("选中的页面总像素过大，请减少页数或降低清晰度。 ");

      const canvas = window.document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("当前浏览器不支持 PDF 页面渲染。 ");
      if (format === "jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const blob = await canvasToBlob(canvas, mime, format === "jpeg" ? 0.92 : 1);
      outputs.push({ blob, name: pdfImageName(file, pageNumber, format), mime, pageNumber, width, height });
      canvas.width = 1;
      canvas.height = 1;
      page.cleanup();
    }
    return outputs;
  } finally {
    await loadingTask.destroy();
  }
}

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : "处理失败，请换一个文件后重试。";
}

function useObjectUrl(source: Blob | null) {
  const url = useMemo(() => source ? URL.createObjectURL(source) : "", [source]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name);
}

function LocalFilePicker({ kind, files, onChange, multiple = false, onReject }: { kind: PickerKind; files: File[]; onChange: (files: File[]) => void; multiple?: boolean; onReject: (message: string) => void }) {
  const isAccepted = kind === "pdf" ? isPdfFile : isImageFile;
  const acceptedLabel = kind === "pdf" ? "PDF 文件" : "JPG、PNG 或 WEBP 图片";
  const fileLabel = files.length === 0 ? `选择${multiple ? "文件" : acceptedLabel}` : multiple ? `${files.length} 个文件已选择` : files[0].name;
  const fileHint = files.length === 0 ? `支持拖拽或点击选择；${kind === "pdf" ? "文件" : "图片"}只在浏览器本地读取` : `${files.map((file) => file.name).slice(0, 2).join("、")}${files.length > 2 ? ` 等 ${files.length} 个` : ""}`;

  function acceptFiles(nextFiles: File[]) {
    const accepted = nextFiles.filter(isAccepted);
    onChange(accepted);
    if (accepted.length !== nextFiles.length) onReject(`只支持${acceptedLabel}，不符合的文件已忽略。 `);
  }

  return <FileDropField icon={kind === "pdf" ? FileText : ImagePlus} className="pdf-upload-drop" label={fileLabel} hint={fileHint} accept={kind === "pdf" ? ".pdf,application/pdf" : "image/jpeg,image/png,image/webp"} multiple={multiple} onFilesSelected={acceptFiles} />;
}

function SelectedFileList({ files, kind }: { files: File[]; kind: PickerKind }) {
  if (!files.length) return null;
  return <div className="pdf-file-list">{files.map((file) => <div className="pdf-file-row" key={`${file.name}-${file.lastModified}-${file.size}`}><FileText size={15} /><span>{file.name}</span><small>{formatPdfBytes(file.size)}</small></div>)}<p>{kind === "pdf" ? "PDF 内容只在当前设备内读取。" : "图片会按顺序排版为 PDF 页面。"}</p></div>;
}

function PdfOutputPanel({ output, originalSize }: { output: PdfOutput | null; originalSize?: number }) {
  const url = useObjectUrl(output?.blob ?? null);
  if (!output) return null;
  return <div className="pdf-output-card"><div className="pdf-output-header"><div><span>处理结果</span><strong>{output.name}</strong><small>{output.pageCount} 页 · {formatPdfBytes(output.blob.size)}{originalSize ? `（原文件 ${formatPdfBytes(originalSize)}）` : ""}</small></div><FileDownloadLink url={url} name={output.name} label="下载 PDF" /></div></div>;
}

function PdfImageOutputRow({ output }: { output: PdfImageOutput }) {
  const url = useObjectUrl(output.blob);
  return <div className="pdf-image-output-row"><img src={url} alt={`第 ${output.pageNumber} 页预览`} /><div className="pdf-image-output-meta"><strong>第 {output.pageNumber} 页</strong><small>{output.width} × {output.height} px · {formatPdfBytes(output.blob.size)}</small></div><FileDownloadLink url={url} name={output.name} label="下载图片" /></div>;
}

function PdfImageOutputPanel({ outputs, format }: { outputs: PdfImageOutput[]; format: PdfImageFormat }) {
  if (!outputs.length) return null;
  return <div className="pdf-image-output-list"><div className="pdf-image-output-heading"><span>导出结果</span><small>{outputs.length} 张 {format === "png" ? "PNG" : "JPG"} 图片</small></div>{outputs.map((output) => <PdfImageOutputRow output={output} key={output.name} />)}</div>;
}

function PdfWorkspace({ title, description, kind = "pdf", files, onFilesChange, multiple = false, children, onProcess, buttonLabel, icon: Icon, output, originalSize, error, working, canRun = files.length > 0, notice, noticeTone = "privacy" }: { title: string; description: string; kind?: PickerKind; files: File[]; onFilesChange: (files: File[]) => void; multiple?: boolean; children?: ReactNode; onProcess: () => void; buttonLabel: string; icon: LucideIcon; output: PdfOutput | null; originalSize?: number; error: string; working: boolean; canRun?: boolean; notice: ReactNode; noticeTone?: "info" | "privacy" | "warning" }) {
  const [pickerError, setPickerError] = useState("");

  function handleFiles(next: File[]) {
    setPickerError("");
    onFilesChange(next);
  }

  return <div className="workspace-card"><WorkspaceHeader title={title} description={description} /><LocalFilePicker kind={kind} files={files} multiple={multiple} onChange={handleFiles} onReject={setPickerError} /><SelectedFileList files={files} kind={kind} />{children}<div className="workspace-actions"><button type="button" className="primary-button" onClick={onProcess} disabled={!canRun || working}>{working ? <ProcessingStatus /> : <><Icon size={17} />{buttonLabel}</>}</button>{output && <span className="count-note">结果已生成，可下载保存</span>}</div>{(error || pickerError) && <p className="field-error">{error || pickerError}</p>}<PdfOutputPanel output={output} originalSize={originalSize} /><ToolNotice tone={noticeTone}>{notice}</ToolNotice></div>;
}

function usePdfPageCount(file: File | null) {
  const [result, setResult] = useState<{ file: File; pageCount: number; error: string } | null>(null);

  useEffect(() => {
    let active = true;
    if (!file) return () => { active = false; };
    loadPdf(file).then((document) => {
      if (active) setResult({ file, pageCount: document.getPageCount(), error: "" });
    }).catch((reason: unknown) => {
      if (active) setResult({ file, pageCount: 0, error: errorMessage(reason) });
    });
    return () => { active = false; };
  }, [file]);

  return result?.file === file ? { pageCount: result.pageCount, error: result.error } : { pageCount: 0, error: "" };
}

function PageSpecField({ value, onChange, pageCount, label = "页面范围", placeholder = "例如 1-3,5" }: { value: string; onChange: (value: string) => void; pageCount: number; label?: string; placeholder?: string }) {
  return <div className="pdf-page-controls"><label className="tool-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode="text" /></label><p>{pageCount ? `共 ${pageCount} 页；支持 1-3、5，也可以填写“全部”` : "选择 PDF 后读取页数"}</p></div>;
}

function PdfToImageTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState("全部");
  const [scale, setScale] = useState("1.5");
  const [format, setFormat] = useState<PdfImageFormat>("png");
  const [outputs, setOutputs] = useState<PdfImageOutput[]>([]);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;
  const pageState = usePdfPageCount(file);

  async function convert() {
    if (!file) return;
    setError("");
    setOutputs([]);
    try {
      if (pageState.pageCount > MAX_RENDER_PAGES && (!pages.trim() || pages.trim() === "全部")) throw new Error(`这个 PDF 有 ${pageState.pageCount} 页，一次最多导出 ${MAX_RENDER_PAGES} 页，请填写页面范围。 `);
      setOutputs(await renderPdfPages(file, pages, Number(scale), format));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="PDF 转图片" description="把 PDF 页面在浏览器本地渲染为 PNG 或 JPG，适合预览、分享和发布。" /><LocalFilePicker kind="pdf" files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setPages("全部"); setOutputs([]); setError(""); }} onReject={setError} /><SelectedFileList files={files} kind="pdf" /><div className="pdf-option-grid"><PageSpecField value={pages} onChange={setPages} pageCount={pageState.pageCount} /><label className="tool-field"><span>导出格式</span><select value={format} onChange={(event) => setFormat(event.target.value as PdfImageFormat)}><option value="png">PNG · 文字更清晰</option><option value="jpeg">JPG · 文件更小</option></select></label><label className="tool-field"><span>清晰度</span><select value={scale} onChange={(event) => setScale(event.target.value)}><option value="0.75">较小 · 0.75×</option><option value="1">标准 · 1×</option><option value="1.5">清晰 · 1.5×</option><option value="2">高清 · 2×</option></select></label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => { setWorking(true); void convert(); }} disabled={!file || !pageState.pageCount || working}>{working ? <ProcessingStatus /> : <><ImagePlus size={17} />导出图片</>}</button>{outputs.length > 0 && <span className="count-note">{outputs.length} 张图片已生成，可下载保存</span>}</div>{(error || pageState.error) && <p className="field-error">{error || pageState.error}</p>}<PdfImageOutputPanel outputs={outputs} format={format} /><ToolNotice tone="privacy">PDF 只在当前浏览器中读取，不会上传服务器；一次最多导出 15 页，页面过大时请降低清晰度或减少范围。</ToolNotice></div>;
}

function PdfMergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function merge() {
    setError("");
    setOutput(null);
    try {
      validatePdfFiles(files, true);
      if (files.length < 2) throw new Error("请至少选择两个 PDF 文件。 ");
      const document = await PDFDocument.create();
      for (const file of files) {
        const source = await loadPdf(file);
        const pages = await document.copyPages(source, source.getPageIndices());
        pages.forEach((page) => document.addPage(page));
      }
      setOutput(await savePdf(document, "merged-document.pdf"));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <PdfWorkspace title="PDF 合并" description="按选择顺序合并多个 PDF，结果只在浏览器本地生成。" files={files} multiple onFilesChange={(next) => { setFiles(next); setOutput(null); setError(""); }} onProcess={() => { setWorking(true); void merge(); }} buttonLabel="合并 PDF" icon={Files} output={output} error={error} working={working} canRun={files.length >= 2} notice="文件不会上传服务器；建议先按文件名或选择顺序确认合并顺序。" />;
}

function PdfCompressTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;

  async function compress() {
    if (!file) return;
    setError("");
    setOutput(null);
    try {
      const source = await loadPdf(file);
      setOutput(await savePdf(source, pdfOutputName(file, "-optimized")));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <PdfWorkspace title="PDF 压缩" description="重新整理 PDF 结构，尽量减少文件体积并保持页面内容。" files={files} onFilesChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} onProcess={() => { setWorking(true); void compress(); }} buttonLabel="优化 PDF" icon={RefreshCw} output={output} originalSize={file?.size} error={error} working={working} notice="浏览器端不会重新编码 PDF 内嵌图片；如果原文件已经很紧凑，结果体积可能变化不大。" noticeTone="warning" />;
}

function PdfSplitTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState("");
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;
  const pageState = usePdfPageCount(file);

  async function split() {
    if (!file) return;
    setError("");
    setOutput(null);
    try {
      const source = await loadPdf(file);
      const indices = pageSpecToIndices(pages, source.getPageCount());
      const document = await copyPagesToNewDocument(source, indices);
      setOutput(await savePdf(document, pdfOutputName(file, "-split")));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <PdfWorkspace title="PDF 拆分" description="按页码范围提取需要的页面，生成一个新的 PDF。" files={files} onFilesChange={(next) => { setFiles(next.slice(0, 1)); setPages(""); setOutput(null); setError(""); }} onProcess={() => { setWorking(true); void split(); }} buttonLabel="导出选中页面" icon={Scissors} output={output} error={error || pageState.error} working={working} canRun={Boolean(file && pageState.pageCount)} notice="示例：1-3,5；页面编号从 1 开始，原 PDF 不会被修改。"><PageSpecField value={pages} onChange={setPages} pageCount={pageState.pageCount} /></PdfWorkspace>;
}

function ImageToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function convert() {
    setError("");
    setOutput(null);
    try {
      setOutput(await createPdfFromImages(files, "images-document.pdf"));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <PdfWorkspace title="图片转 PDF" description="将多张图片按选择顺序排版为 PDF，每张图片一页。" kind="image" files={files} multiple onFilesChange={(next) => { setFiles(next); setOutput(null); setError(""); }} onProcess={() => { setWorking(true); void convert(); }} buttonLabel="生成 PDF" icon={FileText} output={output} error={error} working={working} notice="图片只在当前浏览器中读取，页面大小会根据横竖版比例自动适配 A4。" />;
}

function PdfWatermarkTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("仅供内部使用");
  const [opacity, setOpacity] = useState("0.18");
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;

  async function watermark() {
    if (!file) return;
    setError("");
    setOutput(null);
    try {
      const document = await loadPdf(file);
      const stamp = await createTextStamp(text);
      const image = await document.embedPng(stamp);
      const imageSize = image.scale(1);
      const alpha = Math.min(0.6, Math.max(0.05, Number(opacity) || 0.18));
      for (const page of document.getPages()) {
        const { width, height } = page.getSize();
        const scale = Math.min((width * 0.7) / imageSize.width, (height * 0.2) / imageSize.height);
        const stampWidth = imageSize.width * scale;
        const stampHeight = imageSize.height * scale;
        page.drawImage(image, { x: (width - stampWidth) / 2, y: (height - stampHeight) / 2, width: stampWidth, height: stampHeight, rotate: degrees(-28), opacity: alpha });
      }
      setOutput(await savePdf(document, pdfOutputName(file, "-watermarked")));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <PdfWorkspace title="PDF 加水印" description="为每一页添加文字水印，支持中文并在本地完成。" files={files} onFilesChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} onProcess={() => { setWorking(true); void watermark(); }} buttonLabel="添加水印" icon={Stamp} output={output} error={error} working={working} canRun={Boolean(file && text.trim())} notice="水印会以半透明斜向文字添加到每一页；请确认你拥有文件的编辑权限。" noticeTone="warning"><div className="pdf-option-grid"><label className="tool-field"><span>水印文字</span><input value={text} maxLength={80} onChange={(event) => setText(event.target.value)} placeholder="例如：仅供内部使用" /></label><label className="tool-field"><span>透明度 <strong>{Math.round(Number(opacity) * 100)}%</strong></span><input type="range" min="0.05" max="0.6" step="0.01" value={opacity} onChange={(event) => setOpacity(event.target.value)} /></label></div></PdfWorkspace>;
}

function PdfRotateTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState("全部");
  const [angle, setAngle] = useState("90");
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;
  const pageState = usePdfPageCount(file);

  async function rotate() {
    if (!file) return;
    setError("");
    setOutput(null);
    try {
      const document = await loadPdf(file);
      const indices = pageSpecToIndices(pages, document.getPageCount());
      const amount = Number(angle);
      for (const index of indices) {
        const page = document.getPage(index);
        const next = ((page.getRotation().angle + amount) % 360 + 360) % 360;
        page.setRotation(degrees(next));
      }
      setOutput(await savePdf(document, pdfOutputName(file, `-rotated-${angle}`)));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <PdfWorkspace title="PDF 页面旋转" description="旋转全部页面或指定页码，保持其他内容不变。" files={files} onFilesChange={(next) => { setFiles(next.slice(0, 1)); setPages("全部"); setOutput(null); setError(""); }} onProcess={() => { setWorking(true); void rotate(); }} buttonLabel="旋转页面" icon={RotateCw} output={output} error={error || pageState.error} working={working} canRun={Boolean(file && pageState.pageCount)} notice="示例：1-3；旋转是 PDF 页面方向设置，不会重新编码页面内容。"><div className="pdf-option-grid"><PageSpecField value={pages} onChange={setPages} pageCount={pageState.pageCount} label="要旋转的页面" /><label className="tool-field"><span>旋转角度</span><select value={angle} onChange={(event) => setAngle(event.target.value)}><option value="90">顺时针 90°</option><option value="180">旋转 180°</option><option value="270">顺时针 270°</option></select></label></div></PdfWorkspace>;
}

function PdfDeletePagesTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState("");
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;
  const pageState = usePdfPageCount(file);

  async function removePages() {
    if (!file) return;
    setError("");
    setOutput(null);
    try {
      const document = await loadPdf(file);
      const indices = pageSpecToIndices(pages, document.getPageCount());
      if (indices.length >= document.getPageCount()) throw new Error("不能删除全部页面，请至少保留一页。 ");
      [...indices].sort((a, b) => b - a).forEach((index) => document.removePage(index));
      setOutput(await savePdf(document, pdfOutputName(file, "-without-pages")));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <PdfWorkspace title="PDF 删除页面" description="删除不需要的页面，导出一份新的 PDF 文件。" files={files} onFilesChange={(next) => { setFiles(next.slice(0, 1)); setPages(""); setOutput(null); setError(""); }} onProcess={() => { setWorking(true); void removePages(); }} buttonLabel="删除选中页面" icon={Trash2} output={output} error={error || pageState.error} working={working} canRun={Boolean(file && pageState.pageCount)} notice="示例：2,4-6；原文件不会被覆盖，删除前请确认页码。" noticeTone="warning"><PageSpecField value={pages} onChange={setPages} pageCount={pageState.pageCount} label="要删除的页面" /></PdfWorkspace>;
}

function PdfReorderPagesTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageOrderInput, setPageOrderInput] = useState("");
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;
  const pageState = usePdfPageCount(file);
  const pages = pageOrderInput || (pageState.pageCount ? Array.from({ length: pageState.pageCount }, (_, index) => index + 1).join(",") : "");

  async function reorder() {
    if (!file) return;
    setError("");
    setOutput(null);
    try {
      const source = await loadPdf(file);
      const indices = pageOrderToIndices(pages, source.getPageCount());
      const document = await copyPagesToNewDocument(source, indices);
      setOutput(await savePdf(document, pdfOutputName(file, "-reordered")));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <PdfWorkspace title="PDF 页面重新排序" description="按新的页码顺序重排页面，适合整理扫描件和资料。" files={files} onFilesChange={(next) => { setFiles(next.slice(0, 1)); setPageOrderInput(""); setOutput(null); setError(""); }} onProcess={() => { setWorking(true); void reorder(); }} buttonLabel="导出新顺序" icon={ListOrdered} output={output} error={error || pageState.error} working={working} canRun={Boolean(file && pageState.pageCount)} notice="请包含全部页码，例如原文件 1、2、3 页可填写 3,1,2；不能重复或遗漏。"><PageSpecField value={pages} onChange={setPageOrderInput} pageCount={pageState.pageCount} label="新的页面顺序" placeholder="例如 3,1,2" /></PdfWorkspace>;
}

function PdfPageNumbersTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [start, setStart] = useState("1");
  const [position, setPosition] = useState("bottom-center");
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;

  async function addNumbers() {
    if (!file) return;
    setError("");
    setOutput(null);
    try {
      const first = Number(start);
      if (!Number.isInteger(first) || first < 0) throw new Error("起始页码请输入 0 或更大的整数。 ");
      const document = await loadPdf(file);
      const font = await document.embedFont(StandardFonts.Helvetica);
      document.getPages().forEach((page, index) => {
        const label = String(first + index);
        const { width, height } = page.getSize();
        const size = 10;
        const textWidth = font.widthOfTextAtSize(label, size);
        const x = position.endsWith("left") ? 36 : position.endsWith("right") ? width - 36 - textWidth : (width - textWidth) / 2;
        const y = position.startsWith("top") ? height - 36 : 24;
        page.drawText(label, { x, y, size, font, color: rgb(0.34, 0.38, 0.47) });
      });
      setOutput(await savePdf(document, pdfOutputName(file, "-numbered")));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <PdfWorkspace title="PDF 添加页码" description="为每一页添加连续页码，支持起始数字和位置设置。" files={files} onFilesChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} onProcess={() => { setWorking(true); void addNumbers(); }} buttonLabel="添加页码" icon={Hash} output={output} error={error} working={working} canRun={Boolean(file)} notice="页码会以浅灰色小字添加到页面边缘；原 PDF 不会被覆盖。"><div className="pdf-option-grid"><label className="tool-field"><span>起始页码</span><input type="number" min="0" value={start} onChange={(event) => setStart(event.target.value)} /></label><label className="tool-field"><span>页码位置</span><select value={position} onChange={(event) => setPosition(event.target.value)}><option value="bottom-center">底部居中</option><option value="bottom-left">底部左侧</option><option value="bottom-right">底部右侧</option><option value="top-center">顶部居中</option></select></label></div></PdfWorkspace>;
}

export function PdfToolRenderer({ tool }: { tool: ToolRecord }) {
  switch (tool.slug) {
    case "pdf-to-image": return <PdfToImageTool />;
    case "pdf-merge": return <PdfMergeTool />;
    case "pdf-compress": return <PdfCompressTool />;
    case "pdf-split": return <PdfSplitTool />;
    case "image-to-pdf": return <ImageToPdfTool />;
    case "pdf-watermark": return <PdfWatermarkTool />;
    case "pdf-rotate": return <PdfRotateTool />;
    case "pdf-delete-pages": return <PdfDeletePagesTool />;
    case "pdf-reorder-pages": return <PdfReorderPagesTool />;
    case "pdf-page-numbers": return <PdfPageNumbersTool />;
    default: return null;
  }
}
