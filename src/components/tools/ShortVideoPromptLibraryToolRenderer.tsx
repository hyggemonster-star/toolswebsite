"use client";

import { Clapperboard, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { generateShortVideoPrompts, type ShortVideoPromptDuration, type ShortVideoPromptScene } from "@/lib/text";
import { CopyButton, HistoryControls, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleTopic = "通勤场景下如何选择一只方便收纳的保温杯";
const sampleAudience = "需要通勤携带、重视收纳和日常饮水的上班族";
const samplePlatform = "抖音 / 视频号";
const sampleConstraints = "只有产品实拍和办公室场景；不使用未经授权的音乐和人物素材；不要宣称保温时长，具体检测信息待补充。";
const scenes: Array<{ value: ShortVideoPromptScene; label: string }> = [
  { value: "ideas", label: "选题策划" },
  { value: "script", label: "口播脚本" },
  { value: "storyboard", label: "分镜拆解" },
  { value: "review", label: "内容复盘" },
];
const durations: Array<{ value: ShortVideoPromptDuration; label: string }> = [
  { value: "15", label: "15 秒" },
  { value: "30", label: "30 秒" },
  { value: "60", label: "60 秒" },
];

export function ShortVideoPromptLibraryToolRenderer({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(sampleTopic);
  const [audience, setAudience] = useState(sampleAudience);
  const [platform, setPlatform] = useState(samplePlatform);
  const [constraints, setConstraints] = useState(sampleConstraints);
  const [scene, setScene] = useState<ShortVideoPromptScene>("ideas");
  const [duration, setDuration] = useState<ShortVideoPromptDuration>("30");
  const [submittedTopic, setSubmittedTopic] = useState(sampleTopic);
  const [submittedAudience, setSubmittedAudience] = useState(sampleAudience);
  const [submittedPlatform, setSubmittedPlatform] = useState(samplePlatform);
  const [submittedConstraints, setSubmittedConstraints] = useState(sampleConstraints);
  const [submittedScene, setSubmittedScene] = useState<ShortVideoPromptScene>("ideas");
  const [submittedDuration, setSubmittedDuration] = useState<ShortVideoPromptDuration>("30");
  const draft = useMemo(() => generateShortVideoPrompts(submittedTopic, submittedAudience, submittedPlatform, submittedConstraints, submittedScene, submittedDuration), [submittedAudience, submittedConstraints, submittedDuration, submittedPlatform, submittedScene, submittedTopic]);
  const allPrompts = draft?.prompts.map((item, index) => `模板 ${index + 1}：${item.title}\n用途：${item.use}\n\n${item.prompt}`).join("\n\n---\n\n") ?? "";

  function reset() {
    setTopic(sampleTopic);
    setAudience(sampleAudience);
    setPlatform(samplePlatform);
    setConstraints(sampleConstraints);
    setScene("ideas");
    setDuration("30");
    setSubmittedTopic(sampleTopic);
    setSubmittedAudience(sampleAudience);
    setSubmittedPlatform(samplePlatform);
    setSubmittedConstraints(sampleConstraints);
    setSubmittedScene("ideas");
    setSubmittedDuration("30");
  }

  function submit() {
    setSubmittedTopic(topic);
    setSubmittedAudience(audience);
    setSubmittedPlatform(platform);
    setSubmittedConstraints(constraints);
    setSubmittedScene(scene);
    setSubmittedDuration(duration);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="按短视频场景筛选并填充可复制的 Prompt 模板，在浏览器本地整理选题、脚本、分镜和复盘素材。" /><div className="title-tool-grid"><TextareaField label="真实素材与限制" value={constraints} onChange={setConstraints} placeholder="每行写一条素材、事实、版权或拍摄限制" rows={9} /><div className="title-options"><label className="tool-field"><span>视频主题</span><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="例如：租房收纳、产品使用、学习方法" /></label><label className="tool-field"><span>目标观众</span><input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="例如：新手卖家、学生、通勤人群" /></label><label className="tool-field"><span>发布平台</span><input value={platform} onChange={(event) => setPlatform(event.target.value)} placeholder="例如：抖音、视频号、小红书" /></label><label className="tool-field"><span>模板场景</span><select value={scene} onChange={(event) => setScene(event.target.value as ShortVideoPromptScene)}>{scenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>预计时长</span><select value={duration} onChange={(event) => setDuration(event.target.value as ShortVideoPromptDuration)}>{durations.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!topic.trim()}><Clapperboard size={17} />整理 Prompt 模板</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板库，不调用 AI</span></div>{draft && <div className="prompt-library-result-list" aria-live="polite"><div className="prompt-library-header"><strong>{draft.sceneLabel} · {draft.durationLabel}</strong><span>已填充真实信息，可复制到你有权限使用的模型或工作流中</span></div>{draft.prompts.map((item) => <article className="prompt-library-card" key={item.title}><div className="prompt-library-card-heading"><div><strong>{item.title}</strong><small>{item.use}</small></div><CopyButton value={item.prompt} /></div><pre>{item.prompt}</pre></article>)}</div>}<div className="workspace-actions title-result-actions"><CopyButton value={allPrompts} />{allPrompts && <TextDownloadButton value={allPrompts} name="short-video-prompt-templates.txt" />}<span className="count-note">复制前请检查素材、授权与平台规则</span></div><HistoryControls toolSlug={tool.slug} content={allPrompts} title="短视频 Prompt 模板组" /><ToolNotice tone="warning">这是本地短视频 Prompt 模板库，不代表自动生成、实时热度、爆款预测或平台推荐；请只填入真实信息，核对版权、隐私、广告和平台规则。</ToolNotice></div>;
}
