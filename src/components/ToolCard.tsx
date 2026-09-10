"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Clock3 } from "lucide-react";
import type { ToolRecord } from "@/data/tools";
import { getCategoryName } from "@/data/categories";
import { recordRecentTool } from "@/lib/storage";
import { ToolIcon } from "./Icons";

export function ToolCard({ tool }: { tool: ToolRecord }) {
  return (
    <article className="tool-card" data-category={tool.category}>
      <div className="tool-card-top">
        <span className={`tool-icon tone-${tool.category}`}>
          <ToolIcon category={tool.category} size={21} strokeWidth={2.2} />
        </span>
        <span className={`status-pill ${tool.isImplemented ? "status-live" : "status-soon"}`}>
          {tool.isImplemented ? <Check size={13} /> : <Clock3 size={13} />}
          {tool.isImplemented ? "已上线" : "即将上线"}
        </span>
      </div>

      <div className="tool-card-copy">
        <p className="tool-category">{getCategoryName(tool.category)} · {tool.subCategory}</p>
        <h3>{tool.name}</h3>
        <p className="tool-description">{tool.description}</p>
      </div>

      <div className="tool-tags" aria-label="工具标签">
        {tool.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
      </div>

      <Link
        href={`/tools/${tool.slug}`}
        className="tool-use"
        onClick={() => recordRecentTool(tool.slug)}
        aria-label={`使用${tool.name}`}
      >
        {tool.isImplemented ? "使用工具" : "查看详情"}
        <ArrowUpRight size={17} />
      </Link>
    </article>
  );
}
