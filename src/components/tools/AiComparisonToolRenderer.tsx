"use client";

import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { aiDirectoryCategoryLabels, aiDirectoryTools, type AiDirectoryCategory } from "@/data/ai-tools";
import type { ToolRecord } from "@/data/tools";
import { ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

type ComparisonTrack = "writing" | "image" | "video" | "coding";

const comparisonConfigs: Record<ComparisonTrack, { title: string; description: string; categories: AiDirectoryCategory[]; note: string }> = {
  writing: { title: "AI 写作工具对比", description: "按长文、研究、表达整理和知识协作场景筛选官方入口。", categories: ["writing", "general", "research", "workspace"], note: "写作工具的优势取决于素材、事实核对和编辑流程，本页不提供生成质量排名。" },
  image: { title: "AI 图片工具对比", description: "按视觉探索、社媒设计和通用多模态场景筛选官方入口。", categories: ["image", "general", "workspace"], note: "图片工具的版权、商用和输出限制可能变化，使用前请核对官方规则。" },
  video: { title: "AI 视频工具对比", description: "把视频创作拆成概念、脚本、视觉和生成环节，选择适合当前任务的入口。", categories: ["video", "image", "writing", "general"], note: "视频创作通常需要多个环节协作，本页按工作流角色对照，不把单一工具包装成全能方案。" },
  coding: { title: "AI 编程工具对比", description: "按代码补全、项目理解、问题拆解和协作场景筛选官方入口。", categories: ["coding", "general", "writing", "research"], note: "AI 编程工具不能替代代码审查、测试、权限控制和安全评估。" },
};

function getTrack(slug: string): ComparisonTrack {
  if (slug === "ai-image-comparison") return "image";
  if (slug === "ai-video-comparison") return "video";
  if (slug === "ai-coding-comparison") return "coding";
  return "writing";
}

export function AiComparisonToolRenderer({ tool }: { tool: ToolRecord }) {
  const track = getTrack(tool.slug);
  const config = comparisonConfigs[track];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AiDirectoryCategory | "all">("all");
  const visibleTools = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return aiDirectoryTools.filter((item) => {
      const matchesTrack = config.categories.includes(item.category);
      const matchesCategory = category === "all" || item.category === category;
      const searchable = `${item.name} ${item.description} ${item.bestFor}`.toLocaleLowerCase();
      return matchesTrack && matchesCategory && (!keyword || searchable.includes(keyword));
    });
  }, [category, config.categories, query]);
  const categories = ["all", ...config.categories] as Array<AiDirectoryCategory | "all">;

  return <div className="workspace-card"><WorkspaceHeader title={config.title} description={config.description} /><div className="ai-comparison-intro"><strong>怎么用这张对比表</strong><p>先按你要完成的环节筛选，再打开官方入口自行核对登录、地区、版权、隐私和费用规则。这里不读取实时价格，也不做“最好用”排名。</p></div><div className="ai-directory-toolbar"><label className="search-field ai-directory-search"><Search size={18} /><span className="sr-only">搜索 AI 工具</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索工具名称、场景或用途" /></label><span className="ai-directory-count" aria-live="polite">显示 <strong>{visibleTools.length}</strong> / {aiDirectoryTools.filter((item) => config.categories.includes(item.category)).length}</span></div><div className="filter-row" aria-label="AI 对比场景筛选">{categories.map((item) => <button type="button" className={`filter-chip ${category === item ? "active" : ""}`} aria-pressed={category === item} onClick={() => setCategory(item)} key={item}>{item === "all" ? "全部环节" : aiDirectoryCategoryLabels[item]}</button>)}</div>{visibleTools.length ? <div className="ai-comparison-grid" aria-live="polite">{visibleTools.map((item) => <article className="ai-comparison-card" key={item.name}><div className="ai-directory-card-head"><span className="ai-directory-category">{aiDirectoryCategoryLabels[item.category]}</span><span className="ai-directory-source">官方入口</span></div><div className="ai-directory-card-copy"><h3>{item.name}</h3><p>{item.description}</p></div><div className="ai-directory-best-for"><span>更适合</span><strong>{item.bestFor}</strong></div><a className="primary-button ai-directory-link" href={item.url} target="_blank" rel="noreferrer">打开官方入口 <ExternalLink size={16} /></a></article>)}</div> : <div className="empty-state ai-directory-empty"><span>⌕</span><strong>没有找到匹配入口</strong><p>换个关键词，或者先查看全部环节。</p></div>}<ToolNotice tone="warning">{config.note} 外部服务的功能、地区可用性、登录方式和费用请以官方页面为准。</ToolNotice></div>;
}
