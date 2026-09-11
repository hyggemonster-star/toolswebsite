"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { categories, getCategoryById } from "@/data/categories";
import type { ToolCategory, ToolRecord } from "@/data/tools";
import { CategoryIcon } from "./Icons";
import { SceneToolkitGrid } from "./SceneToolkitGrid";
import { ToolGrid } from "./ToolGrid";

type CategoryFilter = ToolCategory | "all";
type BrowserMode = "library" | "category";

export function ToolBrowser({
  initialCategory = "all",
  initialQuery = "",
  mode = "library",
  showToolkits = false,
  tools,
}: {
  initialCategory?: CategoryFilter;
  initialQuery?: string;
  mode?: BrowserMode;
  showToolkits?: boolean;
  tools: ToolRecord[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get("q") ?? "";
    const urlCategory = params.get("category");
    const validCategory = categories.some((item) => item.id === urlCategory) ? urlCategory as ToolCategory : initialCategory;
    const timer = window.setTimeout(() => {
      setQuery(urlQuery || initialQuery);
      setCategory(mode === "library" ? validCategory : initialCategory);
      setShowAll(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialCategory, initialQuery, mode]);

  const filteredTools = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return tools.filter((tool) => {
      const matchesCategory = category === "all" || tool.category === category;
      const searchable = [tool.name, tool.description, tool.subCategory, ...tool.tags].join(" ").toLocaleLowerCase();
      return matchesCategory && (!keyword || searchable.includes(keyword));
    });
  }, [category, query, tools]);

  const displayTools = !query.trim() && !showAll ? filteredTools.slice(0, 12) : filteredTools;
  const activeCategory = category === "all" ? undefined : getCategoryById(category);
  const categoryTitle = activeCategory?.name ?? "全部工具";
  const categoryDescription = activeCategory?.description ?? "按左侧分类筛选，或直接搜索工具名称、用途和标签。";

  function updateCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);
    setShowAll(false);

    if (mode !== "library") return;

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (nextCategory !== "all") params.set("category", nextCategory);
    const suffix = params.toString();
    router.replace(`/tools${suffix ? `?${suffix}` : ""}`, { scroll: false });
  }

  return (
    <div className="browser-shell">
      <div className="tool-library-layout">
        <aside className="tool-category-sidebar" aria-label="工具分类导航">
          <div className="tool-category-sidebar-heading">
            <p className="section-kicker">分类导航</p>
            <h2>按功能找</h2>
          </div>
          <nav className="tool-category-nav">
            {mode === "library" ? (
              <button type="button" className={`tool-category-nav-item ${category === "all" ? "active" : ""}`} aria-pressed={category === "all"} onClick={() => updateCategory("all")}>
                <SlidersHorizontal size={16} />
                <span>全部工具</span>
              </button>
            ) : (
              <Link href="/tools" className="tool-category-nav-item">
                <SlidersHorizontal size={16} />
                <span>全部工具</span>
              </Link>
            )}
            {categories.map((item) => mode === "library" ? (
              <button type="button" key={item.id} className={`tool-category-nav-item ${category === item.id ? "active" : ""}`} aria-pressed={category === item.id} onClick={() => updateCategory(item.id)}>
                <CategoryIcon icon={item.icon} size={16} />
                <span>{item.shortName}</span>
              </button>
            ) : (
              <Link href={`/categories/${item.id}`} key={item.id} className={`tool-category-nav-item ${category === item.id ? "active" : ""}`} aria-current={category === item.id ? "page" : undefined}>
                <CategoryIcon icon={item.icon} size={16} />
                <span>{item.shortName}</span>
              </Link>
            ))}
          </nav>
          {showToolkits && <a href="#scene-toolkits" className="tool-category-toolkit-link">场景工具包 <span>↓</span></a>}
        </aside>

        <section className="tool-browser-content" aria-labelledby="browser-category-title">
          <div className="browser-content-heading">
            <div>
              <p className="section-kicker">当前分类</p>
              <h2 id="browser-category-title">{categoryTitle}</h2>
              <p>{categoryDescription}</p>
            </div>
            <span className="browser-category-count">{filteredTools.length} 个工具</span>
          </div>

          <div className="browser-toolbar">
            <label className="search-field compact-search">
              <Search size={19} />
              <span className="sr-only">搜索工具</span>
              <input value={query} onChange={(event) => { setQuery(event.target.value); setShowAll(false); }} placeholder="搜索工具名称、场景或标签" />
              {query && <button type="button" aria-label="清空搜索" onClick={() => { setQuery(""); setShowAll(false); }}><X size={16} /></button>}
            </label>
            <div className="result-count" aria-live="polite"><SlidersHorizontal size={15} /> 匹配 <strong>{filteredTools.length}</strong> 个工具</div>
          </div>

          <ToolGrid tools={displayTools} />
          {!query.trim() && filteredTools.length > 12 && <div className="tool-browser-more"><button type="button" className="soft-button" onClick={() => setShowAll((current) => !current)}>{showAll ? "收起精选工具" : `查看全部 ${filteredTools.length} 个工具`}</button></div>}

          {showToolkits && category === "all" && <section id="scene-toolkits" className="tool-browser-toolkits" aria-labelledby="scene-toolkit-title">
            <div className="section-heading"><div><p className="section-kicker">场景工具包</p><h2 id="scene-toolkit-title">按任务组合工具</h2></div><span className="heading-note">办公、发布、开发和求职</span></div>
            <SceneToolkitGrid compact />
          </section>}
        </section>
      </div>
    </div>
  );
}
