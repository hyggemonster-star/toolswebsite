"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { findCreatorRiskWords, formatCreatorNote, type NoteSpacing } from "@/lib/text";
import { DirectAiTool } from "./DirectAiTool";
import { creatorAiConfigs } from "./direct-ai-configs";
import { CopyButton, HistoryControls, ResultBox, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleNote = `周末去了一家很喜欢的咖啡店

位置很好找，店里很安静，适合一个人坐着工作。

- 光线舒服
- 插座充足
- 咖啡口味清爽`;

const sampleWechat = `本周项目进展

已经完成首页结构调整，移动端间距也做了检查。

- 待补充真实设备验收
- 整理下一阶段工具清单`;

export function CreatorToolRenderer({ tool }: { tool: ToolRecord }) {
  const aiConfig = creatorAiConfigs[tool.slug];
  if (aiConfig) return <DirectAiTool tool={tool} config={aiConfig} />;
  if (tool.slug === "xhs-sensitive-word-check") return <SensitiveWordTool tool={tool} />;
  return <NoteFormatterTool tool={tool} />;
}

function NoteFormatterTool({ tool }: { tool: ToolRecord }) {
  const isWechat = tool.slug === "wechat-format-cleaner";
  const sample = isWechat ? sampleWechat : sampleNote;
  const [input, setInput] = useState(sample);
  const [spacing, setSpacing] = useState<NoteSpacing>("standard");
  const output = useMemo(() => formatCreatorNote(input, spacing), [input, spacing]);

  function reset() {
    setInput(sample);
    setSpacing("standard");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="只清理复制粘贴带来的空格、空行和列表符号，不改写原文。" /><div className="segmented-control" role="group" aria-label="段落间距"><button type="button" className={spacing === "standard" ? "selected" : ""} onClick={() => setSpacing("standard")}>标准段落</button><button type="button" className={spacing === "airy" ? "selected" : ""} onClick={() => setSpacing("airy")}>宽松段落</button></div><div className="workspace-grid"><TextareaField label={isWechat ? "原始公众号内容" : "原始笔记"} value={input} onChange={setInput} placeholder="粘贴需要清理格式的内容" rows={11} /><ResultBox label="清理结果" value={output} placeholder="整理后的文字会显示在这里" /></div><div className="workspace-actions"><CopyButton value={output} />{output && <TextDownloadButton value={output} name={isWechat ? "wechat-formatted.txt" : "xhs-note-formatted.txt"} />}<button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button></div><HistoryControls toolSlug={tool.slug} content={output} title={`${tool.name}结果`} /><ToolNotice tone="warning">只处理你有权使用的原文；发布前请自行检查事实、版权、广告和平台规则。</ToolNotice></div>;
}

const sampleRiskText = `这家店绝对是本地第一，咖啡口味百分百惊艳。

今天有全网最低价，想买的朋友不要错过。`;

function SensitiveWordTool({ tool }: { tool: ToolRecord }) {
  const [input, setInput] = useState(sampleRiskText);
  const [customTerms, setCustomTerms] = useState("");
  const matches = useMemo(() => findCreatorRiskWords(input, customTerms), [customTerms, input]);
  const matchedTerms = Array.from(new Set(matches.map((match) => match.term))).join("、");

  function reset() {
    setInput(sampleRiskText);
    setCustomTerms("");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="辅助找出可能需要人工复核的风险表达，支持补充自定义检测词。" /><div className="workspace-grid"><TextareaField label="待检查文案" value={input} onChange={setInput} placeholder="粘贴需要检查的原创文案" rows={11} /><div><label className="tool-field"><span>补充检测词（可选）</span><textarea value={customTerms} onChange={(event) => setCustomTerms(event.target.value)} placeholder="多个词用逗号或换行分隔" rows={5} spellCheck={false} /></label><div className={`risk-summary ${matches.length ? "has-risk" : "is-clear"}`} aria-live="polite"><strong>{matches.length ? `发现 ${matches.length} 处候选表达` : "暂未发现候选表达"}</strong><span>{matches.length ? `需要复核：${matchedTerms}` : "仍请结合具体语境和平台规则人工判断"}</span></div>{matches.length > 0 && <div className="risk-list">{matches.map((match, index) => <div className="risk-item" key={`${match.term}-${match.index}-${index}`}><strong>{match.term}</strong><span>位置 {match.index + 1}</span><p>{match.context}</p></div>)}</div>}</div></div><div className="workspace-actions"><CopyButton value={matchedTerms} /><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button></div><HistoryControls toolSlug={tool.slug} content={matchedTerms} title="风险表达检查结果" /><ToolNotice tone="warning">词库可能误报且平台规则会变化；只做辅助检查，不替代人工审核。</ToolNotice></div>;
}
