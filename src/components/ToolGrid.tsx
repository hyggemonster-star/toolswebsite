import type { ToolRecord } from "@/data/tools";
import { ToolCard } from "./ToolCard";

export function ToolGrid({ tools, emptyText = "没有找到匹配的工具", className = "" }: { tools: ToolRecord[]; emptyText?: string; className?: string }) {
  if (tools.length === 0) {
    return <div className="empty-state"><span>☁️</span><strong>{emptyText}</strong><p>换个关键词试试看，或者先逛逛热门工具。</p></div>;
  }

  return <div className={`tool-grid ${className}`.trim()}>{tools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}</div>;
}
