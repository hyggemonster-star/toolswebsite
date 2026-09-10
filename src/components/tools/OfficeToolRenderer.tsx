"use client";

import { Presentation, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { generatePptOutline, type PptOutlineDuration, type PptOutlineScene } from "@/lib/text";
import { CopyButton, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const samplePptTopic = "季度产品复盘";
const samplePptAudience = "产品与运营团队";
const samplePptObjective = "对齐本季度进展，明确下一阶段优先级";
const pptOutlineScenes: Array<{ value: PptOutlineScene; label: string }> = [
  { value: "report", label: "工作汇报" },
  { value: "training", label: "培训分享" },
  { value: "proposal", label: "方案提案" },
  { value: "sharing", label: "经验分享" },
];
const pptOutlineDurations: Array<{ value: PptOutlineDuration; label: string }> = [
  { value: "5", label: "5 分钟" },
  { value: "10", label: "10 分钟" },
  { value: "20", label: "20 分钟" },
];

export function OfficeToolRenderer({ tool }: { tool: ToolRecord }) {
  if (tool.slug === "ai-ppt-outline") return <PptOutlineTool tool={tool} />;
  return null;
}

function PptOutlineTool({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(samplePptTopic);
  const [audience, setAudience] = useState(samplePptAudience);
  const [objective, setObjective] = useState(samplePptObjective);
  const [submittedTopic, setSubmittedTopic] = useState(samplePptTopic);
  const [submittedAudience, setSubmittedAudience] = useState(samplePptAudience);
  const [submittedObjective, setSubmittedObjective] = useState(samplePptObjective);
  const [scene, setScene] = useState<PptOutlineScene>("report");
  const [duration, setDuration] = useState<PptOutlineDuration>("10");
  const draft = useMemo(() => generatePptOutline(submittedTopic, submittedAudience, submittedObjective, scene, duration), [duration, scene, submittedAudience, submittedObjective, submittedTopic]);
  const report = draft ? [
    `标题：${draft.title}`,
    `副标题：${draft.subtitle}`,
    draft.paceNote,
    ...draft.slides.flatMap((slide, index) => [
      `${index + 1}. ${slide.title}`,
      `讲述目的：${slide.purpose}`,
      `页面要点：${slide.points.join("；")}`,
      `视觉建议：${slide.visual}`,
    ]),
    "交付前检查：",
    ...draft.checklist.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n") : "";

  function reset() {
    setTopic(samplePptTopic);
    setAudience(samplePptAudience);
    setObjective(samplePptObjective);
    setSubmittedTopic(samplePptTopic);
    setSubmittedAudience(samplePptAudience);
    setSubmittedObjective(samplePptObjective);
    setScene("report");
    setDuration("10");
  }

  function submit() {
    setSubmittedTopic(topic);
    setSubmittedAudience(audience);
    setSubmittedObjective(objective);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入主题、受众和目标，在浏览器本地整理一份可继续编辑的演示文稿大纲。" /><div className="title-tool-grid"><TextareaField label="演示主题" value={topic} onChange={setTopic} placeholder="例如：季度复盘、产品培训、项目提案" rows={5} /><div className="title-options"><label className="tool-field"><span>目标受众</span><input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="例如：管理层、客户、团队成员" /></label><label className="tool-field"><span>演示目标</span><input value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="例如：对齐重点并推动下一步" /></label><label className="tool-field"><span>内容场景</span><select value={scene} onChange={(event) => setScene(event.target.value as PptOutlineScene)}>{pptOutlineScenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>预计时长</span><select value={duration} onChange={(event) => setDuration(event.target.value as PptOutlineDuration)}>{pptOutlineDurations.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!topic.trim()}><Presentation size={17} />整理 PPT 大纲</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地结构模板，不调用 AI</span></div>{draft && <div className="ppt-outline-result-list" aria-live="polite"><div className="ppt-outline-pace-note"><strong>{draft.title}</strong><span>{draft.subtitle}</span><small>{draft.paceNote}</small></div>{draft.slides.map((slide, index) => <article className="ppt-outline-slide" key={slide.title}><div className="ppt-outline-slide-heading"><div><span>第 {String(index + 1).padStart(2, "0")} 页</span><strong>{slide.title}</strong></div><b>结构</b></div><p className="ppt-outline-purpose">{slide.purpose}</p><ul className="ppt-outline-point-list">{slide.points.map((point) => <li key={point}>{point}</li>)}</ul><small className="ppt-outline-visual">视觉建议：{slide.visual}</small></article>)}</div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="ppt-outline.txt" />}<span className="count-note">导出后请替换为真实材料</span></div><ToolNotice tone="warning">这是本地结构整理工具，不代表 AI 生成、事实核验或演示效果预测；请自行补充真实数据、案例、引用和商业信息，并在演示前检查每页承诺。</ToolNotice></div>;
}
