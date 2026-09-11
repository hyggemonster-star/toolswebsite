"use client";

import { AlertCircle, RotateCcw, WandSparkles } from "lucide-react";
import { useState } from "react";
import type { ToolRecord } from "@/data/tools";
import type { AiRequestInput, AiTaskType } from "@/lib/ai-client";
import { requestAi } from "@/lib/ai-client";
import { CopyButton, HistoryControls, ProcessingStatus, TextDownloadButton } from "./ToolPrimitives";

export type DirectAiField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select";
  placeholder?: string;
  initial?: string;
  rows?: number;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
};

export type DirectAiToolConfig = {
  taskType: AiTaskType;
  buttonLabel: string;
  description: string;
  fields: DirectAiField[];
};

function getInitialValues(fields: DirectAiField[]) {
  return fields.reduce<Record<string, string>>((values, field) => {
    values[field.key] = field.initial ?? field.options?.[0]?.value ?? "";
    return values;
  }, {});
}

export function DirectAiTool({ tool, config }: { tool: ToolRecord; config: DirectAiToolConfig }) {
  const [values, setValues] = useState(() => getInitialValues(config.fields));
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const requiredFields = config.fields.filter((field) => field.required !== false);
  const hasInput = requiredFields.every((field) => values[field.key]?.trim());

  function updateValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function generate() {
    if (!hasInput || status === "loading") return;
    setStatus("loading");
    setError("");
    setResult("");
    try {
      const content = await requestAi(config.taskType, values as AiRequestInput);
      setResult(content);
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(requestError instanceof Error ? requestError.message : "AI 服务暂时不可用，请稍后重试");
    }
  }

  function resetResult() {
    setStatus("idle");
    setError("");
    setResult("");
  }

  return <div className="workspace-card direct-ai-workspace">
    <div className="direct-ai-heading">
      <h2>{tool.name}</h2>
      <p>{config.description}</p>
    </div>
    <div className="direct-ai-form">
      {config.fields.map((field) => <label className="tool-field" key={field.key}>
        <span>{field.label}</span>
        {field.type === "textarea" ? <textarea value={values[field.key] ?? ""} onChange={(event) => updateValue(field.key, event.target.value)} placeholder={field.placeholder} rows={field.rows ?? 6} /> : field.type === "select" ? <select value={values[field.key] ?? ""} onChange={(event) => updateValue(field.key, event.target.value)}>{field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select> : <input value={values[field.key] ?? ""} onChange={(event) => updateValue(field.key, event.target.value)} placeholder={field.placeholder} />}
      </label>)}
    </div>
    <div className="workspace-actions direct-ai-actions">
      <button type="button" className="primary-button" onClick={generate} disabled={!hasInput || status === "loading"}>
        {status === "loading" ? <ProcessingStatus label="AI 处理中…" /> : <><WandSparkles size={16} />{config.buttonLabel}</>}
      </button>
      {result && <><CopyButton value={result} /><TextDownloadButton value={result} name={`${tool.slug}-ai-result.txt`} label="下载结果" /><button type="button" className="soft-button" onClick={resetResult}><RotateCcw size={15} />重新生成</button></>}
    </div>
    {error && <div className="ai-enhancement-error" role="alert"><AlertCircle size={16} /><span>{error}</span><button type="button" className="text-button" onClick={generate}>重试</button></div>}
    {result && <section className="direct-ai-result" aria-live="polite"><div className="ai-result-heading"><strong>AI 结果</strong><span>请人工核对事实、数字和语气</span></div><pre>{result}</pre></section>}
    {result && <HistoryControls toolSlug={`${tool.slug}-ai`} content={result} title={`${tool.name} AI 结果`} />}
    <p className="ai-privacy-hint">AI 会处理你填写的内容。请勿输入密码、身份证号、银行卡号或未公开的敏感信息。</p>
  </div>;
}
