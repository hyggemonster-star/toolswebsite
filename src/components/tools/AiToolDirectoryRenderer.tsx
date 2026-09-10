"use client";

import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { aiDirectoryCategoryLabels, aiDirectoryTools, type AiDirectoryCategory } from "@/data/ai-tools";
import type { ToolRecord } from "@/data/tools";
import { ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const categories: Array<AiDirectoryCategory | "all"> = ["all", "general", "research", "writing", "image", "video", "coding", "workspace"];

export function AiToolDirectoryRenderer({ tool }: { tool: ToolRecord }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AiDirectoryCategory | "all">("all");
  const visibleTools = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return aiDirectoryTools.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const searchable = `${item.name} ${item.description} ${item.bestFor}`.toLocaleLowerCase();
      return matchesCategory && (!keyword || searchable.includes(keyword));
    });
  }, [category, query]);

  return <div className="workspace-card">
    <WorkspaceHeader title={tool.name} description="按使用场景浏览一组可继续核对的 AI 服务入口；本目录只做场景索引，不读取实时价格、热度或平台推荐。" />
    <div className="ai-directory-toolbar">
      <label className="search-field ai-directory-search">
        <Search size={18} />
        <span className="sr-only">搜索 AI 工具</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索工具名称、场景或用途" />
      </label>
      <span className="ai-directory-count" aria-live="polite">显示 <strong>{visibleTools.length}</strong> / {aiDirectoryTools.length}</span>
    </div>
    <div className="filter-row" aria-label="AI 工具场景筛选">
      {categories.map((item) => <button type="button" className={`filter-chip ${category === item ? "active" : ""}`} aria-pressed={category === item} onClick={() => setCategory(item)} key={item}>{aiDirectoryCategoryLabels[item]}</button>)}
    </div>
    {visibleTools.length ? <div className="ai-directory-grid" aria-live="polite">{visibleTools.map((item) => <article className="ai-directory-card" key={item.name}>
      <div className="ai-directory-card-head"><span className="ai-directory-category">{aiDirectoryCategoryLabels[item.category]}</span><span className="ai-directory-source">官方入口</span></div>
      <div className="ai-directory-card-copy"><h3>{item.name}</h3><p>{item.description}</p></div>
      <div className="ai-directory-best-for"><span>适合</span><strong>{item.bestFor}</strong></div>
      <a className="primary-button ai-directory-link" href={item.url} target="_blank" rel="noreferrer">访问官方入口 <ExternalLink size={16} /></a>
    </article>)}</div> : <div className="empty-state ai-directory-empty"><span>⌕</span><strong>没有找到匹配的 AI 工具</strong><p>换个关键词，或者先查看全部场景。</p></div>}
    <ToolNotice tone="warning">目录中的外部服务可能调整功能、地区可用性、登录方式和费用；使用前请以官方页面为准，不要把第三方服务的结果当作事实、合规或安全保证。</ToolNotice>
  </div>;
}
