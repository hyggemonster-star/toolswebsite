"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { findCreatorRiskWords, formatCreatorNote, type NoteSpacing } from "@/lib/text";
import { CopyButton, ResultBox, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleNote = `周末去了一家很喜欢的咖啡店

位置很好找，店里很安静，适合一个人坐着工作。

- 光线舒服
- 插座充足
- 咖啡口味清爽

如果你也喜欢安静的小店，可以收藏起来。`;

export function CreatorToolRenderer({ tool }: { tool: ToolRecord }) {
  return tool.slug === "xhs-sensitive-word-check" ? <SensitiveWordTool tool={tool} /> : <NoteFormatterTool tool={tool} />;
}

function NoteFormatterTool({ tool }: { tool: ToolRecord }) {
  const [input, setInput] = useState(sampleNote);
  const [spacing, setSpacing] = useState<NoteSpacing>("standard");
  const output = useMemo(() => formatCreatorNote(input, spacing), [input, spacing]);

  function reset() {
    setInput(sampleNote);
    setSpacing("standard");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="清理复制粘贴带来的空格和空行，整理成更易阅读的笔记草稿。" /><div className="segmented-control" role="group" aria-label="段落间距"><button type="button" className={spacing === "standard" ? "selected" : ""} onClick={() => setSpacing("standard")}>标准段落</button><button type="button" className={spacing === "airy" ? "selected" : ""} onClick={() => setSpacing("airy")}>宽松段落</button></div><div className="workspace-grid"><TextareaField label="原始笔记" value={input} onChange={setInput} placeholder="粘贴笔记内容" rows={13} /><ResultBox label="排版结果" value={output} placeholder="整理后的笔记会显示在这里" /></div><div className="workspace-actions"><CopyButton value={output} />{output && <TextDownloadButton value={output} name="xhs-note-formatted.txt" />}<button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">只整理格式，不改写内容</span></div><ToolNotice tone="warning">结果只是原创笔记排版草稿，请自行核对事实、版权和平台规则。</ToolNotice></div>;
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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="辅助找出可能需要人工复核的风险表达，支持补充自定义检测词。" /><div className="workspace-grid"><TextareaField label="待检查文案" value={input} onChange={setInput} placeholder="粘贴需要检查的原创文案" rows={13} /><div><label className="tool-field"><span>补充检测词（可选）</span><textarea value={customTerms} onChange={(event) => setCustomTerms(event.target.value)} placeholder="多个词用逗号或换行分隔" rows={5} spellCheck={false} /></label><div className={`risk-summary ${matches.length ? "has-risk" : "is-clear"}`} aria-live="polite"><strong>{matches.length ? `发现 ${matches.length} 处候选表达` : "暂未发现候选表达"}</strong><span>{matches.length ? `需要复核：${matchedTerms}` : "仍请结合具体语境和平台规则人工判断"}</span></div>{matches.length > 0 && <div className="risk-list">{matches.map((match, index) => <div className="risk-item" key={`${match.term}-${match.index}-${index}`}><strong>{match.term}</strong><span>位置 {match.index + 1}</span><p>{match.context}</p></div>)}</div>}</div></div><div className="workspace-actions"><CopyButton value={matchedTerms} /><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">只做辅助检查，不替代平台审核</span></div><ToolNotice tone="warning">词库是可维护的候选风险表达，平台规则会变化且可能误报；内容只在当前浏览器处理，请自行核对事实、广告法和平台要求。</ToolNotice></div>;
}
