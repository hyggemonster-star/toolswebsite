"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ToolRecord } from "@/data/tools";
import { CategoryGrid } from "./CategoryGrid";
import { ToolGrid } from "./ToolGrid";

export function HomeExplorer({ popularTools }: { popularTools: ToolRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/tools?q=${encodeURIComponent(value)}` : "/tools");
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <h1>中文效率工具，<span>按需选择。</span></h1>
          <p className="hero-description">搜索图片、文档、文本或开发任务，打开工具后可查看支持范围和处理方式。</p>
          <form className="hero-search" onSubmit={submitSearch}>
            <Search size={22} aria-hidden="true" />
            <label htmlFor="home-tool-search" className="sr-only">搜索工具</label>
            <input id="home-tool-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="试试搜索：JSON、图片压缩、二维码…" />
            <button type="submit">开始搜索 <ArrowRight size={17} /></button>
          </form>
        </div>
      </section>

      <section className="home-section" id="categories">
        <div className="section-heading"><h2>工具分类</h2></div>
        <CategoryGrid />
      </section>

      <section className="home-section popular-section">
        <div className="section-heading"><h2>常用工具</h2><Link href="/tools" className="text-link">查看全部 <ArrowRight size={16} /></Link></div>
        <ToolGrid tools={popularTools.slice(0, 8)} className="popular-grid" />
      </section>

    </>
  );
}
