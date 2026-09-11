"use client";

import { Check, Clipboard, Clock3, Download, LoaderCircle, LockKeyhole, Trash2, WandSparkles, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { copyText } from "@/lib/browser";
import { deleteToolHistory, getToolHistory, saveToolHistory, type ToolHistoryEntry } from "@/lib/storage";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await copyText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return <button type="button" className="soft-button" onClick={copy} disabled={!value}><Clipboard size={16} />{copied ? "已复制" : "复制结果"}</button>;
}

export function TextDownloadButton({ value, name, label = "下载文件", mime = "text/plain;charset=utf-8" }: { value: string; name: string; label?: string; mime?: string }) {
  const blob = useMemo(() => value ? new Blob([value], { type: mime }) : null, [mime, value]);
  const url = useMemo(() => blob ? URL.createObjectURL(blob) : "", [blob]);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  return <a className="soft-button" href={url || undefined} download={name}><Download size={15} />{label}</a>;
}

export function ToolNotice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "privacy" | "warning" }) {
  return <div className={`tool-notice notice-${tone}`}>{tone === "privacy" ? <LockKeyhole size={17} /> : tone === "warning" ? <WandSparkles size={17} /> : <Check size={17} />}<span>{children}</span></div>;
}

export function WorkspaceHeader({ title, description }: { title: string; description: string; local?: boolean }) {
  return <div className="workspace-heading"><div><h2>{title}</h2><p>{description}</p></div></div>;
}

export function FileDropField({ icon: Icon, label, hint, accept, onFilesSelected, multiple = false, className = "" }: { icon: LucideIcon; label: string; hint: string; accept: string; onFilesSelected: (files: File[]) => void; multiple?: boolean; className?: string }) {
  const [dragging, setDragging] = useState(false);

  function select(event: ChangeEvent<HTMLInputElement>) {
    onFilesSelected(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = "";
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    onFilesSelected(Array.from(event.dataTransfer.files));
  }

  return <label className={`upload-drop ${className} ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}><Icon size={29} /><strong>{label}</strong><span>{hint}</span><input type="file" accept={accept} multiple={multiple} onChange={select} /></label>;
}

export function ProcessingStatus({ label = "处理中…" }: { label?: string }) {
  return <span className="processing-status" role="status"><LoaderCircle size={15} />{label}</span>;
}

export function FileDownloadLink({ url, name, label = "下载文件", ariaLabel }: { url: string; name: string; label?: string; ariaLabel?: string }) {
  return <a className="soft-button" href={url || undefined} download={name} aria-label={ariaLabel ?? `${label} ${name}`}><Download size={16} />{label}</a>;
}

export function TextareaField({ label, value, onChange, placeholder, rows = 10 }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; rows?: number }) {
  return <label className="tool-field"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} spellCheck={false} /></label>;
}

export function ResultBox({ label, value, placeholder = "处理结果会出现在这里" }: { label: string; value: string; placeholder?: string }) {
  return <div className="result-box"><div className="result-box-header"><span>{label}</span><CopyButton value={value} /></div><pre className={value ? "has-value" : ""}>{value || placeholder}</pre></div>;
}

export function HistoryControls({ toolSlug, content, title }: { toolSlug: string; content: string; title: string }) {
  const [entries, setEntries] = useState<ToolHistoryEntry[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setEntries(getToolHistory(toolSlug));
    refresh();
    window.addEventListener("tools-hub-history-updated", refresh);
    return () => window.removeEventListener("tools-hub-history-updated", refresh);
  }, [toolSlug]);

  function save() {
    saveToolHistory(toolSlug, title, content);
    setSaved(true);
    setEntries(getToolHistory(toolSlug));
    window.setTimeout(() => setSaved(false), 1600);
  }

  return <div className="tool-history">
    <div className="workspace-actions tool-history-actions"><button type="button" className="soft-button" onClick={save} disabled={!content}><Clock3 size={15} />{saved ? "已保存到本机" : "保存本次结果"}</button><span className="count-note">最多保留 20 条，仅在本设备保存</span></div>
    {entries.length > 0 && <details className="tool-history-list"><summary>本工具历史（{entries.length}）</summary><div>{entries.map((entry) => <article key={entry.id}><div><strong>{entry.title}</strong><time dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleString()}</time></div><pre>{entry.content}</pre><div className="workspace-actions"><CopyButton value={entry.content} /><TextDownloadButton value={entry.content} name={`tools-hub-${entry.toolSlug}-${entry.createdAt}.txt`} label="下载结果" /><button type="button" className="soft-button" onClick={() => deleteToolHistory(entry.id)}><Trash2 size={15} />删除</button></div></article>)}</div></details>}
  </div>;
}
