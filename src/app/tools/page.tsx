import type { Metadata } from "next";
import { ToolBrowser } from "@/components/ToolBrowser";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "全部工具",
  description: "浏览 AI效率工具箱的 100 个中文实用工具，支持搜索和分类筛选。",
};

export default async function ToolsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";

  return <main className="listing-page container"><div className="page-heading"><p className="eyebrow"><span className="eyebrow-dot" /> 工具目录</p><h1>找到适合当下的<br /><span>那个小工具。</span></h1><p>100 个工具按场景整理，先从已上线的本地工具开始。</p></div><ToolBrowser initialQuery={initialQuery} tools={tools} /></main>;
}
