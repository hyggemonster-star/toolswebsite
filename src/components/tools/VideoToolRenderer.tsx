"use client";

/* Video frames are rendered to local object URLs and intentionally bypass image optimization. */
/* eslint-disable @next/next/no-img-element */

import { Camera, Download, FileVideo } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import type { ToolRecord } from "@/data/tools";
import { formatBytes, type ImageOutput } from "@/lib/image";
import { captureVideoFrame, isVideoFile, validateVideoFile } from "@/lib/video";
import { ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : "视频处理失败，请换一个文件后重试。";
}

function useObjectUrl(source: Blob | null) {
  const url = useMemo(() => source ? URL.createObjectURL(source) : "", [source]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function VideoFilePicker({ file, onChange, onReject }: { file: File | null; onChange: (file: File | null) => void; onReject: (message: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const label = file ? file.name : "选择视频文件";
  const hint = file ? `${formatBytes(file.size)} · 只在浏览器本地读取` : "支持拖拽或点击选择 MP4、WEBM、MOV 等视频";

  function accept(next: File | undefined) {
    if (!next) return;
    if (!isVideoFile(next)) {
      onChange(null);
      onReject("请选择视频文件，例如 MP4 或 WEBM。 ");
      return;
    }
    try {
      validateVideoFile(next);
      onChange(next);
    } catch (reason) {
      onChange(null);
      onReject(errorMessage(reason));
    }
  }

  function select(event: ChangeEvent<HTMLInputElement>) {
    accept(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  }

  return <label className={`upload-drop video-upload-drop ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}><FileVideo size={29} /><strong>{label}</strong><span>{hint}</span><input type="file" accept="video/*,.mp4,.webm,.mov,.m4v,.ogv" onChange={select} /></label>;
}

function VideoOutputPanel({ output }: { output: ImageOutput | null }) {
  const url = useObjectUrl(output?.blob ?? null);
  if (!output) return null;
  return <div className="video-output-card"><div className="video-output-heading"><span>处理结果</span><small>{output.name} · {formatBytes(output.blob.size)}</small></div><img src={url || undefined} alt="视频帧截图结果" /><a className="soft-button" href={url || undefined} download={output.name}><Download size={16} />下载 JPG</a></div>;
}

export function VideoToolRenderer({ tool }: { tool: ToolRecord }) {
  const isCover = tool.slug !== "video-screenshot";
  const [file, setFile] = useState<File | null>(null);
  const [time, setTime] = useState("0");
  const [duration, setDuration] = useState(0);
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const fileUrl = useObjectUrl(file);
  const numericTime = Math.min(Math.max(0, Number(time) || 0), Math.max(0, duration - 0.01));

  async function capture() {
    if (!file) return;
    const seconds = Number(time);
    if (!Number.isFinite(seconds) || seconds < 0) {
      setError("请输入有效的时间点。 ");
      return;
    }
    setWorking(true);
    setError("");
    setOutput(null);
    try {
      setOutput(await captureVideoFrame(file, seconds, isCover ? "-cover" : "-screenshot"));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title={isCover ? "视频封面提取" : "视频截图"} description={isCover ? "选择视频中的时间点，导出一张适合封面的 JPG。" : "选择视频中的时间点，导出一张清晰的 JPG 截图。"} /><VideoFilePicker file={file} onChange={(next) => { setFile(next); setDuration(0); setTime("0"); setOutput(null); setError(""); }} onReject={setError} />{file && <div className="video-preview-card"><video src={fileUrl || undefined} controls preload="metadata" onLoadedMetadata={(event) => { const value = event.currentTarget.duration; if (Number.isFinite(value)) setDuration(value); }} /><div className="video-duration">{duration ? `视频时长 ${duration.toFixed(1)} 秒` : "正在读取视频时长…"}</div></div>}<div className="video-time-controls"><label className="tool-field"><span>{isCover ? "封面时间点（秒）" : "截图时间点（秒）"}</span><input type="number" min="0" max={duration || undefined} step="0.1" value={time} onChange={(event) => setTime(event.target.value)} inputMode="decimal" /></label><input aria-label="视频时间点" type="range" min="0" max={Math.max(0, duration)} step="0.1" value={numericTime} onChange={(event) => setTime(event.target.value)} disabled={!duration} /></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => void capture()} disabled={!file || working}>{working ? "处理中…" : <><Camera size={17} />{isCover ? "导出封面" : "导出截图"}</>}</button>{output && <span className="count-note">已生成 JPG，可下载保存</span>}</div>{error && <p className="field-error">{error}</p>}<VideoOutputPanel output={output} /><ToolNotice tone="warning">仅处理你本人拥有版权或已获授权的视频；画面在当前浏览器本地读取，不会上传服务器。</ToolNotice></div>;
}
