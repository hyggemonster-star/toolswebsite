"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { ToolRecord } from "@/data/tools";
import { recordRecentTool } from "@/lib/storage";
import { ToolIcon } from "./Icons";

export function ToolCard({ tool }: { tool: ToolRecord }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="tool-card"
      data-category={tool.category}
      onClick={() => recordRecentTool(tool.slug)}
      aria-label={`${tool.isImplemented ? "使用" : "查看"}${tool.name}`}
    >
      <div className="tool-card-top">
        <span className={`tool-icon tone-${tool.category}`}>
          <ToolIcon category={tool.category} size={21} strokeWidth={2.2} />
        </span>
        {!tool.isImplemented && <span className="tool-state state-soon"><Clock3 size={13} />待上线</span>}
      </div>

      <div className="tool-card-copy">
        <h3>{tool.name}</h3>
        <p className="tool-description">{tool.description}</p>
      </div>

      <div className="tool-card-footer">
        <span className="tool-use">
          {tool.isImplemented ? "开始" : "查看"}
          <ArrowUpRight size={17} />
        </span>
      </div>
    </Link>
  );
}
