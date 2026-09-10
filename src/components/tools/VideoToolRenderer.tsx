"use client";

/* Video frames are rendered to local object URLs and intentionally bypass image optimization. */
/* eslint-disable @next/next/no-img-element */

import { Camera, FileVideo, Film, Minimize2, RotateCcw, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { formatBytes, type ImageOutput } from "@/lib/image";
import { captureVideoFrame, compressVideo, createVideoGif, isVideoFile, MAX_VIDEO_COMPRESS_SECONDS, MAX_VIDEO_GIF_DIMENSION, MAX_VIDEO_GIF_SECONDS, MAX_VIDEO_REMOVE_AUDIO_SECONDS, removeVideoAudio, validateVideoFile, type VideoOutput } from "@/lib/video";
import { FileDownloadLink, FileDropField, ProcessingStatus, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : "视频处理失败，请换一个文件后重试。";
}

function useObjectUrl(source: Blob | null) {
  const url = useMemo(() => source ? URL.createObjectURL(source) : "", [source]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function VideoFilePicker({ file, onChange, onReject }: { file: File | null; onChange: (file: File | null) => void; onReject: (message: string) => void }) {
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

  return <FileDropField icon={FileVideo} className="video-upload-drop" label={label} hint={hint} accept="video/*,.mp4,.webm,.mov,.m4v,.ogv" onFilesSelected={(files) => accept(files[0])} />;
}

function VideoOutputPanel({ output }: { output: ImageOutput | null }) {
  const url = useObjectUrl(output?.blob ?? null);
  if (!output) return null;
  return <div className="video-output-card"><div className="video-output-heading"><span>处理结果</span><small>{output.name} · {formatBytes(output.blob.size)}</small></div><img src={url || undefined} alt="视频帧截图结果" /><FileDownloadLink url={url} name={output.name} label="下载 JPG" /></div>;
}

function VideoFileOutputPanel({ output }: { output: VideoOutput | null }) {
  const url = useObjectUrl(output?.blob ?? null);
  if (!output) return null;
  return <div className="video-output-card"><div className="video-output-heading"><span>处理结果</span><small>{output.name} · {formatBytes(output.blob.size)} · WebM</small></div><video src={url || undefined} controls preload="metadata" playsInline /><FileDownloadLink url={url} name={output.name} label="下载无声视频" /></div>;
}

function GifOutputPanel({ output }: { output: ImageOutput | null }) {
  const url = useObjectUrl(output?.blob ?? null);
  if (!output) return null;
  return <div className="video-output-card"><div className="video-output-heading"><span>GIF 结果</span><small>{output.name} · {formatBytes(output.blob.size)}</small></div><img src={url || undefined} alt="视频 GIF 动图结果" /><FileDownloadLink url={url} name={output.name} label="下载 GIF" /></div>;
}

function VideoGifTool() {
  const [file, setFile] = useState<File | null>(null);
  const [seconds, setSeconds] = useState("5");
  const [fps, setFps] = useState("10");
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const fileUrl = useObjectUrl(file);

  async function convert() {
    if (!file) return;
    setWorking(true);
    setError("");
    setOutput(null);
    try {
      setOutput(await createVideoGif(file, Number(seconds), Number(fps)));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="MP4 转 GIF" description="在浏览器本地截取短视频片段，使用轻量减色编码导出 GIF 动图。" /><VideoFilePicker file={file} onChange={(next) => { setFile(next); setOutput(null); setError(""); }} onReject={setError} />{file && <div className="video-preview-card"><video src={fileUrl || undefined} controls preload="metadata" playsInline /><div className="video-duration">最多截取 {MAX_VIDEO_GIF_SECONDS} 秒，最长边 {MAX_VIDEO_GIF_DIMENSION} px；GIF 不包含音频</div></div>}<div className="image-settings-grid"><label className="tool-field"><span>截取时长</span><select value={seconds} onChange={(event) => setSeconds(event.target.value)}><option value="3">3 秒</option><option value="5">5 秒</option><option value="8">8 秒</option></select></label><label className="tool-field"><span>帧率</span><select value={fps} onChange={(event) => setFps(event.target.value)}><option value="6">6 fps（更小）</option><option value="10">10 fps（标准）</option><option value="12">12 fps（更流畅）</option></select></label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => void convert()} disabled={!file || working}>{working ? <ProcessingStatus label="正在抽帧…" /> : <><Film size={17} />导出 GIF</>}</button><span className="count-note">纯浏览器处理，不上传视频</span></div>{error && <p className="field-error">{error}</p>}<GifOutputPanel output={output} /><ToolNotice tone="privacy">当前版本使用原生视频解码和 Canvas 抽帧，输出为最多 256 色的 GIF；复杂视频可能出现颜色减少、体积较大或浏览器内存不足，请先截取短片段。</ToolNotice></div>;
}

function VideoRemoveAudioTool() {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<VideoOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const fileUrl = useObjectUrl(file);

  function reset() {
    setFile(null);
    setOutput(null);
    setError("");
  }

  async function removeAudio() {
    if (!file) return;
    setWorking(true);
    setError("");
    setOutput(null);
    try {
      setOutput(await removeVideoAudio(file));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="视频静音 / 去音轨" description="在支持 MediaRecorder 的现代浏览器本地移除视频音轨，导出无声 WebM。" /><VideoFilePicker file={file} onChange={(next) => { setFile(next); setOutput(null); setError(""); }} onReject={setError} />{file && <div className="video-preview-card"><video src={fileUrl || undefined} controls preload="metadata" playsInline /><div className="video-duration">仅处理画面，最长 {Math.round(MAX_VIDEO_REMOVE_AUDIO_SECONDS / 60)} 分钟；导出格式为 WebM</div></div>}<div className="workspace-actions"><button type="button" className="primary-button" onClick={() => void removeAudio()} disabled={!file || working}>{working ? <ProcessingStatus label="正在导出…" /> : <><VolumeX size={17} />移除音轨</>}</button><button type="button" className="soft-button" onClick={reset} disabled={working}><RotateCcw size={16} />重新选择</button><span className="count-note">只在当前浏览器处理，不上传文件</span></div>{error && <p className="field-error">{error}</p>}<VideoFileOutputPanel output={output} /><ToolNotice tone="privacy">输出是浏览器录制的无声 WebM，不保证保留原 MP4/MOV 封装或编码；只处理你本人拥有版权或已获授权的视频。</ToolNotice></div>;
}

function VideoCompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState("1500000");
  const [output, setOutput] = useState<VideoOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const fileUrl = useObjectUrl(file);

  async function compress() {
    if (!file) return;
    setWorking(true);
    setError("");
    setOutput(null);
    try {
      setOutput(await compressVideo(file, Number(bitrate)));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="视频压缩" description="在浏览器本地按目标码率重新录制 WebM，适合发送前做轻量压缩。" /><VideoFilePicker file={file} onChange={(next) => { setFile(next); setOutput(null); setError(""); }} onReject={setError} />{file && <div className="video-preview-card"><video src={fileUrl || undefined} controls preload="metadata" playsInline /><div className="video-duration">最长处理 {Math.round(MAX_VIDEO_COMPRESS_SECONDS / 60)} 分钟；输出 WebM，浏览器会尽量保留音轨</div></div>}<div className="image-settings-grid"><label className="tool-field"><span>目标视频码率</span><select value={bitrate} onChange={(event) => setBitrate(event.target.value)}><option value="600000">600 kbps（更小）</option><option value="1500000">1.5 Mbps（标准）</option><option value="2500000">2.5 Mbps（更清晰）</option></select></label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => void compress()} disabled={!file || working}>{working ? <ProcessingStatus label="正在压缩…" /> : <><Minimize2 size={17} />压缩并导出</>}</button><span className="count-note">只在当前浏览器处理，不上传视频</span></div>{error && <p className="field-error">{error}</p>}<VideoFileOutputPanel output={output} /><ToolNotice tone="warning">输出为浏览器重新录制的 WebM，不保证原 MP4/MOV 封装、无损质量或体积一定更小；如果输入编码不支持，可能无法处理或没有音轨。</ToolNotice></div>;
}

function VideoFrameToolRenderer({ tool }: { tool: ToolRecord }) {
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

  return <div className="workspace-card"><WorkspaceHeader title={isCover ? "视频封面提取" : "视频截图"} description={isCover ? "选择视频中的时间点，导出一张适合封面的 JPG。" : "选择视频中的时间点，导出一张清晰的 JPG 截图。"} /><VideoFilePicker file={file} onChange={(next) => { setFile(next); setDuration(0); setTime("0"); setOutput(null); setError(""); }} onReject={setError} />{file && <div className="video-preview-card"><video src={fileUrl || undefined} controls preload="metadata" onLoadedMetadata={(event) => { const value = event.currentTarget.duration; if (Number.isFinite(value)) setDuration(value); }} /><div className="video-duration">{duration ? `视频时长 ${duration.toFixed(1)} 秒` : "正在读取视频时长…"}</div></div>}<div className="video-time-controls"><label className="tool-field"><span>{isCover ? "封面时间点（秒）" : "截图时间点（秒）"}</span><input type="number" min="0" max={duration || undefined} step="0.1" value={time} onChange={(event) => setTime(event.target.value)} inputMode="decimal" /></label><input aria-label="视频时间点" type="range" min="0" max={Math.max(0, duration)} step="0.1" value={numericTime} onChange={(event) => setTime(event.target.value)} disabled={!duration} /></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => void capture()} disabled={!file || working}>{working ? <ProcessingStatus /> : <><Camera size={17} />{isCover ? "导出封面" : "导出截图"}</>}</button>{output && <span className="count-note">已生成 JPG，可下载保存</span>}</div>{error && <p className="field-error">{error}</p>}<VideoOutputPanel output={output} /><ToolNotice tone="warning">仅处理你本人拥有版权或已获授权的视频；画面在当前浏览器本地读取，不会上传服务器。</ToolNotice></div>;
}

export function VideoToolRenderer({ tool }: { tool: ToolRecord }) {
  if (tool.slug === "video-remove-audio") return <VideoRemoveAudioTool />;
  if (tool.slug === "mp4-to-gif") return <VideoGifTool />;
  if (tool.slug === "video-compress") return <VideoCompressTool />;
  return <VideoFrameToolRenderer tool={tool} />;
}
