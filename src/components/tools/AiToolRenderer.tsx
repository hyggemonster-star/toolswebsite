"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { buildPrompt, type PromptDraft, type PromptFormat, type PromptTone } from "@/lib/text";
import { AiEnhancementPanel } from "./AiEnhancementPanel";
import { ResultBox, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleDraft: PromptDraft = {
  goal: "把一篇关于通勤早餐的笔记整理成适合小红书发布的内容大纲",
  audience: "工作日早上时间紧张的上班族",
  context: "已有 3 个早餐搭配和实际体验，表达要真实克制。",
  requirements: "先给出结构，再列出每段要点；不要夸大效果，不要编造数据。",
  tone: "natural",
  format: "structured",
};

export function AiToolRenderer({ tool }: { tool: ToolRecord }) {
  const [draft, setDraft] = useState<PromptDraft>(sampleDraft);
  const [submitted, setSubmitted] = useState<PromptDraft>(sampleDraft);
  const prompt = useMemo(() => buildPrompt(submitted), [submitted]);

  function update<K extends keyof PromptDraft>(key: K, value: PromptDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setDraft(sampleDraft);
    setSubmitted(sampleDraft);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="把目标、受众和要求整理成一份可直接交给 AI 的 Prompt 草稿。" /><div className="prompt-tool-grid"><div className="prompt-input-stack"><TextareaField label="你想完成什么？" value={draft.goal} onChange={(value) => update("goal", value)} placeholder="例如：把会议记录整理成行动清单" rows={5} /><TextareaField label="已有背景或素材（可选）" value={draft.context} onChange={(value) => update("context", value)} placeholder="补充已有资料、限制或事实" rows={5} /></div><div className="title-options"><label className="tool-field"><span>目标读者</span><input value={draft.audience} onChange={(event) => update("audience", event.target.value)} placeholder="例如：第一次接触这个主题的人" /></label><label className="tool-field"><span>表达语气</span><select value={draft.tone} onChange={(event) => update("tone", event.target.value as PromptTone)}><option value="natural">自然清晰</option><option value="professional">专业严谨</option><option value="concise">简洁直接</option></select></label><label className="tool-field"><span>输出格式</span><select value={draft.format} onChange={(event) => update("format", event.target.value as PromptFormat)}><option value="structured">分层大纲</option><option value="steps">步骤清单</option><option value="table">对比表格</option><option value="direct">直接给结论</option></select></label><label className="tool-field"><span>补充要求（可选）</span><textarea value={draft.requirements} onChange={(event) => update("requirements", event.target.value)} placeholder="例如：不要编造，不要使用夸张表达" rows={5} /></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmitted(draft)} disabled={!draft.goal.trim()}><Sparkles size={17} />生成 Prompt</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地整理，不调用 AI</span></div><ResultBox label="Prompt 草稿" value={prompt} placeholder="填写目标后生成 Prompt 草稿" /><div className="workspace-actions"><TextDownloadButton value={prompt} name="prompt-draft.txt" /><span className="count-note">复制结果后，可粘贴到你常用的 AI 工具</span></div><ToolNotice tone="privacy">目标、背景和要求只在当前浏览器中组合，不会上传或调用模型；使用结果前请人工核对敏感信息和事实。</ToolNotice><AiEnhancementPanel taskType="prompt_generate" toolSlug={tool.slug} title="Prompt 生成" input={{ goal: submitted.goal, audience: submitted.audience, context: submitted.context, requirements: submitted.requirements, tone: submitted.tone, format: submitted.format }} localContent={prompt} /></div>;
}
