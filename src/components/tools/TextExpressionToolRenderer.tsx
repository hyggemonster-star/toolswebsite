"use client";

import { AlignLeft, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { prepareTextExpression, type TextExpressionMode } from "@/lib/text";
import { AiEnhancementPanel } from "./AiEnhancementPanel";
import { CopyButton, HistoryControls, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleText = `这次我们其实已经基本上完成了首页结构调整，然后呢，移动端也做了一轮检查。

可以说目前的主要问题是反馈入口不够明显，部分用户不知道下一步该做什么。我们需要在下周补充引导，并且核对真实设备上的展示效果。`;
const expressionModes: Array<{ value: TextExpressionMode; label: string }> = [
  { value: "clear", label: "清晰直接" },
  { value: "formal", label: "正式稳妥" },
  { value: "concise", label: "精简克制（移除部分填充词）" },
  { value: "friendly", label: "自然友好" },
];

export function TextExpressionToolRenderer({ tool }: { tool: ToolRecord }) {
  const [input, setInput] = useState(sampleText);
  const [mode, setMode] = useState<TextExpressionMode>("clear");
  const [submittedInput, setSubmittedInput] = useState(sampleText);
  const [submittedMode, setSubmittedMode] = useState<TextExpressionMode>("clear");
  const draft = useMemo(() => prepareTextExpression(submittedInput, submittedMode), [submittedInput, submittedMode]);
  const report = draft ? [
    `标题：${draft.title}`,
    draft.intro,
    `统计：${draft.stats.characters} 字 / ${draft.stats.paragraphs} 段 / ${draft.stats.sentences} 个句末标点 / 移除填充词 ${draft.stats.removedFillers} 处`,
    "整理后的文本：",
    draft.cleanedText,
    "表达检查：",
    ...draft.issues.map((issue) => `- ${issue.label}：${issue.detail}`),
    "调整建议：",
    ...draft.suggestions.map((item, index) => `${index + 1}. ${item}`),
    "发布前检查：",
    ...draft.checklist.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n") : "";

  function reset() {
    setInput(sampleText);
    setMode("clear");
    setSubmittedInput(sampleText);
    setSubmittedMode("clear");
  }

  function submit() {
    setSubmittedInput(input);
    setSubmittedMode(mode);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="清理段落和空格，检查口语化表达与长句，在浏览器本地整理一份可继续编辑的文本草稿。" /><div className="title-tool-grid"><TextareaField label="原文" value={input} onChange={setInput} placeholder="粘贴需要整理的工作记录、说明或内容草稿" rows={13} /><div className="title-options"><label className="tool-field"><span>表达方向</span><select value={mode} onChange={(event) => setMode(event.target.value as TextExpressionMode)}>{expressionModes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><div className="text-expression-boundary"><span>能力边界</span><p>默认只清理格式并做提示；“精简克制”会移除有限的填充词。不会改写事实、伪造内容，也不用于规避查重或检测。</p></div></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!input.trim()}><AlignLeft size={17} />整理文本表达</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地表达检查，不调用 AI</span></div>{draft && <div className="text-expression-result-list" aria-live="polite"><div className="text-expression-header"><strong>{draft.title}</strong><span>{draft.intro}</span></div><div className="text-expression-stat-grid"><div><b>{draft.stats.characters}</b><span>字</span></div><div><b>{draft.stats.paragraphs}</b><span>段</span></div><div><b>{draft.stats.removedFillers}</b><span>移除填充词</span></div></div><label className="tool-field text-expression-output"><span>整理后的文本</span><textarea value={draft.cleanedText} readOnly rows={11} spellCheck={false} /></label><section className="text-expression-section"><h3>表达检查</h3><ul>{draft.issues.map((issue) => <li key={issue.label}><strong>{issue.label}</strong><span>{issue.detail}</span></li>)}</ul></section><section className="text-expression-section"><h3>调整建议</h3><ul>{draft.suggestions.map((item) => <li key={item}>{item}</li>)}</ul></section><div className="text-expression-checklist"><strong>发布前检查</strong><ul>{draft.checklist.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="text-expression-draft.txt" />}<span className="count-note">请在发布或提交前人工核对</span></div><HistoryControls toolSlug={tool.slug} content={report} title="文本表达整理结果" /><ToolNotice tone="warning">这是本地文本表达整理工具，不代表 AI 改写、查重结论或规避检测方案；请保留原创判断，核对事实、引用、隐私和平台规则。</ToolNotice><AiEnhancementPanel taskType="text_expression" toolSlug={tool.slug} title="文本表达" input={{ text: submittedInput, mode: submittedMode }} localContent={report} /></div>;
}
