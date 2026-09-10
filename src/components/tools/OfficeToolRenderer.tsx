"use client";

import { Presentation, RefreshCw, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { generatePptOutline, generateResumeContent, type PptOutlineDuration, type PptOutlineScene, type ResumeProfile } from "@/lib/text";
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
  if (tool.slug === "ai-resume") return <ResumeContentTool tool={tool} />;
  return null;
}

const sampleResumeRole = "产品运营";
const sampleResumeStrengths = "擅长把复杂任务拆成可执行的流程";
const sampleResumeExperience = "负责用户反馈整理与周报复盘\n协助推进一次内容活动，从准备、发布到结果记录形成闭环";
const sampleResumeProjects = "搭建团队常用工具清单，减少新人查找资料的时间\n完成一次跨部门项目复盘，沉淀了可复用的检查表";
const sampleResumeSkills = "项目协作、数据整理、内容运营、Excel";
const resumeProfiles: Array<{ value: ResumeProfile; label: string }> = [
  { value: "campus", label: "应届 / 实习" },
  { value: "experienced", label: "有工作经验" },
  { value: "career-change", label: "转行求职" },
  { value: "freelance", label: "项目制 / 自由职业" },
];

function ResumeContentTool({ tool }: { tool: ToolRecord }) {
  const [role, setRole] = useState(sampleResumeRole);
  const [profile, setProfile] = useState<ResumeProfile>("experienced");
  const [strengths, setStrengths] = useState(sampleResumeStrengths);
  const [experience, setExperience] = useState(sampleResumeExperience);
  const [projects, setProjects] = useState(sampleResumeProjects);
  const [skills, setSkills] = useState(sampleResumeSkills);
  const [submittedRole, setSubmittedRole] = useState(sampleResumeRole);
  const [submittedProfile, setSubmittedProfile] = useState<ResumeProfile>("experienced");
  const [submittedStrengths, setSubmittedStrengths] = useState(sampleResumeStrengths);
  const [submittedExperience, setSubmittedExperience] = useState(sampleResumeExperience);
  const [submittedProjects, setSubmittedProjects] = useState(sampleResumeProjects);
  const [submittedSkills, setSubmittedSkills] = useState(sampleResumeSkills);
  const draft = useMemo(() => generateResumeContent(submittedRole, submittedProfile, submittedStrengths, submittedExperience, submittedProjects, submittedSkills), [submittedExperience, submittedProfile, submittedProjects, submittedRole, submittedSkills, submittedStrengths]);
  const report = draft ? [
    `标题：${draft.title}`,
    draft.intro,
    ...draft.sections.flatMap((section) => [section.title, ...section.items.map((item) => `- ${item}`)]),
    "投递前检查：",
    ...draft.checklist.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n") : "";

  function reset() {
    setRole(sampleResumeRole);
    setProfile("experienced");
    setStrengths(sampleResumeStrengths);
    setExperience(sampleResumeExperience);
    setProjects(sampleResumeProjects);
    setSkills(sampleResumeSkills);
    setSubmittedRole(sampleResumeRole);
    setSubmittedProfile("experienced");
    setSubmittedStrengths(sampleResumeStrengths);
    setSubmittedExperience(sampleResumeExperience);
    setSubmittedProjects(sampleResumeProjects);
    setSubmittedSkills(sampleResumeSkills);
  }

  function submit() {
    setSubmittedRole(role);
    setSubmittedProfile(profile);
    setSubmittedStrengths(strengths);
    setSubmittedExperience(experience);
    setSubmittedProjects(projects);
    setSubmittedSkills(skills);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入目标岗位和真实经历，在浏览器本地整理一份可继续修改的简历内容草稿。" /><div className="title-tool-grid"><TextareaField label="工作 / 实习经历" value={experience} onChange={setExperience} placeholder="每行写一条经历，尽量包含动作、结果和证据" rows={8} /><div className="title-options"><label className="tool-field"><span>目标岗位</span><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="例如：产品运营、前端开发" /></label><label className="tool-field"><span>求职类型</span><select value={profile} onChange={(event) => setProfile(event.target.value as ResumeProfile)}>{resumeProfiles.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>核心优势</span><input value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder="一句话写最匹配岗位的能力" /></label><label className="tool-field"><span>技能关键词</span><input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="用逗号分隔，例如：Excel、项目管理" /></label><TextareaField label="项目 / 作品 / 成果" value={projects} onChange={setProjects} placeholder="每行写一个项目、作品或可量化成果" rows={6} /></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!role.trim()}><UserRound size={17} />整理简历内容</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地结构整理，不调用 AI</span></div>{draft && <div className="resume-result-list" aria-live="polite"><div className="resume-result-header"><strong>{draft.title}</strong><span>{draft.intro}</span></div>{draft.sections.map((section) => <article className="resume-section" key={section.title}><h3>{section.title}</h3><ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}<div className="resume-checklist"><strong>投递前检查</strong><ul>{draft.checklist.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="resume-content-draft.txt" />}<span className="count-note">请用真实经历替换提示语</span></div><ToolNotice tone="warning">这是本地简历内容整理工具，不代表 AI 生成、岗位匹配或录用预测，也不会编造经历；请逐条核对时间、数字、项目名称、联系方式和隐私信息。</ToolNotice></div>;
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
