"use client";

import { Clapperboard, Hash, MessageCircle, RefreshCw, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { analyzeCreatorTitle, findCreatorRiskWords, formatCreatorNote, generateCommentReplies, generateCreatorHashtags, generateCreatorTitles, generateDouyinScript, generateMomentsCopies, generateShortVideoTitles, generateShortVideoStoryboard, generateWechatTitles, type CommentReplyScene, type CommentReplyTone, type CreatorHashtagScene, type CreatorTitleScene, type CreatorTitleTone, type DouyinScriptDuration, type DouyinScriptScene, type DouyinScriptTone, type MomentsCopyScene, type MomentsCopyTone, type NoteSpacing, type ShortVideoTitleScene, type ShortVideoTitleTone, type WechatTitleScene, type WechatTitleTone } from "@/lib/text";
import { AiEnhancementPanel } from "./AiEnhancementPanel";
import { CopyButton, HistoryControls, ResultBox, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

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
  if (tool.slug === "xhs-sensitive-word-check") return <SensitiveWordTool tool={tool} />;
  if (tool.slug === "xhs-title-analyzer") return <TitleAnalyzerTool tool={tool} />;
  if (tool.slug === "douyin-title-generator") return <DouyinTitleGeneratorTool tool={tool} />;
  if (tool.slug === "douyin-script-generator") return <DouyinScriptTool tool={tool} />;
  if (tool.slug === "short-video-storyboard") return <ShortVideoStoryboardTool tool={tool} />;
  if (tool.slug === "wechat-title-generator") return <WechatTitleGeneratorTool tool={tool} />;
  if (tool.slug === "moments-copy-generator") return <MomentsCopyGeneratorTool tool={tool} />;
  if (tool.slug === "comment-reply-generator") return <CommentReplyGeneratorTool tool={tool} />;
  return tool.slug === "xhs-hashtag-recommender" ? <HashtagRecommenderTool tool={tool} /> : <NoteFormatterTool tool={tool} />;
}

const sampleTitleTopic = "周末安静咖啡店";

const hashtagScenes: Array<{ value: CreatorHashtagScene; label: string }> = [
  { value: "lifestyle", label: "生活方式" },
  { value: "food", label: "美食探店" },
  { value: "travel", label: "旅行出行" },
  { value: "study", label: "学习成长" },
  { value: "work", label: "职场效率" },
  { value: "beauty", label: "穿搭美妆" },
  { value: "home", label: "家居生活" },
  { value: "other", label: "其他主题" },
];

function HashtagRecommenderTool({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(sampleTitleTopic);
  const [submittedTopic, setSubmittedTopic] = useState(sampleTitleTopic);
  const [scene, setScene] = useState<CreatorHashtagScene>("food");
  const tags = useMemo(() => generateCreatorHashtags(submittedTopic, scene), [scene, submittedTopic]);
  const allTags = tags.join(" ");

  function reset() {
    setTopic(sampleTitleTopic);
    setSubmittedTopic(sampleTitleTopic);
    setScene("food");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="根据主题关键词和内容场景，整理一组可供人工筛选的标签方向。" /><div className="title-tool-grid"><TextareaField label="笔记主题或标题" value={topic} onChange={setTopic} placeholder="例如：租房收纳、通勤早餐、周末旅行" rows={5} /><label className="tool-field"><span>内容场景</span><select value={scene} onChange={(event) => setScene(event.target.value as CreatorHashtagScene)}>{hashtagScenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmittedTopic(topic)} disabled={!topic.trim()}><Hash size={17} />整理标签方向</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地词库组合，不调用平台接口</span></div><div className="hashtag-result-panel" aria-live="polite"><div className="title-result-heading"><span>标签方向</span><small>{tags.length} 条可筛选</small></div><div className="hashtag-list">{tags.map((tag) => <span className="hashtag-chip" key={tag}>{tag}</span>)}</div></div><div className="workspace-actions"><CopyButton value={allTags} />{allTags && <TextDownloadButton value={allTags} name="xhs-hashtag-directions.txt" />}<span className="count-note">建议结合真实内容人工筛选 5～8 个</span></div><HistoryControls toolSlug={tool.slug} content={allTags} title="小红书标签方向" /><ToolNotice tone="warning">结果来自本地维护的主题词库，不代表实时热度、平台推荐或流量预测；发布前请核对标签与正文是否真正相关。</ToolNotice></div>;
}

const sampleAnalyzerTitle = "周末安静咖啡店：适合一个人工作的 3 个细节";

function TitleAnalyzerTool({ tool }: { tool: ToolRecord }) {
  const [input, setInput] = useState(sampleAnalyzerTitle);
  const analysis = useMemo(() => analyzeCreatorTitle(input), [input]);
  const signals = [
    { label: "场景 / 人群", active: analysis.hasSceneSignal },
    { label: "内容收益", active: analysis.hasBenefitSignal },
    { label: "疑问 / 清单", active: analysis.hasQuestionHook || analysis.hasListSignal },
    { label: "数字信息", active: analysis.digitCount > 0 },
  ];
  const report = analysis.title ? [
    `标题：${analysis.title}`,
    `结构完成度（启发式）：${analysis.structureScore}/100`,
    `总字符：${analysis.characterCount}`,
    `内容字符：${analysis.contentCharacterCount}`,
    `数字：${analysis.digitCount}｜标点：${analysis.punctuationCount}｜表情符号：${analysis.emojiCount}`,
    `结构信号：${signals.filter((signal) => signal.active).map((signal) => signal.label).join("、") || "暂未识别"}`,
    "优化建议：",
    ...analysis.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`),
  ].join("\n") : "";

  function reset() {
    setInput(sampleAnalyzerTitle);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="检查标题长度和可解释结构信号，帮助你做发布前的原创表达复盘。" /><TextareaField label="待分析标题" value={input} onChange={setInput} placeholder="粘贴一条准备发布的标题" rows={4} /><div className="title-analysis-result" aria-live="polite"><div className="title-analysis-score"><div><span>结构完成度（启发式）</span><small>只用于复盘，不代表平台表现</small></div><strong>{analysis.structureScore}</strong></div><div className="metric-grid"><div><strong>{analysis.characterCount}</strong><span>总字符</span></div><div><strong>{analysis.contentCharacterCount}</strong><span>内容字符</span></div><div><strong>{analysis.digitCount}</strong><span>数字</span></div><div><strong>{analysis.punctuationCount}</strong><span>标点</span></div></div><div className="title-analysis-signal-grid">{signals.map((signal) => <div className={`title-analysis-signal ${signal.active ? "is-present" : ""}`} key={signal.label}><span>{signal.label}</span><strong>{signal.active ? "已识别" : "可补充"}</strong></div>)}</div><div className="title-analysis-suggestions"><strong>下一步建议</strong><ul>{analysis.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul></div></div><div className="workspace-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="xhs-title-analysis.txt" />}<button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地启发式分析，不调用平台数据</span></div><HistoryControls toolSlug={tool.slug} content={report} title="小红书标题结构分析结果" /><ToolNotice tone="warning">分析只检查标题本身的长度和表达信号，不等于爆款预测，也不能替代对事实、版权、广告法和平台规则的人工核对。</ToolNotice></div>;
}

const sampleShortVideoTopic = "租房收纳";
const shortVideoScenes: Array<{ value: ShortVideoTitleScene; label: string }> = [
  { value: "story", label: "真实记录" },
  { value: "guide", label: "实用教程" },
  { value: "review", label: "体验测评" },
  { value: "list", label: "清单盘点" },
];
const shortVideoTones: Array<{ value: ShortVideoTitleTone; label: string }> = [
  { value: "direct", label: "直接明确" },
  { value: "curious", label: "问题引导" },
  { value: "natural", label: "自然分享" },
];

function DouyinTitleGeneratorTool({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(sampleShortVideoTopic);
  const [submittedTopic, setSubmittedTopic] = useState(sampleShortVideoTopic);
  const [scene, setScene] = useState<ShortVideoTitleScene>("guide");
  const [tone, setTone] = useState<ShortVideoTitleTone>("direct");
  const drafts = useMemo(() => generateShortVideoTitles(submittedTopic, scene, tone), [scene, submittedTopic, tone]);
  const allDrafts = drafts.map((draft, index) => `${index + 1}. ${draft.title}\n开场方向：${draft.hook}`).join("\n\n");

  function reset() {
    setTopic(sampleShortVideoTopic);
    setSubmittedTopic(sampleShortVideoTopic);
    setScene("guide");
    setTone("direct");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="围绕视频主题整理标题方向和开场思路，方便拍摄前先把表达顺序想清楚。" /><div className="title-tool-grid"><TextareaField label="视频主题" value={topic} onChange={setTopic} placeholder="例如：通勤早餐、租房收纳、周末旅行" rows={5} /><div className="title-options"><label className="tool-field"><span>内容场景</span><select value={scene} onChange={(event) => setScene(event.target.value as ShortVideoTitleScene)}>{shortVideoScenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>表达语气</span><select value={tone} onChange={(event) => setTone(event.target.value as ShortVideoTitleTone)}>{shortVideoTones.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmittedTopic(topic)} disabled={!topic.trim()}><WandSparkles size={17} />生成标题方向</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板组合，不调用 AI</span></div><div className="title-result-list short-video-result-list" aria-live="polite"><div className="title-result-heading"><span>标题与开场方向</span><small>{drafts.length} 组可筛选</small></div>{drafts.map((draft, index) => <article className="title-result-item" key={draft.title}><div className="title-result-copy"><span>{String(index + 1).padStart(2, "0")}</span><div className="short-video-result-copy"><p>{draft.title}</p><small>开场方向：{draft.hook}</small></div></div><CopyButton value={`${draft.title}\n开场方向：${draft.hook}`} /></article>)}</div><div className="workspace-actions title-result-actions"><CopyButton value={allDrafts} />{allDrafts && <TextDownloadButton value={allDrafts} name="douyin-title-directions.txt" />}<span className="count-note">发布前请让标题与视频内容保持一致</span></div><HistoryControls toolSlug={tool.slug} content={allDrafts} title="抖音标题方向" /><ToolNotice tone="warning">这是本地模板组合工具，不代表爆款预测或平台推荐；请根据真实视频修改标题，避免夸大承诺和与内容不符的表达。</ToolNotice></div>;
}

const sampleDouyinScriptTopic = "通勤早餐";
const douyinScriptScenes: Array<{ value: DouyinScriptScene; label: string }> = [
  { value: "guide", label: "实用教程" },
  { value: "review", label: "体验测评" },
  { value: "story", label: "真实记录" },
  { value: "list", label: "清单盘点" },
];
const douyinScriptTones: Array<{ value: DouyinScriptTone; label: string }> = [
  { value: "natural", label: "自然分享" },
  { value: "direct", label: "直接明确" },
  { value: "warm", label: "温和陪伴" },
];
const douyinScriptDurations: Array<{ value: DouyinScriptDuration; label: string }> = [
  { value: "30", label: "30 秒" },
  { value: "60", label: "60 秒" },
  { value: "90", label: "90 秒" },
];

function DouyinScriptTool({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(sampleDouyinScriptTopic);
  const [submittedTopic, setSubmittedTopic] = useState(sampleDouyinScriptTopic);
  const [scene, setScene] = useState<DouyinScriptScene>("guide");
  const [tone, setTone] = useState<DouyinScriptTone>("natural");
  const [duration, setDuration] = useState<DouyinScriptDuration>("60");
  const draft = useMemo(() => generateDouyinScript(submittedTopic, scene, tone, duration), [duration, scene, submittedTopic, tone]);
  const report = draft ? [
    `主题：${submittedTopic.trim()}`,
    draft.paceNote,
    ...draft.sections.flatMap((section, index) => [
      `${index + 1}. ${section.label}`,
      `口播：${section.narration}`,
      `画面：${section.visual}`,
    ]),
    "发布前检查：",
    ...draft.checklist.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n") : "";

  function reset() {
    setTopic(sampleDouyinScriptTopic);
    setSubmittedTopic(sampleDouyinScriptTopic);
    setScene("guide");
    setTone("natural");
    setDuration("60");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="根据主题生成可编辑的口播结构和画面提示，拍摄前先把表达顺序想清楚。" /><div className="title-tool-grid"><TextareaField label="视频主题" value={topic} onChange={setTopic} placeholder="例如：通勤早餐、租房收纳、周末旅行" rows={5} /><div className="title-options"><label className="tool-field"><span>内容场景</span><select value={scene} onChange={(event) => setScene(event.target.value as DouyinScriptScene)}>{douyinScriptScenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>表达语气</span><select value={tone} onChange={(event) => setTone(event.target.value as DouyinScriptTone)}>{douyinScriptTones.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>视频时长</span><select value={duration} onChange={(event) => setDuration(event.target.value as DouyinScriptDuration)}>{douyinScriptDurations.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmittedTopic(topic)} disabled={!topic.trim()}><WandSparkles size={17} />生成脚本</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板组合，不调用 AI</span></div>{draft && <div className="script-result-list" aria-live="polite"><div className="script-pace-note">{draft.paceNote}</div>{draft.sections.map((section, index) => <article className="script-result-item" key={section.label}><div className="script-result-item-heading"><span>{String(index + 1).padStart(2, "0")}</span>{section.label}</div><p className="script-narration">口播：{section.narration}</p><small className="script-visual">画面：{section.visual}</small></article>)}</div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="douyin-script-draft.txt" />}<span className="count-note">发布前核对真实内容</span></div><HistoryControls toolSlug={tool.slug} content={report} title="抖音口播脚本草稿" /><ToolNotice tone="warning">这是可编辑的本地脚本草稿，不代表 AI 事实核验或平台推荐；请将数字、效果和案例换成真实内容，避免夸大承诺。</ToolNotice><AiEnhancementPanel taskType="douyin_script" toolSlug={tool.slug} title="抖音口播脚本" input={{ topic: submittedTopic, scene, tone, duration }} localContent={report} /></div>;
}

function ShortVideoStoryboardTool({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(sampleDouyinScriptTopic);
  const [submittedTopic, setSubmittedTopic] = useState(sampleDouyinScriptTopic);
  const [scene, setScene] = useState<DouyinScriptScene>("guide");
  const [duration, setDuration] = useState<DouyinScriptDuration>("60");
  const draft = useMemo(() => generateShortVideoStoryboard(submittedTopic, scene, duration), [duration, scene, submittedTopic]);
  const report = draft ? [
    `主题：${submittedTopic.trim()}`,
    draft.paceNote,
    ...draft.shots.flatMap((shot, index) => [
      `${index + 1}. ${shot.label}（${shot.duration}）`,
      `景别：${shot.framing}`,
      `画面：${shot.visual}`,
      `口播：${shot.narration}`,
      `拍摄重点：${shot.purpose}`,
    ]),
    "拍摄前检查：",
    ...draft.checklist.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n") : "";

  function reset() {
    setTopic(sampleDouyinScriptTopic);
    setSubmittedTopic(sampleDouyinScriptTopic);
    setScene("guide");
    setDuration("60");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="把口播主题拆成镜号、景别、画面、台词和拍摄重点，拿着清单就能开始准备。" /><div className="title-tool-grid"><TextareaField label="视频主题" value={topic} onChange={setTopic} placeholder="例如：通勤早餐、租房收纳、周末旅行" rows={5} /><div className="title-options"><label className="tool-field"><span>内容场景</span><select value={scene} onChange={(event) => setScene(event.target.value as DouyinScriptScene)}>{douyinScriptScenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>视频时长</span><select value={duration} onChange={(event) => setDuration(event.target.value as DouyinScriptDuration)}>{douyinScriptDurations.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmittedTopic(topic)} disabled={!topic.trim()}><Clapperboard size={17} />生成分镜</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板组合，不调用 AI</span></div>{draft && <div className="storyboard-result-list" aria-live="polite"><div className="storyboard-pace-note">{draft.paceNote}</div>{draft.shots.map((shot, index) => <article className="storyboard-result-item" key={shot.label}><div className="storyboard-result-heading"><div><span>镜头 {String(index + 1).padStart(2, "0")}</span><strong>{shot.label}</strong></div><b>{shot.duration}</b></div><div className="storyboard-shot-grid"><div><small>景别</small><p>{shot.framing}</p></div><div><small>画面</small><p>{shot.visual}</p></div><div><small>口播</small><p>{shot.narration}</p></div><div><small>拍摄重点</small><p>{shot.purpose}</p></div></div></article>)}</div>}<div className="workspace-actions title-result-actions"><CopyButton value={report} />{report && <TextDownloadButton value={report} name="short-video-storyboard.txt" />}<span className="count-note">拍摄前核对真实内容与授权</span></div><HistoryControls toolSlug={tool.slug} content={report} title="短视频分镜草稿" /><ToolNotice tone="warning">这是可编辑的本地分镜草稿，不代表 AI 事实核验或平台推荐；请将数字、效果、案例和素材授权逐项核对后再拍摄发布。</ToolNotice></div>;
}

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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入一个主题，快速得到可人工筛选的小红书标题方向。" /><div className="title-tool-grid"><TextareaField label="内容主题" value={topic} onChange={setTopic} placeholder="例如：通勤早餐、租房收纳、周末旅行" rows={5} /><div className="title-options"><label className="tool-field"><span>内容场景</span><select value={scene} onChange={(event) => setScene(event.target.value as CreatorTitleScene)}><option value="experience">真实体验</option><option value="guide">实用攻略</option><option value="review">选择测评</option><option value="list">清单分享</option></select></label><label className="tool-field"><span>表达语气</span><select value={tone} onChange={(event) => setTone(event.target.value as CreatorTitleTone)}><option value="natural">自然分享</option><option value="practical">实用干货</option><option value="curious">提问引导</option></select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmittedTopic(topic)} disabled={!topic.trim()}><WandSparkles size={17} />生成标题方向</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板组合，不调用 AI</span></div><div className="title-result-list" aria-live="polite"><div className="title-result-heading"><span>标题方向</span><small>{titles.length} 条可筛选</small></div>{titles.map((title, index) => <article className="title-result-item" key={title}><div className="title-result-copy"><span>{String(index + 1).padStart(2, "0")}</span><p>{title}</p></div><CopyButton value={title} /></article>)}</div><div className="workspace-actions title-result-actions"><CopyButton value={allTitles} />{allTitles && <TextDownloadButton value={allTitles} name="xhs-title-directions.txt" />}<span className="count-note">发布前请人工核对事实、语气和平台规范</span></div><HistoryControls toolSlug={tool.slug} content={allTitles} title="小红书标题方向" /><ToolNotice tone="warning">这是本地模板组合工具，不代表爆款预测，也不会替代你的选题判断；标题中的具体承诺请根据真实内容修改。</ToolNotice><AiEnhancementPanel taskType="xhs_title" toolSlug={tool.slug} title="小红书标题" input={{ topic: submittedTopic, scene, tone }} localContent={allTitles} /></div>;
}

const sampleWechatTitleTopic = "团队远程协作";
const wechatTitleScenes: Array<{ value: WechatTitleScene; label: string }> = [
  { value: "experience", label: "实践复盘" },
  { value: "guide", label: "实用方法" },
  { value: "insight", label: "观点观察" },
  { value: "list", label: "清单总结" },
];
const wechatTitleTones: Array<{ value: WechatTitleTone; label: string }> = [
  { value: "clear", label: "清晰直接" },
  { value: "warm", label: "温和分享" },
  { value: "curious", label: "问题引导" },
];

function WechatTitleGeneratorTool({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(sampleWechatTitleTopic);
  const [submittedTopic, setSubmittedTopic] = useState(sampleWechatTitleTopic);
  const [scene, setScene] = useState<WechatTitleScene>("experience");
  const [tone, setTone] = useState<WechatTitleTone>("clear");
  const titles = useMemo(() => generateWechatTitles(submittedTopic, scene, tone), [scene, submittedTopic, tone]);
  const allTitles = titles.map((title, index) => `${index + 1}. ${title}`).join("\n");

  function reset() {
    setTopic(sampleWechatTitleTopic);
    setSubmittedTopic(sampleWechatTitleTopic);
    setScene("experience");
    setTone("clear");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入文章主题，整理一组可编辑、可人工筛选的公众号标题方向。" /><div className="title-tool-grid"><TextareaField label="文章主题" value={topic} onChange={setTopic} placeholder="例如：团队协作、读书笔记、周末旅行" rows={5} /><div className="title-options"><label className="tool-field"><span>内容方向</span><select value={scene} onChange={(event) => setScene(event.target.value as WechatTitleScene)}>{wechatTitleScenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>表达语气</span><select value={tone} onChange={(event) => setTone(event.target.value as WechatTitleTone)}>{wechatTitleTones.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmittedTopic(topic)} disabled={!topic.trim()}><WandSparkles size={17} />整理标题方向</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板组合，不调用 AI</span></div><div className="title-result-list" aria-live="polite"><div className="title-result-heading"><span>公众号标题方向</span><small>{titles.length} 条可筛选</small></div>{titles.map((title, index) => <article className="title-result-item" key={title}><div className="title-result-copy"><span>{String(index + 1).padStart(2, "0")}</span><p>{title}</p></div><CopyButton value={title} /></article>)}</div><div className="workspace-actions title-result-actions"><CopyButton value={allTitles} />{allTitles && <TextDownloadButton value={allTitles} name="wechat-title-directions.txt" />}<span className="count-note">发布前请核对标题与正文是否一致</span></div><HistoryControls toolSlug={tool.slug} content={allTitles} title="公众号标题方向" /><ToolNotice tone="warning">这是本地模板组合工具，不代表打开率预测或平台推荐；请根据真实文章修改具体承诺，并在发布前核对事实、版权和广告规范。</ToolNotice></div>;
}

const sampleMomentsTopic = "周末去海边散步";
const momentsCopyScenes: Array<{ value: MomentsCopyScene; label: string }> = [
  { value: "daily", label: "日常记录" },
  { value: "work", label: "工作分享" },
  { value: "recommendation", label: "体验分享" },
  { value: "celebration", label: "节日问候" },
];
const momentsCopyTones: Array<{ value: MomentsCopyTone; label: string }> = [
  { value: "natural", label: "自然简短" },
  { value: "warm", label: "温暖真诚" },
  { value: "playful", label: "轻松互动" },
];

function MomentsCopyGeneratorTool({ tool }: { tool: ToolRecord }) {
  const [topic, setTopic] = useState(sampleMomentsTopic);
  const [submittedTopic, setSubmittedTopic] = useState(sampleMomentsTopic);
  const [scene, setScene] = useState<MomentsCopyScene>("daily");
  const [tone, setTone] = useState<MomentsCopyTone>("natural");
  const copies = useMemo(() => generateMomentsCopies(submittedTopic, scene, tone), [scene, submittedTopic, tone]);
  const allCopies = copies.map((copy, index) => `${index + 1}. ${copy}`).join("\n\n");

  function reset() {
    setTopic(sampleMomentsTopic);
    setSubmittedTopic(sampleMomentsTopic);
    setScene("daily");
    setTone("natural");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入想分享的事情，整理一组克制、自然、可以继续修改的朋友圈文案方向。" /><div className="title-tool-grid"><TextareaField label="分享主题或场景" value={topic} onChange={setTopic} placeholder="例如：周末露营、完成一个小目标、最近在用的工具" rows={5} /><div className="title-options"><label className="tool-field"><span>内容方向</span><select value={scene} onChange={(event) => setScene(event.target.value as MomentsCopyScene)}>{momentsCopyScenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>表达语气</span><select value={tone} onChange={(event) => setTone(event.target.value as MomentsCopyTone)}>{momentsCopyTones.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmittedTopic(topic)} disabled={!topic.trim()}><MessageCircle size={17} />整理朋友圈文案</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板组合，不调用 AI</span></div><div className="title-result-list" aria-live="polite"><div className="title-result-heading"><span>朋友圈文案方向</span><small>{copies.length} 条可编辑</small></div>{copies.map((copy, index) => <article className="title-result-item" key={copy}><div className="title-result-copy"><span>{String(index + 1).padStart(2, "0")}</span><p>{copy}</p></div><CopyButton value={copy} /></article>)}</div><div className="workspace-actions title-result-actions"><CopyButton value={allCopies} />{allCopies && <TextDownloadButton value={allCopies} name="moments-copy-directions.txt" />}<span className="count-note">发布前请改成符合你真实经历的表达</span></div><HistoryControls toolSlug={tool.slug} content={allCopies} title="朋友圈文案方向" /><ToolNotice tone="warning">这是本地文案草稿工具，不会替你发朋友圈，也不代表广告投放、平台推荐或互动效果；请核对事实、版权和商业合作披露要求，避免夸大承诺。</ToolNotice></div>;
}

const sampleComment = "这篇整理很实用，能不能再说说你是怎么开始的？";
const commentReplyScenes: Array<{ value: CommentReplyScene; label: string }> = [
  { value: "appreciation", label: "认可感谢" },
  { value: "question", label: "问题咨询" },
  { value: "sharing", label: "经验补充" },
  { value: "clarification", label: "异议澄清" },
];
const commentReplyTones: Array<{ value: CommentReplyTone; label: string }> = [
  { value: "natural", label: "自然交流" },
  { value: "warm", label: "温和真诚" },
  { value: "concise", label: "简短克制" },
];

function CommentReplyGeneratorTool({ tool }: { tool: ToolRecord }) {
  const [comment, setComment] = useState(sampleComment);
  const [submittedComment, setSubmittedComment] = useState(sampleComment);
  const [scene, setScene] = useState<CommentReplyScene>("question");
  const [tone, setTone] = useState<CommentReplyTone>("natural");
  const replies = useMemo(() => generateCommentReplies(submittedComment, scene, tone), [scene, submittedComment, tone]);
  const allReplies = replies.map((reply, index) => `${index + 1}. ${reply}`).join("\n\n");

  function reset() {
    setComment(sampleComment);
    setSubmittedComment(sampleComment);
    setScene("question");
    setTone("natural");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="输入一条评论，整理一组礼貌、自然、可以继续按真实情况修改的回复方向。" /><div className="title-tool-grid"><TextareaField label="评论原文" value={comment} onChange={setComment} placeholder="例如：这个方法对新手也适用吗？" rows={5} /><div className="title-options"><label className="tool-field"><span>回复场景</span><select value={scene} onChange={(event) => setScene(event.target.value as CommentReplyScene)}>{commentReplyScenes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>表达语气</span><select value={tone} onChange={(event) => setTone(event.target.value as CommentReplyTone)}>{commentReplyTones.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={() => setSubmittedComment(comment)} disabled={!comment.trim()}><MessageCircle size={17} />整理回复方向</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板组合，不调用 AI</span></div><div className="title-result-list" aria-live="polite"><div className="title-result-heading"><span>评论回复方向</span><small>{replies.length} 条可编辑</small></div>{replies.map((reply, index) => <article className="title-result-item" key={reply}><div className="title-result-copy"><span>{String(index + 1).padStart(2, "0")}</span><p>{reply}</p></div><CopyButton value={reply} /></article>)}</div><div className="workspace-actions title-result-actions"><CopyButton value={allReplies} />{allReplies && <TextDownloadButton value={allReplies} name="comment-reply-directions.txt" />}<span className="count-note">发布前请让回复符合你的真实立场</span></div><HistoryControls toolSlug={tool.slug} content={allReplies} title="评论回复方向" /><ToolNotice tone="warning">这是本地回复草稿工具，不会批量代发或替你判断事实；请避免骚扰式重复回复，并根据真实上下文核对承诺、版权、广告和隐私边界。</ToolNotice></div>;
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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description={isWechat ? "清理公众号复制粘贴带来的空格、空行和列表符号，保留你的原文内容。" : "清理复制粘贴带来的空格和空行，整理成更易阅读的笔记草稿。"} /><div className="segmented-control" role="group" aria-label="段落间距"><button type="button" className={spacing === "standard" ? "selected" : ""} onClick={() => setSpacing("standard")}>标准段落</button><button type="button" className={spacing === "airy" ? "selected" : ""} onClick={() => setSpacing("airy")}>宽松段落</button></div><div className="workspace-grid"><TextareaField label={isWechat ? "原始公众号内容" : "原始笔记"} value={input} onChange={setInput} placeholder={isWechat ? "粘贴公众号草稿" : "粘贴笔记内容"} rows={13} /><ResultBox label={isWechat ? "清理结果" : "排版结果"} value={output} placeholder="整理后的文字会显示在这里" /></div><div className="workspace-actions"><CopyButton value={output} />{output && <TextDownloadButton value={output} name={isWechat ? "wechat-formatted.txt" : "xhs-note-formatted.txt"} />}<button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">只整理格式，不改写内容</span></div><HistoryControls toolSlug={tool.slug} content={output} title={isWechat ? "公众号排版结果" : "小红书笔记排版结果"} /><ToolNotice tone="warning">结果只是原文格式草稿，不会替你校对事实、版权、广告法或平台规范；发布前请在目标编辑器中再次检查。</ToolNotice></div>;
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

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="辅助找出可能需要人工复核的风险表达，支持补充自定义检测词。" /><div className="workspace-grid"><TextareaField label="待检查文案" value={input} onChange={setInput} placeholder="粘贴需要检查的原创文案" rows={13} /><div><label className="tool-field"><span>补充检测词（可选）</span><textarea value={customTerms} onChange={(event) => setCustomTerms(event.target.value)} placeholder="多个词用逗号或换行分隔" rows={5} spellCheck={false} /></label><div className={`risk-summary ${matches.length ? "has-risk" : "is-clear"}`} aria-live="polite"><strong>{matches.length ? `发现 ${matches.length} 处候选表达` : "暂未发现候选表达"}</strong><span>{matches.length ? `需要复核：${matchedTerms}` : "仍请结合具体语境和平台规则人工判断"}</span></div>{matches.length > 0 && <div className="risk-list">{matches.map((match, index) => <div className="risk-item" key={`${match.term}-${match.index}-${index}`}><strong>{match.term}</strong><span>位置 {match.index + 1}</span><p>{match.context}</p></div>)}</div>}</div></div><div className="workspace-actions"><CopyButton value={matchedTerms} /><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">只做辅助检查，不替代平台审核</span></div><HistoryControls toolSlug={tool.slug} content={matchedTerms} title="风险表达检查结果" /><ToolNotice tone="warning">词库是可维护的候选风险表达，平台规则会变化且可能误报；内容只在当前浏览器处理，请自行核对事实、广告法和平台要求。</ToolNotice></div>;
}
