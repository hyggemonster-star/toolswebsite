"use client";

import { AlertCircle, RotateCcw, WandSparkles } from "lucide-react";
import { useState } from "react";
import type { AiRequestInput, AiTaskType } from "@/lib/ai-client";
import { requestAi } from "@/lib/ai-client";
import { CopyButton, HistoryControls, ProcessingStatus, TextDownloadButton } from "./ToolPrimitives";

type AiEnhancementPanelProps = {
  taskType: AiTaskType;
  toolSlug: string;
  title: string;
  input: AiRequestInput;
  localContent?: string;
};

export function AiEnhancementPanel({ taskType, toolSlug, title, input }: AiEnhancementPanelProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const hasInput = Object.values(input).some((value) => value.trim());

  async function generate() {
    if (!hasInput || status === "loading") return;
    setStatus("loading");
    setError("");
    setResult("");
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

  return <section className="ai-enhancement-card ai-only-panel" aria-labelledby={`${toolSlug}-ai-title`}>
    <div className="ai-enhancement-heading"><div><h3 id={`${toolSlug}-ai-title`}>{title}</h3><p>结果由 AI 生成，请人工核对事实、数字和语气。</p></div></div>
    <div className="workspace-actions ai-enhancement-actions">
      <button type="button" className="primary-button" onClick={generate} disabled={!hasInput || status === "loading"}>{status === "loading" ? <ProcessingStatus label="AI 处理中…" /> : <><WandSparkles size={16} />AI 生成</>}</button>
      {result && <><CopyButton value={result} /><TextDownloadButton value={result} name={`${toolSlug}-ai-result.txt`} label="下载结果" /><button type="button" className="soft-button" onClick={reset}><RotateCcw size={15} />重新生成</button></>}
    </div>
    {error && <div className="ai-enhancement-error" role="alert"><AlertCircle size={16} /><span>{error}</span><button type="button" className="text-button" onClick={generate}>重试</button></div>}
    {result && <div className="ai-enhancement-result" aria-live="polite"><div className="ai-result-heading"><strong>AI 结果</strong><span>请人工核对事实、数字和语气</span></div><pre>{result}</pre></div>}
    {result && <HistoryControls toolSlug={`${toolSlug}-ai`} content={result} title={`${title} AI 结果`} />}
    <p className="ai-privacy-hint">AI 会处理当前输入。请勿输入密码、身份证号、银行卡号或未公开的敏感信息。</p>
  </section>;
}
