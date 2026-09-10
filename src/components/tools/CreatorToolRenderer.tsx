"use client";

import { RefreshCw, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { findCreatorRiskWords, formatCreatorNote, generateCreatorTitles, type CreatorTitleScene, type CreatorTitleTone, type NoteSpacing } from "@/lib/text";
import { CopyButton, ResultBox, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleNote = `周末去了一家很喜欢的咖啡店

位置很好找，店里很安静，适合一个人坐着工作。

- 光线舒服
- 插座充足
- 咖啡口味清爽

如果你也喜欢安静的小店，可以收藏起来。`;

const sampleWechat = `本周项目进展

已经完成首页结构调整，移动端间距也做了检查。

- 待补充真实设备验收
- 整理下一阶段工具清单

下周继续推进。`;

export function CreatorToolRenderer({ tool }: { tool: ToolRecord }) {
  if (tool.slug === "xhs-title-generator") return <TitleGeneratorTool tool={tool} />;
  return tool.slug === "xhs-sensitive-word-check" ? <SensitiveWordTool tool={tool} /> : <NoteFormatterTool tool={tool} />;
}

const sampleTitleTopic = "周末安静咖啡店";

function TitleGeneratorTool({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(sampleTitleTopic);
  const [submittedTopic, setSubmittedTopic] = useState(sampleTitleTopic);
  const [scene, setScene] = useState<CreatorTitleScene>("experience");
  const [tone, setTone] = useState<CreatorTitleTone>("natural");
  const titles = useMemo(() => generateCreatorTitles(submittedTopic, scene, tone), [scene, submittedTopic, tone]);
  const allTitles = titles.map((title, index) => `${index + 1}. ${title}`).join("\n");

  function reset() {
    setTopic(sampleTitleTopic);
    setSubmittedTopic(sampleTitleTopic);
    setScene("experience");
    setTone("natural");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入一个主题，快速得到可人工筛选的小红书标题方向。" /><div className="title-tool-grid"><TextareaField label="内容主题" value={topic} onChange={setTopic} placeholder="例如：通勤早餐、租房收纳、周末旅行" rows={5} /><div className="title-options"><label className="tool-field"><span>内容场景</span><select value={scene} onChange={(event) => setScene(event.target.value as CreatorTitleScene)}><option value="experience">真实体验</option><option value="guide">实用攻略</option><option value="review">选择测评</option><option value="list">清单分享</option></select></label><label className="tool-field"><span>表达语气</span><select value={tone} onChange={(event) => setTone(event.target.value as CreatorTitleTone)}><option value="natural">自然分享</option><option value="practical">实用干货</option><option value="curious">提问引导</option></select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmittedTopic(topic)} disabled={!topic.trim()}><WandSparkles size={17} />生成标题方向</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板组合，不调用 AI</span></div><div className="title-result-list" aria-live="polite"><div className="title-result-heading"><span>标题方向</span><small>{titles.length} 条可筛选</small></div>{titles.map((title, index) => <article className="title-result-item" key={title}><div className="title-result-copy"><span>{String(index + 1).padStart(2, "0")}</span><p>{title}</p></div><CopyButton value={title} /></article>)}</div><div className="workspace-actions title-result-actions"><CopyButton value={allTitles} />{allTitles && <TextDownloadButton value={allTitles} name="xhs-title-directions.txt" />}<span className="count-note">发布前请人工核对事实、语气和平台规范</span></div><ToolNotice tone="warning">这是本地模板组合工具，不代表爆款预测，也不会替代你的选题判断；标题中的具体承诺请根据真实内容修改。</ToolNotice></div>;
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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description={isWechat ? "清理公众号复制粘贴带来的空格、空行和列表符号，保留你的原文内容。" : "清理复制粘贴带来的空格和空行，整理成更易阅读的笔记草稿。"} /><div className="segmented-control" role="group" aria-label="段落间距"><button type="button" className={spacing === "standard" ? "selected" : ""} onClick={() => setSpacing("standard")}>标准段落</button><button type="button" className={spacing === "airy" ? "selected" : ""} onClick={() => setSpacing("airy")}>宽松段落</button></div><div className="workspace-grid"><TextareaField label={isWechat ? "原始公众号内容" : "原始笔记"} value={input} onChange={setInput} placeholder={isWechat ? "粘贴公众号草稿" : "粘贴笔记内容"} rows={13} /><ResultBox label={isWechat ? "清理结果" : "排版结果"} value={output} placeholder="整理后的文字会显示在这里" /></div><div className="workspace-actions"><CopyButton value={output} />{output && <TextDownloadButton value={output} name={isWechat ? "wechat-formatted.txt" : "xhs-note-formatted.txt"} />}<button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">只整理格式，不改写内容</span></div><ToolNotice tone="warning">结果只是原文格式草稿，不会替你校对事实、版权、广告法或平台规范；发布前请在目标编辑器中再次检查。</ToolNotice></div>;
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
