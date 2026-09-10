"use client";

/* Image previews are local object URLs and intentionally bypass image optimization. */
/* eslint-disable @next/next/no-img-element */

import { Check, Download, FileImage, ImagePlus, RefreshCw, Scissors, Stamp, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import {
  baseName,
  blobToDataUrl,
  canvasToBlob,
  clamp,
  dataUrlToBlob,
  enhancePixelBuffer,
  formatBytes,
  getExtension,
  imageFormats,
  loadImage,
  makeCanvas,
  outputMimeForFile,
  pngToIco,
  removeSolidBackground,
  safeInteger,
  type BackgroundCorner,
  type ImageMime,
  type ImageOutput,
} from "@/lib/image";
import { FileDropField, FileDownloadLink, ProcessingStatus, ResultBox, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

type CropBox = { x: number; y: number; width: number; height: number };
type WatermarkPosition = "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : "处理失败，请换一张图片后重试。";
}

function useObjectUrl(source: Blob | null) {
  const url = useMemo(() => source ? URL.createObjectURL(source) : "", [source]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function ImageFilePicker({ files, onChange, multiple = false, label = "选择一张图片" }: { files: File[]; onChange: (files: File[]) => void; multiple?: boolean; label?: string }) {
  const fileLabel = files.length === 0 ? label : multiple ? `${files.length} 张图片已选择` : files[0].name;
  const fileHint = files.length === 0 ? "支持 JPG、PNG、WEBP，图片只在浏览器本地读取" : `${files.map((file) => file.name).slice(0, 2).join("、")}${files.length > 2 ? ` 等 ${files.length} 张` : ""}`;

  return <FileDropField icon={ImagePlus} className="image-upload-drop" label={fileLabel} hint={fileHint} accept="image/*" multiple={multiple} onFilesSelected={onChange} />;
}

function FileList({ files }: { files: File[] }) {
  if (!files.length) return null;
  return <div className="image-file-list">{files.map((file) => <div key={`${file.name}-${file.lastModified}`}><FileImage size={15} /><span>{file.name}</span><small>{formatBytes(file.size)}</small></div>)}</div>;
}

function OutputLink({ output, label = "下载图片" }: { output: ImageOutput; label?: string }) {
  const url = useObjectUrl(output.blob);
  return <FileDownloadLink url={url} name={output.name} label={label} />;
}

function ImageOutputPanel({ output, label = "处理结果" }: { output: ImageOutput | null; label?: string }) {
  const url = useObjectUrl(output?.blob ?? null);
  return <div className="image-preview-card"><div className="image-preview-heading"><span>{label}</span>{output && <small>{formatBytes(output.blob.size)} · {output.name}</small>}</div>{url ? <img src={url} alt={label} /> : <div className="image-preview-empty"><FileImage size={22} /><span>处理结果会显示在这里</span></div>}{output && <OutputLink output={output} />}</div>;
}

function ImageOutputList({ outputs }: { outputs: ImageOutput[] }) {
  return <div className="image-output-list">{outputs.map((output, index) => <div className="image-output-row" key={output.name}><span className="image-output-index">{String(index + 1).padStart(2, "0")}</span><span className="image-output-name"><strong>{output.name}</strong><small>{formatBytes(output.blob.size)}</small></span><OutputLink output={output} label="下载" /></div>)}</div>;
}

function TextDownload({ value, name }: { value: string; name: string }) {
  const blob = useMemo(() => value ? new Blob([value], { type: "text/plain;charset=utf-8" }) : null, [value]);
  const url = useObjectUrl(blob);
  return <a className="soft-button" href={url || undefined} download={name} aria-label={`下载 ${name}`}><Download size={16} />下载 TXT</a>;
}

function prepareCanvas(context: CanvasRenderingContext2D, width: number, height: number, mime: string) {
  if (mime === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
}

function outputName(file: File, suffix: string, mime: string) {
  return `${baseName(file.name)}${suffix}.${getExtension(mime)}`;
}

async function renderFullImage(file: File, mime: ImageMime, quality = 0.92) {
  const image = await loadImage(file);
  const { canvas, context } = makeCanvas(image.naturalWidth, image.naturalHeight);
  prepareCanvas(context, canvas.width, canvas.height, mime);
  context.drawImage(image, 0, 0);
  const blob = await canvasToBlob(canvas, mime, quality);
  return { blob, name: outputName(file, "-converted", mime), mime } satisfies ImageOutput;
}

async function renderEnhancedImage(file: File, sharpen: number, contrast: number) {
  const image = await loadImage(file);
  const pixelCount = image.naturalWidth * image.naturalHeight;
  if (pixelCount > 16_000_000) throw new Error("图片超过 1600 万像素，为避免浏览器卡顿，请先压缩或缩小图片。");

  const mime = outputMimeForFile(file);
  const { canvas, context } = makeCanvas(image.naturalWidth, image.naturalHeight);
  prepareCanvas(context, canvas.width, canvas.height, mime);
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  enhancePixelBuffer(imageData.data, canvas.width, canvas.height, sharpen, contrast);
  context.putImageData(imageData, 0, 0);
  const blob = await canvasToBlob(canvas, mime, 0.92);
  return { blob, name: outputName(file, "-enhanced", mime), mime } satisfies ImageOutput;
}

async function renderBackgroundRemoved(file: File, tolerance: number, corner: BackgroundCorner) {
  const image = await loadImage(file);
  const pixelCount = image.naturalWidth * image.naturalHeight;
  if (pixelCount > 12_000_000) throw new Error("图片超过 1200 万像素，为避免浏览器占用过多内存，请先压缩或缩小图片。 ");

  const { canvas, context } = makeCanvas(image.naturalWidth, image.naturalHeight);
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const changedPixels = removeSolidBackground(imageData.data, canvas.width, canvas.height, tolerance, corner);
  if (!changedPixels) throw new Error("没有找到与所选角落相近且相连的背景色，请换一个取样角落或提高颜色容差。 ");
  context.putImageData(imageData, 0, 0);
  const blob = await canvasToBlob(canvas, "image/png", 1);
  return { blob, name: outputName(file, "-background-removed", "image/png"), mime: "image/png" } satisfies ImageOutput;
}

async function renderWatermark(file: File, text: string, position: WatermarkPosition, opacity: number, fontSize: number, suffix = "-watermarked") {
  const image = await loadImage(file);
  const mime = outputMimeForFile(file);
  const { canvas, context } = makeCanvas(image.naturalWidth, image.naturalHeight);
  prepareCanvas(context, canvas.width, canvas.height, mime);
  context.drawImage(image, 0, 0);
  const size = clamp(fontSize, 12, Math.max(12, Math.round(canvas.width / 4)));
  const padding = Math.max(18, Math.round(Math.min(canvas.width, canvas.height) * 0.035));
  context.font = `700 ${size}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
  context.textBaseline = "middle";
  context.globalAlpha = clamp(opacity, 0.1, 1);
  context.fillStyle = "#ffffff";
  context.shadowColor = "rgba(0, 0, 0, 0.45)";
  context.shadowBlur = Math.max(2, Math.round(size / 7));
  const textWidth = context.measureText(text).width;
  const x = position.endsWith("right") ? canvas.width - padding - textWidth : position === "center" ? (canvas.width - textWidth) / 2 : padding;
  const y = position.startsWith("top") ? padding + size / 2 : position === "center" ? canvas.height / 2 : canvas.height - padding - size / 2;
  context.fillText(text, x, y);
  context.globalAlpha = 1;
  context.shadowBlur = 0;
  const blob = await canvasToBlob(canvas, mime, 0.92);
  return { blob, name: outputName(file, suffix, mime), mime } satisfies ImageOutput;
}

async function cropAndResize(file: File, targetWidth: number, targetHeight: number, suffix: string) {
  const image = await loadImage(file);
  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;
  if (sourceRatio > targetRatio) {
    sourceWidth = Math.round(image.naturalHeight * targetRatio);
    sourceX = Math.round((image.naturalWidth - sourceWidth) / 2);
  } else {
    sourceHeight = Math.round(image.naturalWidth / targetRatio);
    sourceY = Math.round((image.naturalHeight - sourceHeight) / 2);
  }
  const { canvas, context } = makeCanvas(targetWidth, targetHeight);
  prepareCanvas(context, canvas.width, canvas.height, "image/jpeg");
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  return { blob, name: outputName(file, suffix, "image/jpeg"), mime: "image/jpeg" } satisfies ImageOutput;
}

function ImageCompressTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState("0.8");
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function compress() {
    if (!file) return;
    setWorking(true);
    setError("");
    try {
      const image = await loadImage(file);
      const { canvas, context } = makeCanvas(image.naturalWidth, image.naturalHeight);
      prepareCanvas(context, canvas.width, canvas.height, "image/jpeg");
      context.drawImage(image, 0, 0);
      const blob = await canvasToBlob(canvas, "image/jpeg", Number(quality));
      setOutput({ blob, name: outputName(file, "-compressed", "image/jpeg"), mime: "image/jpeg" });
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片压缩" description="调整 JPEG 压缩质量，在浏览器本地减小图片体积。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} /><div className="range-row"><label htmlFor="image-quality">压缩质量 <strong>{Math.round(Number(quality) * 100)}%</strong></label><input id="image-quality" type="range" min="0.2" max="1" step="0.05" value={quality} onChange={(event) => setQuality(event.target.value)} /></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={compress} disabled={!file || working}>{working ? "处理中…" : "开始压缩"}</button>{output && file && <span className="count-note">{formatBytes(file.size)} → {formatBytes(output.blob.size)}</span>}</div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="压缩结果" />}<ToolNotice tone="privacy">图片在当前浏览器本地处理，页面关闭后不会保留上传内容。</ToolNotice></div>;
}

function ImageResizeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function selectFile(next: File[]) {
    const selected = next[0];
    if (!selected) return;
    try {
      const image = await loadImage(selected);
      setFiles([selected]);
      setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
      setWidth(String(image.naturalWidth));
      setHeight(String(image.naturalHeight));
      setOutput(null);
      setError("");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  function updateWidth(value: string) {
    setWidth(value);
    if (keepRatio && dimensions.width) setHeight(String(Math.max(1, Math.round(Number(value) * dimensions.height / dimensions.width))));
  }

  function updateHeight(value: string) {
    setHeight(value);
    if (keepRatio && dimensions.height) setWidth(String(Math.max(1, Math.round(Number(value) * dimensions.width / dimensions.height))));
  }

  async function resize() {
    if (!file || !Number(width) || !Number(height)) return;
    setError("");
    try {
      const image = await loadImage(file);
      const mime = outputMimeForFile(file);
      const { canvas, context } = makeCanvas(safeInteger(width, image.naturalWidth, 1, 10000), safeInteger(height, image.naturalHeight, 1, 10000));
      prepareCanvas(context, canvas.width, canvas.height, mime);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToBlob(canvas, mime, 0.92);
      setOutput({ blob, name: outputName(file, "-resized", mime), mime });
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片尺寸修改" description="按像素调整图片宽高，适合头像、封面和上传前处理。" /><ImageFilePicker files={files} onChange={(next) => void selectFile(next)} /><div className="image-dimension-note">{dimensions.width ? `原图 ${dimensions.width} × ${dimensions.height} px` : "先选择图片，再设置目标尺寸"}</div><div className="resize-fields"><label className="tool-field"><span>宽度（px）</span><input type="number" min="1" value={width} onChange={(event) => updateWidth(event.target.value)} /></label><span className="unit-arrow">×</span><label className="tool-field"><span>高度（px）</span><input type="number" min="1" value={height} onChange={(event) => updateHeight(event.target.value)} /></label><label className="check-inline"><input type="checkbox" checked={keepRatio} onChange={(event) => setKeepRatio(event.target.checked)} />锁定比例</label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={resize} disabled={!file}>调整尺寸</button></div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="尺寸修改结果" />}<ToolNotice tone="privacy">图片只在当前浏览器中处理，不会上传到服务器。</ToolNotice></div>;
}

function ImageConvertTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [mime, setMime] = useState<ImageMime>("image/jpeg");
  const [quality, setQuality] = useState("0.92");
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function convert() {
    if (!file) return;
    setError("");
    try {
      const next = await renderFullImage(file, mime, Number(quality));
      setOutput(next);
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片格式转换" description="在 JPG、PNG 和 WEBP 之间转换，图片不离开当前设备。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} /><div className="image-settings-grid"><label className="tool-field"><span>输出格式</span><select value={mime} onChange={(event) => setMime(event.target.value as ImageMime)}>{imageFormats.map((format) => <option value={format.mime} key={format.mime}>{format.label}</option>)}</select></label><label className="tool-field"><span>输出质量</span><select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="1">高（100%）</option><option value="0.92">标准（92%）</option><option value="0.8">较小（80%）</option></select></label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={convert} disabled={!file}><RefreshCw size={17} />转换图片</button></div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="转换结果" />}<ToolNotice tone="privacy">浏览器会重新编码图片；PNG 透明背景会在转换为 JPG 时变成白色。</ToolNotice></div>;
}

function ImageEnhanceTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [sharpen, setSharpen] = useState("0.35");
  const [contrast, setContrast] = useState("0");
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;

  async function process() {
    if (!file) return;
    setWorking(true);
    setError("");
    try {
      setOutput(await renderEnhancedImage(file, Number(sharpen), Number(contrast)));
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片清晰度增强" description="用轻量锐化和对比度调整改善图片观感，图片只在浏览器本地处理。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} /><div className="image-settings-grid"><div className="range-row"><label htmlFor="image-sharpen">锐化程度 <strong>{Math.round(Number(sharpen) * 100)}%</strong></label><input id="image-sharpen" type="range" min="0" max="0.75" step="0.05" value={sharpen} onChange={(event) => setSharpen(event.target.value)} /></div><div className="range-row"><label htmlFor="image-contrast">对比度 <strong>{Number(contrast) > 0 ? `+${contrast}` : contrast}</strong></label><input id="image-contrast" type="range" min="-25" max="25" step="5" value={contrast} onChange={(event) => setContrast(event.target.value)} /></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={process} disabled={!file || working}><WandSparkles size={17} />{working ? "处理中…" : "增强图片"}</button></div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="增强结果" />}<ToolNotice tone="privacy">这是轻量像素锐化，不会凭空恢复原图没有的细节，也不是 AI 超分；超过 1600 万像素的图片请先缩小，发布前请保留原图备份。</ToolNotice></div>;
}

const backgroundCorners: Array<{ value: BackgroundCorner; label: string }> = [
  { value: "top-left", label: "左上角" },
  { value: "top-right", label: "右上角" },
  { value: "bottom-left", label: "左下角" },
  { value: "bottom-right", label: "右下角" },
];

function ImageBackgroundRemoveTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [tolerance, setTolerance] = useState("24");
  const [corner, setCorner] = useState<BackgroundCorner>("top-left");
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const file = files[0] ?? null;

  async function process() {
    if (!file) return;
    setWorking(true);
    setError("");
    try {
      setOutput(await renderBackgroundRemoved(file, Number(tolerance), corner));
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片去背景" description="从指定角落取样，移除与背景相近且相连的纯色区域，结果在浏览器本地生成透明 PNG。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} label="选择需要去背景的图片" /><div className="image-settings-grid"><label className="tool-field"><span>背景取样角落</span><select value={corner} onChange={(event) => setCorner(event.target.value as BackgroundCorner)}>{backgroundCorners.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><div className="range-row"><label htmlFor="background-tolerance">颜色容差 <strong>{tolerance}</strong></label><input id="background-tolerance" type="range" min="4" max="80" step="2" value={tolerance} onChange={(event) => setTolerance(event.target.value)} /></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={process} disabled={!file || working}>{working ? <ProcessingStatus /> : <><WandSparkles size={17} />移除背景</>}</button></div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="透明背景结果" />}<ToolNotice tone="warning">这是基于角落取样和连通区域的纯色背景处理，不是 AI 自动抠图；复杂背景、渐变背景或主体贴边时请检查结果，原图不会上传。</ToolNotice></div>;
}

function centeredCrop(width: number, height: number, nextRatio: string): CropBox {
  if (!width || !height || nextRatio === "free") return { x: 0, y: 0, width, height };
  const [ratioWidth, ratioHeight] = nextRatio.split(":").map(Number);
  const sourceRatio = width / height;
  const targetRatio = ratioWidth / ratioHeight;
  const cropWidth = sourceRatio > targetRatio ? Math.round(height * targetRatio) : width;
  const cropHeight = sourceRatio > targetRatio ? height : Math.round(width / targetRatio);
  return { x: Math.round((width - cropWidth) / 2), y: Math.round((height - cropHeight) / 2), width: cropWidth, height: cropHeight };
}

function ImageCropTool({ creatorPreset = false }: { creatorPreset?: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [ratio, setRatio] = useState(creatorPreset ? "3:4" : "free");
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function selectFile(next: File[]) {
    const selected = next[0];
    if (!selected) return;
    try {
      const image = await loadImage(selected);
      const initialRatio = creatorPreset ? "3:4" : "free";
      const nextCrop = centeredCrop(image.naturalWidth, image.naturalHeight, initialRatio);
      setFiles([selected]);
      setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
      setCrop(nextCrop);
      setRatio(initialRatio);
      setOutput(null);
      setError("");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  function applyRatio(nextRatio: string) {
    setRatio(nextRatio);
    setCrop(centeredCrop(dimensions.width, dimensions.height, nextRatio));
  }

  function updateCrop(key: keyof CropBox, value: string) {
    const numeric = Math.max(0, Math.round(Number(value) || 0));
    setRatio("free");
    setCrop((current) => ({ ...current, [key]: numeric }));
  }

  async function process() {
    if (!file || !dimensions.width || !dimensions.height) return;
    setError("");
    try {
      const image = await loadImage(file);
      const x = clamp(crop.x, 0, image.naturalWidth - 1);
      const y = clamp(crop.y, 0, image.naturalHeight - 1);
      const width = clamp(crop.width, 1, image.naturalWidth - x);
      const height = clamp(crop.height, 1, image.naturalHeight - y);
      const mime = outputMimeForFile(file);
      const { canvas, context } = makeCanvas(width, height);
      prepareCanvas(context, canvas.width, canvas.height, mime);
      context.drawImage(image, x, y, width, height, 0, 0, width, height);
      const blob = await canvasToBlob(canvas, mime, 0.92);
      setOutput({ blob, name: outputName(file, creatorPreset ? "-xhs-cover" : "-cropped", mime), mime });
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    }
  }

  const ratioOptions = creatorPreset ? <><option value="3:4">3 : 4 竖版封面（推荐）</option><option value="1:1">1 : 1 方形封面</option><option value="4:3">4 : 3 横版图片</option></> : <><option value="free">自由裁剪</option><option value="1:1">1 : 1 正方形</option><option value="4:3">4 : 3 横图</option><option value="16:9">16 : 9 横屏</option><option value="3:4">3 : 4 竖图</option></>;
  return <div className="workspace-card"><WorkspaceHeader title={creatorPreset ? "小红书封面比例裁剪" : "图片裁剪"} description={creatorPreset ? "按常见内容比例居中裁剪封面，图片只在浏览器本地处理。" : "按比例或像素范围裁剪图片，默认从原图中心开始。"} /><ImageFilePicker files={files} onChange={(next) => void selectFile(next)} />{file && <><div className="image-settings-grid"><label className="tool-field"><span>{creatorPreset ? "封面比例" : "快速比例"}</span><select value={ratio} onChange={(event) => applyRatio(event.target.value)}>{ratioOptions}</select></label><div className="image-dimension-note">原图 {dimensions.width} × {dimensions.height} px</div></div><div className="crop-fields"><label className="tool-field"><span>左边距 X</span><input type="number" min="0" value={crop.x} onChange={(event) => updateCrop("x", event.target.value)} /></label><label className="tool-field"><span>上边距 Y</span><input type="number" min="0" value={crop.y} onChange={(event) => updateCrop("y", event.target.value)} /></label><label className="tool-field"><span>裁剪宽度</span><input type="number" min="1" value={crop.width} onChange={(event) => updateCrop("width", event.target.value)} /></label><label className="tool-field"><span>裁剪高度</span><input type="number" min="1" value={crop.height} onChange={(event) => updateCrop("height", event.target.value)} /></label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={process}><Scissors size={17} />{creatorPreset ? "生成封面" : "裁剪图片"}</button></div></>}{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label={creatorPreset ? "封面结果" : "裁剪结果"} />}<ToolNotice tone={creatorPreset ? "warning" : "privacy"}>{creatorPreset ? "3 : 4 是常见竖版内容比例，发布前请按具体平台和内容构图再次确认；裁剪不会上传原图。" : "裁剪在浏览器本地完成，不会上传原图；需要精细主体定位时请调整 X、Y 和宽高。"}</ToolNotice></div>;
}

function WatermarkControls({ text, setText, position, setPosition, opacity, setOpacity, fontSize, setFontSize }: { text: string; setText: (value: string) => void; position: WatermarkPosition; setPosition: (value: WatermarkPosition) => void; opacity: string; setOpacity: (value: string) => void; fontSize: string; setFontSize: (value: string) => void }) {
  return <div className="watermark-controls"><label className="tool-field"><span>水印文字</span><input value={text} onChange={(event) => setText(event.target.value)} placeholder="例如：版权所有" /></label><label className="tool-field"><span>位置</span><select value={position} onChange={(event) => setPosition(event.target.value as WatermarkPosition)}><option value="top-left">左上</option><option value="top-right">右上</option><option value="center">居中</option><option value="bottom-left">左下</option><option value="bottom-right">右下</option></select></label><label className="tool-field"><span>透明度</span><select value={opacity} onChange={(event) => setOpacity(event.target.value)}><option value="0.25">25%</option><option value="0.45">45%</option><option value="0.65">65%</option><option value="0.85">85%</option></select></label><label className="tool-field"><span>字号（px）</span><input type="number" min="12" max="240" value={fontSize} onChange={(event) => setFontSize(event.target.value)} /></label></div>;
}

function ImageWatermarkTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("AI效率工具箱");
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [opacity, setOpacity] = useState("0.45");
  const [fontSize, setFontSize] = useState("32");
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function process() {
    if (!file || !text.trim()) {
      setError("请先选择图片并填写水印文字。 ");
      return;
    }
    setError("");
    try {
      setOutput(await renderWatermark(file, text.trim(), position, Number(opacity), safeInteger(fontSize, 32, 12, 240)));
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片加水印" description="为图片添加文字水印，位置、透明度和字号都可以调整。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} /><WatermarkControls text={text} setText={setText} position={position} setPosition={setPosition} opacity={opacity} setOpacity={setOpacity} fontSize={fontSize} setFontSize={setFontSize} /><div className="workspace-actions"><button type="button" className="primary-button" onClick={process}><Stamp size={17} />生成水印图片</button></div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="水印结果" />}<ToolNotice tone="privacy">水印在浏览器本地绘制，原图不会上传。生成结果会重新编码，建议保留原图备份。</ToolNotice></div>;
}

function ImageBatchWatermarkTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("AI效率工具箱");
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [opacity, setOpacity] = useState("0.45");
  const [fontSize, setFontSize] = useState("32");
  const [outputs, setOutputs] = useState<ImageOutput[]>([]);
  const [progress, setProgress] = useState(0);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function process() {
    if (!files.length || !text.trim()) {
      setError("请至少选择一张图片并填写水印文字。 ");
      return;
    }
    setWorking(true);
    setProgress(0);
    setOutputs([]);
    setError("");
    try {
      const next: ImageOutput[] = [];
      for (const [index, file] of files.entries()) {
        next.push(await renderWatermark(file, text.trim(), position, Number(opacity), safeInteger(fontSize, 32, 12, 240), `-watermarked-${String(index + 1).padStart(2, "0")}`));
        setProgress(index + 1);
      }
      setOutputs(next);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片批量加水印" description="一次为多张图片添加统一文字水印，逐张下载处理结果。" /><ImageFilePicker files={files} multiple onChange={(next) => { setFiles(next); setOutputs([]); setError(""); }} /><FileList files={files} /><WatermarkControls text={text} setText={setText} position={position} setPosition={setPosition} opacity={opacity} setOpacity={setOpacity} fontSize={fontSize} setFontSize={setFontSize} /><div className="workspace-actions"><button type="button" className="primary-button" onClick={process} disabled={working}><Stamp size={17} />{working ? `处理中 ${progress}/${files.length}` : "批量生成水印"}</button></div>{error && <p className="field-error">{error}</p>}{outputs.length > 0 && <ImageOutputList outputs={outputs} />}<ToolNotice tone="privacy">所有图片在当前浏览器逐张处理，不会上传；由于不引入压缩包依赖，结果需要逐张下载。</ToolNotice></div>;
}

function ImageRemoveExifTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function removeMetadata() {
    if (!file) return;
    setError("");
    try {
      const next = await renderFullImage(file, outputMimeForFile(file));
      setOutput({ ...next, name: outputName(file, "-no-exif", next.mime) });
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="移除图片 EXIF" description="重新编码图片，移除拍摄设备、时间和定位等常见 EXIF 信息。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} /><div className="workspace-actions"><button type="button" className="primary-button" onClick={removeMetadata} disabled={!file}><Check size={17} />移除隐私信息</button></div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="已移除 EXIF 的结果" />}<ToolNotice tone="privacy">Canvas 重新导出会丢弃图片元数据；不同格式可能有额外私有字段，发布前仍建议检查文件属性。</ToolNotice></div>;
}

function ImageToBase64Tool() {
  const [files, setFiles] = useState<File[]>([]);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function convert() {
    if (!file) return;
    setError("");
    try {
      setValue(await blobToDataUrl(file));
    } catch (reason) {
      setValue("");
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片转 Base64" description="将图片转换成可嵌入 HTML、CSS 或 JSON 的 Data URL。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setValue(""); setError(""); }} /><div className="workspace-actions"><button type="button" className="primary-button" onClick={convert} disabled={!file}>转换 Base64</button>{value && <TextDownload value={value} name={`${baseName(file?.name ?? "image")}.txt`} />}</div>{error && <p className="field-error">{error}</p>}<ResultBox label="Base64 Data URL" value={value} placeholder="转换结果会显示在这里；图片较大时文本也会较长。" /><ToolNotice tone="privacy">图片内容只在浏览器中读取；Base64 会让数据体积变大，网页内嵌时请注意性能。</ToolNotice></div>;
}

function Base64ToImageTool() {
  const [value, setValue] = useState("");
  const [filename, setFilename] = useState("converted-image");
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");

  function convert() {
    setError("");
    try {
      const blob = dataUrlToBlob(value);
      setOutput({ blob, name: `${baseName(filename)}.${getExtension(blob.type)}`, mime: blob.type });
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="Base64 转图片" description="粘贴 Data URL 或纯 Base64 图片数据，恢复为可下载文件。" /><div className="workspace-grid"><TextareaField label="Base64 图片数据" value={value} onChange={(next) => { setValue(next); setOutput(null); }} placeholder="data:image/png;base64,..." rows={11} /><label className="tool-field"><span>文件名</span><input value={filename} onChange={(event) => setFilename(event.target.value)} placeholder="converted-image" /><small className="field-hint">扩展名会按实际图片类型自动补全。</small></label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={convert}>还原图片</button>{output && <OutputLink output={output} />}</div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="还原结果" />}<ToolNotice tone="privacy">解析过程在浏览器本地完成，不会发送粘贴的图片数据。</ToolNotice></div>;
}

function ImageToIcoTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function convert() {
    if (!file) return;
    setError("");
    try {
      const image = await loadImage(file);
      const size = 256;
      const { canvas, context } = makeCanvas(size, size);
      const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      const png = await canvasToBlob(canvas, "image/png");
      const blob = await pngToIco(png);
      setOutput({ blob, name: `${baseName(file.name)}.ico`, mime: "image/x-icon" });
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片转 ICO 图标" description="生成适合 favicon 和桌面快捷方式使用的 256px ICO 文件。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} /><div className="workspace-actions"><button type="button" className="primary-button" onClick={convert} disabled={!file}><FileImage size={17} />生成 ICO</button></div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="ICO 结果" />}<ToolNotice tone="privacy">ICO 文件在浏览器本地生成，透明 PNG 会保留透明背景；网站 favicon 请同时核对不同浏览器的显示效果。</ToolNotice></div>;
}

function ImageGridSplitTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<ImageOutput[]>([]);
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function split() {
    if (!file) return;
    setError("");
    try {
      const image = await loadImage(file);
      const next: ImageOutput[] = [];
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          const x = Math.floor(image.naturalWidth * column / 3);
          const y = Math.floor(image.naturalHeight * row / 3);
          const width = Math.floor(image.naturalWidth * (column + 1) / 3) - x;
          const height = Math.floor(image.naturalHeight * (row + 1) / 3) - y;
          const { canvas, context } = makeCanvas(width, height);
          context.drawImage(image, x, y, width, height, 0, 0, width, height);
          const blob = await canvasToBlob(canvas, "image/png");
          next.push({ blob, name: `${baseName(file.name)}-grid-${row + 1}-${column + 1}.png`, mime: "image/png" });
        }
      }
      setOutputs(next);
    } catch (reason) {
      setOutputs([]);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片九宫格切图" description="把一张图片切成 3 × 3 九张 PNG，适合按顺序发布到社交平台。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutputs([]); setError(""); }} /><div className="workspace-actions"><button type="button" className="primary-button" onClick={split} disabled={!file}><Scissors size={17} />切成九宫格</button></div>{error && <p className="field-error">{error}</p>}{outputs.length > 0 && <ImageOutputList outputs={outputs} />}<ToolNotice tone="privacy">结果按从左到右、从上到下编号；图片会在本地切割，需逐张下载。</ToolNotice></div>;
}

function LongImageSliceTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [height, setHeight] = useState("1200");
  const [outputs, setOutputs] = useState<ImageOutput[]>([]);
  const [error, setError] = useState("");
  const file = files[0] ?? null;

  async function slice() {
    if (!file) return;
    setError("");
    try {
      const image = await loadImage(file);
      const sliceHeight = safeInteger(height, 1200, 1, 10000);
      const count = Math.ceil(image.naturalHeight / sliceHeight);
      if (count > 50) throw new Error("切片数量超过 50 张，请先提高每张切片的高度。 ");
      const next: ImageOutput[] = [];
      for (let index = 0; index < count; index += 1) {
        const y = index * sliceHeight;
        const currentHeight = Math.min(sliceHeight, image.naturalHeight - y);
        const { canvas, context } = makeCanvas(image.naturalWidth, currentHeight);
        context.drawImage(image, 0, y, image.naturalWidth, currentHeight, 0, 0, image.naturalWidth, currentHeight);
        const blob = await canvasToBlob(canvas, "image/png");
        next.push({ blob, name: `${baseName(file.name)}-slice-${String(index + 1).padStart(2, "0")}.png`, mime: "image/png" });
      }
      setOutputs(next);
    } catch (reason) {
      setOutputs([]);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="长图切片" description="按指定高度切分长截图或长图，输出多张 PNG 文件。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutputs([]); setError(""); }} /><label className="tool-field slice-height-field"><span>每张高度（px）</span><input type="number" min="1" max="10000" value={height} onChange={(event) => setHeight(event.target.value)} /></label><div className="workspace-actions"><button type="button" className="primary-button" onClick={slice} disabled={!file}><Scissors size={17} />开始切片</button></div>{error && <p className="field-error">{error}</p>}{outputs.length > 0 && <ImageOutputList outputs={outputs} />}<ToolNotice tone="privacy">最多输出 50 张，避免一次性占用过多浏览器内存；结果按顺序逐张下载。</ToolNotice></div>;
}

function ImageStitchTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [direction, setDirection] = useState<"vertical" | "horizontal">("vertical");
  const [background, setBackground] = useState("#ffffff");
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");

  async function stitch() {
    if (files.length < 2) {
      setError("请至少选择两张图片。 ");
      return;
    }
    setError("");
    try {
      const images = await Promise.all(files.map((file) => loadImage(file)));
      const width = direction === "vertical" ? Math.max(...images.map((image) => image.naturalWidth)) : images.reduce((sum, image) => sum + image.naturalWidth, 0);
      const height = direction === "vertical" ? images.reduce((sum, image) => sum + image.naturalHeight, 0) : Math.max(...images.map((image) => image.naturalHeight));
      const { canvas, context } = makeCanvas(width, height);
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      let offset = 0;
      for (const image of images) {
        if (direction === "vertical") {
          context.drawImage(image, (width - image.naturalWidth) / 2, offset);
          offset += image.naturalHeight;
        } else {
          context.drawImage(image, offset, (height - image.naturalHeight) / 2);
          offset += image.naturalWidth;
        }
      }
      const blob = await canvasToBlob(canvas, "image/png");
      setOutput({ blob, name: "stitched-image.png", mime: "image/png" });
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片拼接长图" description="把多张图片按顺序拼成一张纵向或横向长图。" /><ImageFilePicker files={files} multiple onChange={(next) => { setFiles(next); setOutput(null); setError(""); }} /><FileList files={files} /><div className="image-settings-grid"><label className="tool-field"><span>拼接方向</span><select value={direction} onChange={(event) => setDirection(event.target.value as typeof direction)}><option value="vertical">纵向长图</option><option value="horizontal">横向长图</option></select></label><label className="tool-field"><span>空白区域颜色</span><input type="color" value={background} onChange={(event) => setBackground(event.target.value)} /></label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={stitch}><RefreshCw size={17} />生成长图</button></div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="拼接结果" />}<ToolNotice tone="privacy">所有图片先在浏览器中读取，拼接结果只保留在当前页面内。</ToolNotice></div>;
}

const idPhotoPresets = [
  { id: "small", label: "小一寸", width: 260, height: 378 },
  { id: "one", label: "一寸", width: 295, height: 413 },
  { id: "two", label: "二寸", width: 413, height: 531 },
  { id: "passport", label: "护照比例", width: 354, height: 472 },
] as const;

function IdPhotoCropTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState<(typeof idPhotoPresets)[number]["id"]>("one");
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const file = files[0] ?? null;
  const selectedPreset = idPhotoPresets.find((item) => item.id === preset) ?? idPhotoPresets[1];

  async function crop() {
    if (!file) return;
    setError("");
    try {
      setOutput(await cropAndResize(file, selectedPreset.width, selectedPreset.height, `-${selectedPreset.id}-id-photo`));
    } catch (reason) {
      setOutput(null);
      setError(errorMessage(reason));
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="证件照尺寸裁剪" description="按常见证件照比例居中裁剪并输出标准像素尺寸。" /><ImageFilePicker files={files} onChange={(next) => { setFiles(next.slice(0, 1)); setOutput(null); setError(""); }} /><div className="image-settings-grid"><label className="tool-field"><span>证件照规格</span><select value={preset} onChange={(event) => setPreset(event.target.value as typeof preset)}>{idPhotoPresets.map((item) => <option value={item.id} key={item.id}>{item.label} · {item.width} × {item.height} px</option>)}</select></label><div className="image-dimension-note">默认居中裁剪，输出 JPG</div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={crop} disabled={!file}><Scissors size={17} />生成证件照</button></div>{error && <p className="field-error">{error}</p>}{output && <ImageOutputPanel output={output} label="证件照结果" />}<ToolNotice tone="warning">不同学校、签证和平台的规格可能不同。生成后请核对人物位置、背景和尺寸要求。</ToolNotice></div>;
}

export function ImageToolRenderer({ tool }: { tool: ToolRecord }) {
  switch (tool.slug) {
    case "image-compress": return <ImageCompressTool />;
    case "image-resize": return <ImageResizeTool />;
    case "image-convert": return <ImageConvertTool />;
    case "image-enhance": return <ImageEnhanceTool />;
    case "image-background-remove": return <ImageBackgroundRemoveTool />;
    case "image-crop": return <ImageCropTool />;
    case "xhs-cover-crop": return <ImageCropTool creatorPreset />;
    case "image-watermark": return <ImageWatermarkTool />;
    case "image-batch-watermark": return <ImageBatchWatermarkTool />;
    case "image-remove-exif": return <ImageRemoveExifTool />;
    case "image-to-base64": return <ImageToBase64Tool />;
    case "base64-to-image": return <Base64ToImageTool />;
    case "image-to-ico": return <ImageToIcoTool />;
    case "image-grid-split": return <ImageGridSplitTool />;
    case "long-image-slice": return <LongImageSliceTool />;
    case "image-stitch": return <ImageStitchTool />;
    case "id-photo-crop": return <IdPhotoCropTool />;
    default: return null;
  }
}
