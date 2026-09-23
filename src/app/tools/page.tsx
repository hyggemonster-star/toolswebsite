import type { Metadata } from "next";
import { ToolBrowser } from "@/components/ToolBrowser";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "全部工具",
  description: "按办公文件、图片、视频音频、内容创作、智能工具、开发者和日常工具分类查找中文效率工具箱。",
};

export default function ToolsPage() {
  return <main className="listing-page container"><ToolBrowser tools={tools} mode="library" /></main>;
}
