"use client";

import { FileAudio, Minimize2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { formatBytes } from "@/lib/image";
import { compressAudio, convertAudioToWav, isAudioFile, MAX_AUDIO_COMPRESS_SECONDS, MAX_AUDIO_CONVERT_SECONDS, validateAudioFile, type AudioOutput } from "@/lib/audio";
import { FileDownloadLink, FileDropField, ProcessingStatus, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : "音频处理失败，请换一个文件后重试。";
}

function useObjectUrl(source: Blob | null) {
  const url = useMemo(() => source ? URL.createObjectURL(source) : "", [source]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function AudioFilePicker({ file, onChange, onReject }: { file: File | null; onChange: (file: File | null) => void; onReject: (message: string) => void }) {
  const label = file ? file.name : "选择音频文件";
  const hint = file ? `${formatBytes(file.size)} · 只在浏览器本地读取` : "支持拖拽或点击选择 MP3、WAV、M4A、AAC、OGG 等音频";

  function accept(next: File | undefined) {
    if (!next) return;
    if (!isAudioFile(next)) {
      onChange(null);
      onReject("请选择音频文件，例如 MP3、WAV 或 M4A。 ");
      return;
    }
    try {
      validateAudioFile(next);
      onChange(next);
    } catch (reason) {
      onChange(null);
      onReject(errorMessage(reason));
    }
  }

  return <FileDropField icon={FileAudio} className="audio-upload-drop" label={label} hint={hint} accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.flac,.webm" onFilesSelected={(files) => accept(files[0])} />;
}

function AudioOutputPanel({ output, downloadLabel = "下载音频" }: { output: AudioOutput | null; downloadLabel?: string }) {
  const url = useObjectUrl(output?.blob ?? null);
  if (!output) return null;
  return <div className="audio-output-card"><div className="video-output-heading"><span>处理结果</span><small>{output.name} · {formatBytes(output.blob.size)}</small></div><audio src={url || undefined} controls preload="metadata" /><FileDownloadLink url={url} name={output.name} label={downloadLabel} /></div>;
}

function AudioFormatConversionTool({ tool }: { tool: ToolRecord }) {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<AudioOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const fileUrl = useObjectUrl(file);

  async function convert() {
    if (!file) return;
    setWorking(true);
    setError("");
    setOutput(null);
    try {
      setOutput(await convertAudioToWav(file));
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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="把浏览器能解码的音频转换为标准 16-bit PCM WAV，适合编辑、剪辑和归档。" /><AudioFilePicker file={file} onChange={(next) => { setFile(next); setOutput(null); setError(""); }} onReject={setError} />{file && <div className="audio-preview-card"><audio src={fileUrl || undefined} controls preload="metadata" /><div className="video-duration">最长转换 {Math.round(MAX_AUDIO_CONVERT_SECONDS / 60)} 分钟；输出标准 WAV</div></div>}<div className="workspace-actions"><button type="button" className="primary-button" onClick={() => void convert()} disabled={!file || working}>{working ? <ProcessingStatus label="正在转换…" /> : <><FileAudio size={17} />转换为 WAV</>}</button><button type="button" className="soft-button" onClick={reset} disabled={working}><RotateCcw size={16} />重新选择</button><span className="count-note">只在当前浏览器处理，不上传音频</span></div>{error && <p className="field-error">{error}</p>}<AudioOutputPanel output={output} downloadLabel="下载 WAV 音频" /><ToolNotice tone="warning">当前版本输出 16-bit PCM WAV，不提供 MP3、AAC、OGG 等任意格式互转；WAV 通常比压缩音频更大，结果预计超过 80 MB 时会拒绝导出。只处理你本人拥有版权或已获授权的内容。</ToolNotice></div>;
}

function AudioCompressionTool({ tool }: { tool: ToolRecord }) {
  const [file, setFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState("96000");
  const [output, setOutput] = useState<AudioOutput | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const fileUrl = useObjectUrl(file);

  async function compress() {
    if (!file) return;
    setWorking(true);
    setError("");
    setOutput(null);
    try {
      setOutput(await compressAudio(file, Number(bitrate)));
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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="在浏览器本地按目标码率重新编码音频，适合发送前做轻量压缩。" /><AudioFilePicker file={file} onChange={(next) => { setFile(next); setOutput(null); setError(""); }} onReject={setError} />{file && <div className="audio-preview-card"><audio src={fileUrl || undefined} controls preload="metadata" /><div className="video-duration">最长处理 {Math.round(MAX_AUDIO_COMPRESS_SECONDS / 60)} 分钟；输出为浏览器支持的 OGG/WebM 音频</div></div>}<div className="image-settings-grid"><label className="tool-field"><span>目标音频码率</span><select value={bitrate} onChange={(event) => setBitrate(event.target.value)}><option value="64000">64 kbps（更小）</option><option value="96000">96 kbps（标准）</option><option value="128000">128 kbps（更清晰）</option></select></label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => void compress()} disabled={!file || working}>{working ? <ProcessingStatus label="正在压缩…" /> : <><Minimize2 size={17} />压缩并导出</>}</button><button type="button" className="soft-button" onClick={reset} disabled={working}><RotateCcw size={16} />重新选择</button><span className="count-note">只在当前浏览器处理，不上传音频</span></div>{error && <p className="field-error">{error}</p>}<AudioOutputPanel output={output} /><ToolNotice tone="warning">输出为浏览器重新编码的 OGG/WebM 音频，不保证 MP3/WAV 格式、无损质量或体积一定更小；只处理你本人拥有版权或已获授权的内容。</ToolNotice></div>;
}

export function AudioToolRenderer({ tool }: { tool: ToolRecord }) {
  if (tool.slug === "audio-convert") return <AudioFormatConversionTool tool={tool} />;
  return <AudioCompressionTool tool={tool} />;
}
