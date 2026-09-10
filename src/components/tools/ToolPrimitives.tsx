"use client";

import { Check, Clipboard, LockKeyhole, WandSparkles } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return <button type="button" className="soft-button" onClick={copy} disabled={!value}><Clipboard size={16} />{copied ? "已复制" : "复制结果"}</button>;
}

export function ToolNotice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "privacy" | "warning" }) {
  return <div className={`tool-notice notice-${tone}`}>{tone === "privacy" ? <LockKeyhole size={17} /> : tone === "warning" ? <WandSparkles size={17} /> : <Check size={17} />}<span>{children}</span></div>;
}

export function WorkspaceHeader({ title, description, local = true }: { title: string; description: string; local?: boolean }) {
  return <div className="workspace-heading"><div><p className="workspace-label">直接处理</p><h2>{title}</h2><p>{description}</p></div>{local && <span className="local-badge"><span /> 浏览器本地</span>}</div>;
}

export function TextareaField({ label, value, onChange, placeholder, rows = 10 }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; rows?: number }) {
  return <label className="tool-field"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} spellCheck={false} /></label>;
}

export function ResultBox({ label, value, placeholder = "处理结果会出现在这里" }: { label: string; value: string; placeholder?: string }) {
  return <div className="result-box"><div className="result-box-header"><span>{label}</span><CopyButton value={value} /></div><pre className={value ? "has-value" : ""}>{value || placeholder}</pre></div>;
}
