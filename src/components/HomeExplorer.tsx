"use client";

import Link from "next/link";
import { ArrowRight, Check, Search, ShieldCheck, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ToolRecord } from "@/data/tools";
import { CategoryGrid } from "./CategoryGrid";
import { ToolGrid } from "./ToolGrid";

export function HomeExplorer({ popularTools, allTools }: { popularTools: ToolRecord[]; allTools: ToolRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const liveCount = allTools.filter((tool) => tool.isImplemented).length;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/tools?q=${encodeURIComponent(value)}` : "/tools");
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> 中文效率工具 · {liveCount} 个现在可用</p>
          <h1>中文效率工具，<br /><span>打开就能用。</span></h1>
          <p className="hero-description">处理办公文件、图片、视频音频、内容创作、AI 和开发数据。免费、无需登录，能在浏览器本地完成的内容不上传。</p>
          <form className="hero-search" onSubmit={submitSearch}>
            <Search size={22} aria-hidden="true" />
            <label htmlFor="home-tool-search" className="sr-only">搜索工具</label>
            <input id="home-tool-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="试试搜索：JSON、图片压缩、二维码…" />
            <button type="submit">开始搜索 <ArrowRight size={17} /></button>
          </form>
          <div className="search-suggestions" aria-label="搜索示例">
            <span>可以试试</span>
            {["JSON 格式化", "图片压缩", "二维码生成器", "密码生成器"].map((item) => (
              <button type="button" key={item} onClick={() => setQuery(item)}>{item}</button>
            ))}
          </div>
          <div className="hero-trust"><span><Check size={15} /> 免费使用</span><span><ShieldCheck size={15} /> 无需登录</span><span><Zap size={15} /> 本地优先</span></div>
        </div>
      </section>

      <section className="home-section" id="categories">
        <div className="section-heading"><div><p className="section-kicker">按功能找</p><h2>这里能处理什么</h2></div><span className="heading-note">7 个清晰分类</span></div>
        <CategoryGrid />
      </section>

      <section className="home-section popular-section">
        <div className="section-heading"><div><p className="section-kicker">高频工具</p><h2>常用工具</h2></div><Link href="/tools" className="text-link">查看全部 <ArrowRight size={16} /></Link></div>
        <ToolGrid tools={popularTools.slice(0, 8)} className="popular-grid" />
      </section>

      <footer className="site-footer"><div><strong>AI效率工具箱</strong><span>为中文用户准备的轻量在线工具集合。</span></div><nav aria-label="页脚导航"><Link href="/tools">工具库</Link><Link href="/#categories">工具分类</Link><span>免费 · 无需登录 · 本地优先</span></nav></footer>
    </>
  );
}
