import type { Metadata } from "next";
import { ToolBrowser } from "@/components/ToolBrowser";
import { getImplementedTools, tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "全部工具",
  description: "按办公文件、图片、视频音频、内容创作、AI、开发者和日常工具分类查找 AI效率工具箱。",
};

export default function ToolsPage() {
  const liveCount = getImplementedTools().length;
  return <main className="listing-page container"><div className="page-heading tools-page-heading"><p className="eyebrow"><span className="eyebrow-dot" /> 工具工作台</p><h1>按类别找到<br /><span>要用的工具。</span></h1><p>左侧选择分类，或搜索工具名称和用途。{liveCount} 个工具现在可用，未上线工具会明确标注。</p><div className="capability-strip" aria-label="工具能力分层"><span><strong>本地轻量版</strong>浏览器直接处理</span><span><strong>增强处理版</strong>未来支持大文件和高保真转换</span><span><strong>AI 增强版</strong>未来接入智能整理能力</span></div></div><ToolBrowser tools={tools} mode="library" showToolkits /></main>;
}
