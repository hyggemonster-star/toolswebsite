"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { categories } from "@/data/categories";
import type { ToolCategory, ToolRecord } from "@/data/tools";
import { ToolGrid } from "./ToolGrid";

type CategoryFilter = ToolCategory | "all";

export function ToolBrowser({
  initialCategory = "all",
  initialQuery = "",
  tools,
}: {
  initialCategory?: CategoryFilter;
  initialQuery?: string;
  tools: ToolRecord[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);

  const visibleTools = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return tools.filter((tool) => {
      const matchesCategory = category === "all" || tool.category === category;
      const searchable = [tool.name, tool.description, tool.subCategory, ...tool.tags].join(" ").toLocaleLowerCase();
      return matchesCategory && (!keyword || searchable.includes(keyword));
    });
  }, [category, query, tools]);

  return (
    <div className="browser-shell">
      <div className="browser-toolbar">
        <label className="search-field compact-search">
          <Search size={19} />
          <span className="sr-only">搜索工具</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索工具、场景或标签" />
          {query && <button type="button" aria-label="清空搜索" onClick={() => setQuery("")}><X size={16} /></button>}
        </label>
        <div className="result-count"><SlidersHorizontal size={15} /> 找到 <strong>{visibleTools.length}</strong> 个工具</div>
      </div>

      <div className="filter-row" aria-label="工具分类筛选">
        <button type="button" className={`filter-chip ${category === "all" ? "active" : ""}`} onClick={() => setCategory("all")}>全部工具</button>
        {categories.map((item) => (
          <button type="button" key={item.id} className={`filter-chip ${category === item.id ? "active" : ""}`} onClick={() => setCategory(item.id)}>
            {item.shortName}
          </button>
        ))}
      </div>

      <ToolGrid tools={visibleTools} />
    </div>
  );
}
