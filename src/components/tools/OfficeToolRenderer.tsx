"use client";

import { ClipboardList, FileText, MessageCircleQuestion, Presentation, RefreshCw, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { generateInterviewPrep, generateLongTextHighlights, generatePptOutline, generateResumeContent, generateWeeklyReport, type InterviewStage, type LongTextDepth, type PptOutlineDuration, type PptOutlineScene, type ResumeProfile, type WeeklyReportAudience } from "@/lib/text";
import { CopyButton, HistoryControls, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

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
  if (tool.slug === "ai-long-summary") return <LongTextHighlightsTool tool={tool} />;
  if (tool.slug === "ai-interview-questions") return <InterviewPrepTool tool={tool} />;
  if (tool.slug === "ai-weekly-report") return <WeeklyReportTool tool={tool} />;
  if (tool.slug === "ai-ppt-outline") return <PptOutlineTool tool={tool} />;
  if (tool.slug === "ai-resume") return <ResumeContentTool tool={tool} />;
  return null;
}

const sampleWeeklyPeriod = "本周";
const sampleWeeklyFocus = "完成内容工具迭代并明确下一阶段的交付优先级";
const sampleWeeklyCompleted = "完成首页搜索体验复盘，确认首屏只保留高频入口\n上线本地简历内容整理工作区，完成复制与 TXT 下载\n整理用户反馈，记录 3 个下阶段优化方向";
const sampleWeeklyBlockers = "需要确认正式域名和 HTTPS 方案";
const sampleWeeklyNextPlan = "补齐周报整理工具的边界提示\n验证移动端表单和下载体验\n整理下一批学生学习工具需求";
const sampleWeeklySupport = "请产品确认学生学习场景的优先级";
const weeklyReportAudiences: Array<{ value: WeeklyReportAudience; label: string }> = [
  { value: "team", label: "项目团队" },
  { value: "manager", label: "直属负责人" },
  { value: "client", label: "客户 / 合作方" },
  { value: "personal", label: "个人复盘" },
];

const sampleInterviewRole = "产品运营";
const sampleInterviewFocus = "推动内容活动从策划、发布到复盘形成闭环";
const sampleInterviewExperience = "负责用户反馈整理与周报复盘\n协助推进一次内容活动，从准备、发布到结果记录形成闭环";
const sampleInterviewProjects = "搭建团队常用工具清单，减少新人查找资料的时间\n完成一次跨部门项目复盘，沉淀了可复用的检查表";
const sampleInterviewConcern = "缺少直接负责大型项目的经历";
const interviewStages: Array<{ value: InterviewStage; label: string }> = [
  { value: "screening", label: "初筛 / HR 面" },
  { value: "behavioral", label: "行为面 / 主管面" },
  { value: "case", label: "专业面 / 案例面" },
  { value: "final", label: "终面 / 沟通面" },
];

const sampleLongText = "产品复盘：本季度我们围绕新用户激活完成了三项迭代。\n\n关键结果：引导流程的完成率从 42% 提升到 56%，但数据来自有限样本，仍需要在下个周期继续验证。\n\n问题与风险：客服反馈仍集中在权限说明不清，部分客户无法判断下一步操作。\n\n下一步计划：产品负责补充权限说明，运营在周五前完成帮助文档更新，数据同学继续观察不同渠道的转化差异。";
const sampleLongTextFocus = "新用户激活与下一步计划";
const longTextDepths: Array<{ value: LongTextDepth; label: string }> = [
  { value: "compact", label: "精简：3 条重点" },
  { value: "standard", label: "标准：5 条重点" },
  { value: "detailed", label: "详细：8 条重点" },
];

function LongTextHighlightsTool({ tool }: { tool: ToolRecord }) {
  const [content, setContent] = useState(sampleLongText);
  const [focus, setFocus] = useState(sampleLongTextFocus);
  const [depth, setDepth] = useState<LongTextDepth>("standard");
  const [submittedContent, setSubmittedContent] = useState(sampleLongText);
  const [submittedFocus, setSubmittedFocus] = useState(sampleLongTextFocus);
  const [submittedDepth, setSubmittedDepth] = useState<LongTextDepth>("standard");
  const draft = useMemo(() => generateLongTextHighlights(submittedContent, submittedFocus, submittedDepth), [submittedContent, submittedDepth, submittedFocus]);
  const report = draft ? [
    `标题：${draft.title}`,
    draft.intro,
    `统计：${draft.stats.characters} 字 / ${draft.stats.lines} 行 / ${draft.stats.blocks} 个文本块`,
    "结构线索：",
    ...draft.outline.map((item, index) => `${index + 1}. ${item}`),
    "重点段落：",
    ...draft.highlights.map((item, index) => `${index + 1}. ${item.excerpt}（${item.reason}）`),
    "行动项线索：",
    ...draft.actions.map((item, index) => `${index + 1}. ${item}`),
    "阅读前检查：",
    ...draft.checklist.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n") : "";

  function reset() {
    setContent(sampleLongText);
    setFocus(sampleLongTextFocus);
    setDepth("standard");
    setSubmittedContent(sampleLongText);
    setSubmittedFocus(sampleLongTextFocus);
    setSubmittedDepth("standard");
  }

  function submit() {
    setSubmittedContent(content);
    setSubmittedFocus(focus);
    setSubmittedDepth(depth);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="粘贴文章或会议记录，在浏览器本地提取标题线索、重点段落和行动项。" /><div className="title-tool-grid"><TextareaField label="长文内容" value={content} onChange={setContent} placeholder="粘贴文章、会议记录或资料正文，建议保留段落和标题" rows={15} /><div className="title-options"><label className="tool-field"><span>阅读重点（可选）</span><input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="例如：结论、风险、下一步计划" /></label><label className="tool-field"><span>提取范围</span><select value={depth} onChange={(event) => setDepth(event.target.value as LongTextDepth)}>{longTextDepths.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><div className="tool-field long-text-boundary"><span>本地处理说明</span><p>工具按段落位置、长度和关键词提取原文片段，不改写、不翻译、不判断事实，也不会把抽取结果当成完整摘要。</p></div></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!content.trim()}><FileText size={17} />整理长文重点</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地原文抽取，不调用 AI</span></div>{draft && <div className="long-text-result-list" aria-live="polite"><div className="long-text-header"><strong>{draft.title}</strong><span>{draft.intro}</span></div><div className="long-text-stat-grid"><div><b>{draft.stats.characters}</b><span>字</span></div><div><b>{draft.stats.lines}</b><span>行</span></div><div><b>{draft.stats.blocks}</b><span>文本块</span></div></div><article className="long-text-section"><h3>结构线索</h3><ul>{draft.outline.map((item) => <li key={item}>{item}</li>)}</ul></article><section className="long-text-section"><h3>重点段落</h3><div className="long-text-highlight-list">{draft.highlights.map((item) => <article key={item.excerpt}><p>{item.excerpt}</p><small>{item.reason}</small></article>)}</div></section><article className="long-text-section"><h3>行动项线索</h3><ul>{draft.actions.map((item) => <li key={item}>{item}</li>)}</ul></article><div className="long-text-checklist"><strong>阅读前检查</strong><ul>{draft.checklist.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="long-text-highlights.txt" />}<span className="count-note">请回看上下文后再引用</span></div><HistoryControls toolSlug={tool.slug} content={report} title="长文重点整理结果" /><ToolNotice tone="warning">这是本地长文重点整理工具，不代表 AI 总结、事实核验或完整摘要；重点段落和行动项只是规则抽取结果，涉及数字、引用、客户资料和内部信息时请人工核对。</ToolNotice></div>;
}

function InterviewPrepTool({ tool }: { tool: ToolRecord }) {
  const [role, setRole] = useState(sampleInterviewRole);
  const [stage, setStage] = useState<InterviewStage>("screening");
  const [focus, setFocus] = useState(sampleInterviewFocus);
  const [experience, setExperience] = useState(sampleInterviewExperience);
  const [projects, setProjects] = useState(sampleInterviewProjects);
  const [concern, setConcern] = useState(sampleInterviewConcern);
  const [submittedRole, setSubmittedRole] = useState(sampleInterviewRole);
  const [submittedStage, setSubmittedStage] = useState<InterviewStage>("screening");
  const [submittedFocus, setSubmittedFocus] = useState(sampleInterviewFocus);
  const [submittedExperience, setSubmittedExperience] = useState(sampleInterviewExperience);
  const [submittedProjects, setSubmittedProjects] = useState(sampleInterviewProjects);
  const [submittedConcern, setSubmittedConcern] = useState(sampleInterviewConcern);
  const draft = useMemo(() => generateInterviewPrep(submittedRole, submittedStage, submittedFocus, submittedExperience, submittedProjects, submittedConcern), [submittedConcern, submittedExperience, submittedFocus, submittedProjects, submittedRole, submittedStage]);
  const report = draft ? [
    `标题：${draft.title}`,
    draft.intro,
    ...draft.questions.flatMap((question, index) => [`${index + 1}. ${question.title}`, `问题：${question.question}`, `准备：${question.preparation}`]),
    "可反问面试官：",
    ...draft.questionsToAsk.map((question, index) => `${index + 1}. ${question}`),
    "面试前检查：",
    ...draft.checklist.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n") : "";

  function reset() {
    setRole(sampleInterviewRole);
    setStage("screening");
    setFocus(sampleInterviewFocus);
    setExperience(sampleInterviewExperience);
    setProjects(sampleInterviewProjects);
    setConcern(sampleInterviewConcern);
    setSubmittedRole(sampleInterviewRole);
    setSubmittedStage("screening");
    setSubmittedFocus(sampleInterviewFocus);
    setSubmittedExperience(sampleInterviewExperience);
    setSubmittedProjects(sampleInterviewProjects);
    setSubmittedConcern(sampleInterviewConcern);
  }

  function submit() {
    setSubmittedRole(role);
    setSubmittedStage(stage);
    setSubmittedFocus(focus);
    setSubmittedExperience(experience);
    setSubmittedProjects(projects);
    setSubmittedConcern(concern);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入目标岗位和真实经历，在浏览器本地整理面试练习方向与追问清单。" /><div className="title-tool-grid"><TextareaField label="经历 / 项目材料" value={experience} onChange={setExperience} placeholder="每行写一段真实经历，尽量包含动作、结果和证据" rows={8} /><div className="title-options"><label className="tool-field"><span>目标岗位</span><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="例如：产品运营、前端开发" /></label><label className="tool-field"><span>面试阶段</span><select value={stage} onChange={(event) => setStage(event.target.value as InterviewStage)}>{interviewStages.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>重点方向</span><input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="例如：推动项目、数据分析、客户沟通" /></label><label className="tool-field"><span>想解释的短板</span><input value={concern} onChange={(event) => setConcern(event.target.value)} placeholder="例如：项目规模小、转行、空档期" /></label></div></div><div className="interview-prep-input-grid"><TextareaField label="项目 / 作品补充" value={projects} onChange={setProjects} placeholder="每行写一个项目、作品或案例，准备被追问的细节" rows={6} /><div className="tool-field interview-prep-boundary"><span>使用提示</span><p>只写你可以核对和公开的真实材料。工具会整理练习方向，不会判断录用概率，也不会替你编造答案。</p></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!role.trim()}><MessageCircleQuestion size={17} />整理面试准备</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地练习方向，不调用 AI</span></div>{draft && <div className="interview-prep-result-list" aria-live="polite"><div className="interview-prep-header"><strong>{draft.title}</strong><span>{draft.intro}</span></div>{draft.questions.map((question, index) => <article className="interview-prep-question" key={question.title}><div className="interview-prep-question-heading"><span>问题 {String(index + 1).padStart(2, "0")}</span><strong>{question.title}</strong></div><p>{question.question}</p><small>准备提示：{question.preparation}</small></article>)}<div className="interview-prep-ask"><strong>可反问面试官</strong><ul>{draft.questionsToAsk.map((question) => <li key={question}>{question}</li>)}</ul></div><div className="interview-prep-checklist"><strong>面试前检查</strong><ul>{draft.checklist.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="interview-prep-draft.txt" />}<span className="count-note">练习前请替换示例并核对经历</span></div><HistoryControls toolSlug={tool.slug} content={report} title="面试准备整理结果" /><ToolNotice tone="warning">这是本地面试准备整理工具，不代表 AI 生成、岗位匹配或录用预测；请不要编造经历、数字、项目名称或不会使用的技能，并注意不泄露客户和内部信息。</ToolNotice></div>;
}

function WeeklyReportTool({ tool }: { tool: ToolRecord }) {
  const [period, setPeriod] = useState(sampleWeeklyPeriod);
  const [audience, setAudience] = useState<WeeklyReportAudience>("team");
  const [focus, setFocus] = useState(sampleWeeklyFocus);
  const [completed, setCompleted] = useState(sampleWeeklyCompleted);
  const [blockers, setBlockers] = useState(sampleWeeklyBlockers);
  const [nextPlan, setNextPlan] = useState(sampleWeeklyNextPlan);
  const [support, setSupport] = useState(sampleWeeklySupport);
  const [submittedPeriod, setSubmittedPeriod] = useState(sampleWeeklyPeriod);
  const [submittedAudience, setSubmittedAudience] = useState<WeeklyReportAudience>("team");
  const [submittedFocus, setSubmittedFocus] = useState(sampleWeeklyFocus);
  const [submittedCompleted, setSubmittedCompleted] = useState(sampleWeeklyCompleted);
  const [submittedBlockers, setSubmittedBlockers] = useState(sampleWeeklyBlockers);
  const [submittedNextPlan, setSubmittedNextPlan] = useState(sampleWeeklyNextPlan);
  const [submittedSupport, setSubmittedSupport] = useState(sampleWeeklySupport);
  const draft = useMemo(() => generateWeeklyReport(submittedPeriod, submittedAudience, submittedFocus, submittedCompleted, submittedBlockers, submittedNextPlan, submittedSupport), [submittedAudience, submittedBlockers, submittedCompleted, submittedFocus, submittedNextPlan, submittedPeriod, submittedSupport]);
  const report = draft ? [
    `标题：${draft.title}`,
    draft.intro,
    ...draft.sections.flatMap((section) => [section.title, ...section.items.map((item) => `- ${item}`)]),
    "发送前检查：",
    ...draft.checklist.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n") : "";

  function reset() {
    setPeriod(sampleWeeklyPeriod);
    setAudience("team");
    setFocus(sampleWeeklyFocus);
    setCompleted(sampleWeeklyCompleted);
    setBlockers(sampleWeeklyBlockers);
    setNextPlan(sampleWeeklyNextPlan);
    setSupport(sampleWeeklySupport);
    setSubmittedPeriod(sampleWeeklyPeriod);
    setSubmittedAudience("team");
    setSubmittedFocus(sampleWeeklyFocus);
    setSubmittedCompleted(sampleWeeklyCompleted);
    setSubmittedBlockers(sampleWeeklyBlockers);
    setSubmittedNextPlan(sampleWeeklyNextPlan);
    setSubmittedSupport(sampleWeeklySupport);
  }

  function submit() {
    setSubmittedPeriod(period);
    setSubmittedAudience(audience);
    setSubmittedFocus(focus);
    setSubmittedCompleted(completed);
    setSubmittedBlockers(blockers);
    setSubmittedNextPlan(nextPlan);
    setSubmittedSupport(support);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入本周记录和下周计划，在浏览器本地整理一份可继续编辑的周报草稿。" /><div className="title-tool-grid"><TextareaField label="本周完成" value={completed} onChange={setCompleted} placeholder="每行写一项完成工作，尽量包含动作、结果和证据" rows={8} /><div className="title-options"><label className="tool-field"><span>周报周期</span><input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="例如：9 月 2 日—9 月 6 日" /></label><label className="tool-field"><span>汇报对象</span><select value={audience} onChange={(event) => setAudience(event.target.value as WeeklyReportAudience)}>{weeklyReportAudiences.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>本周重点</span><input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="一句话写最重要的结果或判断" /></label><TextareaField label="问题 / 风险" value={blockers} onChange={setBlockers} placeholder="没有也可以写：暂无；有问题请补充影响和依赖" rows={5} /></div></div><div className="weekly-report-input-grid"><TextareaField label="下周计划" value={nextPlan} onChange={setNextPlan} placeholder="每行写一项可执行计划，最好有优先级或时间点" rows={6} /><TextareaField label="需要协同" value={support} onChange={setSupport} placeholder="写清需要谁支持什么，以及希望何时完成" rows={6} /></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!period.trim()}><ClipboardList size={17} />整理工作周报</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地结构整理，不调用 AI</span></div>{draft && <div className="weekly-report-result-list" aria-live="polite"><div className="weekly-report-header"><strong>{draft.title}</strong><span>{draft.intro}</span></div>{draft.sections.map((section) => <article className="weekly-report-section" key={section.title}><h3>{section.title}</h3><ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}<div className="weekly-report-checklist"><strong>发送前检查</strong><ul>{draft.checklist.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="weekly-report-draft.txt" />}<span className="count-note">发送前请替换示例并核对信息</span></div><HistoryControls toolSlug={tool.slug} content={report} title="工作周报整理结果" /><ToolNotice tone="warning">这是本地工作周报整理工具，不代表 AI 总结、事实核验或自动发送；请检查数据、客户信息、内部资料、隐私和需要披露的风险。</ToolNotice></div>;
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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入目标岗位和真实经历，在浏览器本地整理一份可继续修改的简历内容草稿。" /><div className="title-tool-grid"><TextareaField label="工作 / 实习经历" value={experience} onChange={setExperience} placeholder="每行写一条经历，尽量包含动作、结果和证据" rows={8} /><div className="title-options"><label className="tool-field"><span>目标岗位</span><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="例如：产品运营、前端开发" /></label><label className="tool-field"><span>求职类型</span><select value={profile} onChange={(event) => setProfile(event.target.value as ResumeProfile)}>{resumeProfiles.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>核心优势</span><input value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder="一句话写最匹配岗位的能力" /></label><label className="tool-field"><span>技能关键词</span><input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="用逗号分隔，例如：Excel、项目管理" /></label><TextareaField label="项目 / 作品 / 成果" value={projects} onChange={setProjects} placeholder="每行写一个项目、作品或可量化成果" rows={6} /></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!role.trim()}><UserRound size={17} />整理简历内容</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地结构整理，不调用 AI</span></div>{draft && <div className="resume-result-list" aria-live="polite"><div className="resume-result-header"><strong>{draft.title}</strong><span>{draft.intro}</span></div>{draft.sections.map((section) => <article className="resume-section" key={section.title}><h3>{section.title}</h3><ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}<div className="resume-checklist"><strong>投递前检查</strong><ul>{draft.checklist.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="resume-content-draft.txt" />}<span className="count-note">请用真实经历替换提示语</span></div><HistoryControls toolSlug={tool.slug} content={report} title="简历内容整理结果" /><ToolNotice tone="warning">这是本地简历内容整理工具，不代表 AI 生成、岗位匹配或录用预测，也不会编造经历；请逐条核对时间、数字、项目名称、联系方式和隐私信息。</ToolNotice></div>;
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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入主题、受众和目标，在浏览器本地整理一份可继续编辑的演示文稿大纲。" /><div className="title-tool-grid"><TextareaField label="演示主题" value={topic} onChange={setTopic} placeholder="例如：季度复盘、产品培训、项目提案" rows={5} /><div className="title-options"><label className="tool-field"><span>目标受众</span><input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="例如：管理层、客户、团队成员" /></label><label className="tool-field"><span>演示目标</span><input value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="例如：对齐重点并推动下一步" /></label><label className="tool-field"><span>内容场景</span><select value={scene} onChange={(event) => setScene(event.target.value as PptOutlineScene)}>{pptOutlineScenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>预计时长</span><select value={duration} onChange={(event) => setDuration(event.target.value as PptOutlineDuration)}>{pptOutlineDurations.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!topic.trim()}><Presentation size={17} />整理 PPT 大纲</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地结构模板，不调用 AI</span></div>{draft && <div className="ppt-outline-result-list" aria-live="polite"><div className="ppt-outline-pace-note"><strong>{draft.title}</strong><span>{draft.subtitle}</span><small>{draft.paceNote}</small></div>{draft.slides.map((slide, index) => <article className="ppt-outline-slide" key={slide.title}><div className="ppt-outline-slide-heading"><div><span>第 {String(index + 1).padStart(2, "0")} 页</span><strong>{slide.title}</strong></div><b>结构</b></div><p className="ppt-outline-purpose">{slide.purpose}</p><ul className="ppt-outline-point-list">{slide.points.map((point) => <li key={point}>{point}</li>)}</ul><small className="ppt-outline-visual">视觉建议：{slide.visual}</small></article>)}</div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="ppt-outline.txt" />}<span className="count-note">导出后请替换为真实材料</span></div><HistoryControls toolSlug={tool.slug} content={report} title="PPT 大纲整理结果" /><ToolNotice tone="warning">这是本地结构整理工具，不代表 AI 生成、事实核验或演示效果预测；请自行补充真实数据、案例、引用和商业信息，并在演示前检查每页承诺。</ToolNotice></div>;
}
