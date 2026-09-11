import type { Metadata } from "next";
import { ToolBrowser } from "@/components/ToolBrowser";
import { getImplementedTools, tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "全部工具",
  description: "按办公文件、图片、视频音频、内容创作、AI、开发者和日常工具分类查找 AI效率工具箱。",
};

export default function ToolsPage() {
  const liveCount = getImplementedTools().length;
  return <main className="listing-page container"><div className="page-heading tools-page-heading"><div className="tools-heading-row"><h1>工具库</h1><span className="tools-live-count">{liveCount} 个可用</span></div></div><ToolBrowser tools={tools} mode="library" /></main>;
}
