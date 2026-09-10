import type { Metadata } from "next";
import { SceneToolkitGrid } from "@/components/SceneToolkitGrid";
import { ToolBrowser } from "@/components/ToolBrowser";
import { getImplementedTools, tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "全部工具",
  description: "搜索 AI效率工具箱的 100 个中文实用工具，支持按场景分类浏览。",
};

export default function ToolsPage() {
  return <main className="listing-page container"><div className="page-heading"><p className="eyebrow"><span className="eyebrow-dot" /> 工具库</p><h1>找到你现在<br /><span>需要的工具。</span></h1><p>搜索名称、场景或标签。{getImplementedTools().length} 个工具现在就能用，其余工具会逐步上线。</p></div><section className="toolkit-section" aria-labelledby="toolkit-title"><div className="section-heading"><div><p className="section-kicker">按任务开始</p><h2 id="toolkit-title">先选你要完成的事</h2></div><span className="heading-note">每组只放最常用的入口</span></div><SceneToolkitGrid /></section><ToolBrowser tools={tools} /></main>;
}
