"use client";

import { AlertCircle, Bot, RotateCcw, WandSparkles } from "lucide-react";
import { useState } from "react";
import type { AiRequestInput, AiTaskType } from "@/lib/ai-client";
import { requestAi } from "@/lib/ai-client";
import { CopyButton, HistoryControls, ProcessingStatus, TextDownloadButton, ToolNotice } from "./ToolPrimitives";

type AiEnhancementPanelProps = {
  taskType: AiTaskType;
  toolSlug: string;
  title: string;
  input: AiRequestInput;
  localContent: string;
};

export function AiEnhancementPanel({ taskType, toolSlug, title, input, localContent }: AiEnhancementPanelProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const hasInput = Object.values(input).some((value) => value.trim());

  async function enhance() {
    if (!hasInput || status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      const content = await requestAi(taskType, input);
      setResult(content);
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(requestError instanceof Error ? requestError.message : "AI 服务暂时不可用，请稍后重试");
    }
  }

  function reset() {
    setStatus("idle");
    setResult("");
    setError("");
  }

  return <section className="ai-enhancement-card" aria-labelledby={`${toolSlug}-ai-title`}>
    <div className="ai-enhancement-heading">
      <div>
        <p className="workspace-label">两种处理方式</p>
        <h3 id={`${toolSlug}-ai-title`}>AI 增强：{title}</h3>
        <p>本地结果保留在上方；AI 增强会把当前输入发送到火山方舟，生成更完整的可编辑草稿。</p>
      </div>
      <span className="ai-mode-pill"><Bot size={14} />需联网</span>
    </div>
    <div className="ai-mode-grid">
      <div className="ai-mode-item is-local"><strong>本地模式</strong><span>不联网、不上传，速度快，适合先做初稿。</span></div>
      <div className="ai-mode-item is-enhanced"><strong>AI 增强模式</strong><span>调用 AI 服务，适合继续扩写、改写和补充结构。</span></div>
    </div>
    <div className="workspace-actions ai-enhancement-actions">
      <button type="button" className="primary-button" onClick={enhance} disabled={!hasInput || status === "loading"}>
        {status === "loading" ? <ProcessingStatus label="AI 处理中…" /> : <><WandSparkles size={16} />使用 AI 增强</>}
      </button>
      {result && <><CopyButton value={result} /><TextDownloadButton value={result} name={`${toolSlug}-ai-result.txt`} label="下载 AI 结果" /></>}
      {result && <button type="button" className="soft-button" onClick={reset}><RotateCcw size={15} />重新生成</button>}
      <span className="count-note">{localContent ? "本地结果已保留，AI 失败不会影响本地结果" : "先完成本地输入，再使用 AI 增强"}</span>
    </div>
    {error && <div className="ai-enhancement-error" role="alert"><AlertCircle size={16} /><span>{error}</span><button type="button" className="text-button" onClick={enhance}>重试</button></div>}
    {result && <div className="ai-enhancement-result" aria-live="polite"><div className="ai-result-heading"><strong>AI 增强结果</strong><span>请人工核对事实、数字和语气</span></div><pre>{result}</pre></div>}
    {result && <HistoryControls toolSlug={`${toolSlug}-ai`} content={result} title={`${title} AI 增强结果`} />}
    <ToolNotice tone="privacy">AI 增强会把当前输入发送到 AI 服务。请不要输入身份证号、密码、银行卡、私人聊天或未公开商业机密；AI 结果仅供参考，发布前请人工核对。</ToolNotice>
  </section>;
}
