"use client";

import { BookOpen, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { generateXhsPrompts, type XhsPromptScene, type XhsPromptTone } from "@/lib/text";
import { CopyButton, HistoryControls, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleTopic = "通勤场景下如何选择一只方便收纳的保温杯";
const sampleAudience = "需要通勤携带、重视收纳和日常饮水的上班族";
const sampleMaterials = "可折叠收纳；容量 450ml；杯盖带密封结构；已有办公室和通勤实拍。食品接触级材质与保温时长需要补充检测信息，不写未经确认的结论。";
const sampleConstraints = "不虚构使用体验、销量和检测数据；不使用未授权的人物或图片；正文需要保留适用范围和使用限制。";
const scenes: Array<{ value: XhsPromptScene; label: string }> = [
  { value: "topic", label: "选题策划" },
  { value: "title", label: "标题方向" },
  { value: "note", label: "笔记结构" },
  { value: "engagement", label: "互动回复" },
];
const tones: Array<{ value: XhsPromptTone; label: string }> = [
  { value: "clear", label: "清晰直接" },
  { value: "warm", label: "温和真诚" },
  { value: "professional", label: "专业克制" },
  { value: "conversational", label: "自然口语" },
];

export function XhsPromptLibraryToolRenderer({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(sampleTopic);
  const [audience, setAudience] = useState(sampleAudience);
  const [materials, setMaterials] = useState(sampleMaterials);
  const [constraints, setConstraints] = useState(sampleConstraints);
  const [scene, setScene] = useState<XhsPromptScene>("topic");
  const [tone, setTone] = useState<XhsPromptTone>("clear");
  const [submittedTopic, setSubmittedTopic] = useState(sampleTopic);
  const [submittedAudience, setSubmittedAudience] = useState(sampleAudience);
  const [submittedMaterials, setSubmittedMaterials] = useState(sampleMaterials);
  const [submittedConstraints, setSubmittedConstraints] = useState(sampleConstraints);
  const [submittedScene, setSubmittedScene] = useState<XhsPromptScene>("topic");
  const [submittedTone, setSubmittedTone] = useState<XhsPromptTone>("clear");
  const draft = useMemo(() => generateXhsPrompts(submittedTopic, submittedAudience, submittedMaterials, submittedConstraints, submittedTone, submittedScene), [submittedAudience, submittedConstraints, submittedMaterials, submittedScene, submittedTone, submittedTopic]);
  const allPrompts = draft?.prompts.map((item, index) => `模板 ${index + 1}：${item.title}\n用途：${item.use}\n\n${item.prompt}`).join("\n\n---\n\n") ?? "";

  function reset() {
    setTopic(sampleTopic);
    setAudience(sampleAudience);
    setMaterials(sampleMaterials);
    setConstraints(sampleConstraints);
    setScene("topic");
    setTone("clear");
    setSubmittedTopic(sampleTopic);
    setSubmittedAudience(sampleAudience);
    setSubmittedMaterials(sampleMaterials);
    setSubmittedConstraints(sampleConstraints);
    setSubmittedScene("topic");
    setSubmittedTone("clear");
  }

  function submit() {
    setSubmittedTopic(topic);
    setSubmittedAudience(audience);
    setSubmittedMaterials(materials);
    setSubmittedConstraints(constraints);
    setSubmittedScene(scene);
    setSubmittedTone(tone);
  }

  return <div className="workspace-card">
    <WorkspaceHeader title={tool.name} description="按小红书创作场景筛选并填充可复制的 Prompt 模板，在浏览器本地整理选题、标题、笔记与互动素材。" />
    <div className="title-tool-grid">
      <TextareaField label="真实素材 / 已有经历" value={materials} onChange={setMaterials} placeholder="每行写一条真实经历、素材、数据或可公开引用的信息" rows={9} />
      <div className="title-options">
        <label className="tool-field"><span>笔记主题</span><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="例如：租房收纳、学习方法、产品体验" /></label>
        <label className="tool-field"><span>目标读者</span><input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="例如：刚开始租房的上班族" /></label>
        <label className="tool-field"><span>表达限制</span><input value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="例如：不写未经验证的功效和数据" /></label>
        <label className="tool-field"><span>模板场景</span><select value={scene} onChange={(event) => setScene(event.target.value as XhsPromptScene)}>{scenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <label className="tool-field"><span>表达方向</span><select value={tone} onChange={(event) => setTone(event.target.value as XhsPromptTone)}>{tones.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
      </div>
    </div>
    <div className="workspace-actions">
      <button type="button" className="primary-button" onClick={submit} disabled={!topic.trim()}><BookOpen size={17} />整理 Prompt 模板</button>
      <button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button>
      <span className="count-note">本地模板库，不调用 AI</span>
    </div>
    {draft && <div className="prompt-library-result-list" aria-live="polite">
      <div className="prompt-library-header"><strong>{draft.sceneLabel} · {draft.toneLabel}</strong><span>已填充真实信息，可复制到你有权限使用的模型或工作流中</span></div>
      {draft.prompts.map((item) => <article className="prompt-library-card" key={item.title}>
        <div className="prompt-library-card-heading"><div><strong>{item.title}</strong><small>{item.use}</small></div><CopyButton value={item.prompt} /></div>
        <pre>{item.prompt}</pre>
      </article>)}
    </div>}
    <div className="workspace-actions title-result-actions"><CopyButton value={allPrompts} />{allPrompts && <TextDownloadButton value={allPrompts} name="xhs-prompt-templates.txt" />}<span className="count-note">复制前请检查事实、授权与平台规则</span></div><HistoryControls toolSlug={tool.slug} content={allPrompts} title="小红书 Prompt 模板组" />
    <ToolNotice tone="warning">这是本地小红书 Prompt 模板库，不代表自动生成、实时热度、爆款预测或自动发布；请只填入真实信息，核对版权、隐私、广告和平台规则。</ToolNotice>
  </div>;
}
