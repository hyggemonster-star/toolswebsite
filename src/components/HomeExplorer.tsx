"use client";

import Link from "next/link";
import { ArrowRight, Check, Search, ShieldCheck, Sparkles, Wrench, Zap } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ToolRecord } from "@/data/tools";
import { getRecentSlugs } from "@/lib/storage";
import { CategoryGrid } from "./CategoryGrid";
import { ToolIcon } from "./Icons";
import { ToolGrid } from "./ToolGrid";

export function HomeExplorer({ popularTools, allTools }: { popularTools: ToolRecord[]; allTools: ToolRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setRecentSlugs(getRecentSlugs());
    refresh();
    window.addEventListener("tools-hub-recent-updated", refresh);
    return () => window.removeEventListener("tools-hub-recent-updated", refresh);
  }, []);

  const recentTools = useMemo(
    () => recentSlugs.map((slug) => allTools.find((tool) => tool.slug === slug)).filter((tool): tool is ToolRecord => Boolean(tool)),
    [allTools, recentSlugs],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/tools?q=${encodeURIComponent(value)}` : "/tools");
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> 轻量、实用、马上开始</p>
          <h1>需要处理什么？<br /><span>现在就开始。</span></h1>
          <p className="hero-description">100 个中文实用工具，覆盖文件、图片、文字和开发小事。免费、无需登录，能在本地完成的就不离开你的浏览器。</p>
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
        <aside className="quick-start-panel" aria-label="快速开始">
          <div className="quick-start-heading">
            <div><p className="section-kicker">快速开始</p><h2>从常用小事开始</h2></div>
            <span>15 个可用</span>
          </div>
          <div className="quick-start-list">
            {popularTools.slice(0, 3).map((tool) => (
              <Link href={`/tools/${tool.slug}`} className="quick-tool" key={tool.slug}>
                <span className="quick-tool-icon"><ToolIcon category={tool.category} size={18} strokeWidth={2.1} /></span>
                <span><strong>{tool.name}</strong><small>{tool.description}</small></span>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
          <Link href="/tools" className="quick-start-footer">浏览全部工具 <ArrowRight size={16} /></Link>
        </aside>
      </section>

      <section className="home-section popular-section">
        <div className="section-heading"><div><p className="section-kicker">现在就能用</p><h2>先从一件小事开始</h2></div><Link href="/tools" className="text-link">看全部工具 <ArrowRight size={16} /></Link></div>
        <ToolGrid tools={popularTools} className="popular-grid" />
      </section>

      <section className="home-section" id="categories">
        <div className="section-heading"><div><p className="section-kicker">按场景找</p><h2>把工具放到合适的位置</h2></div><span className="heading-note">7 个清晰分类，少一点寻找</span></div>
        <CategoryGrid />
      </section>

      <section className="why-section">
        <div className="why-intro"><span className="why-mark"><Wrench size={18} /></span><p className="section-kicker">为什么留下来</p><h2>工具少一点打扰，效率多一点。</h2><p>我们把高频的小任务收在一个安静、清楚的工作台里。</p></div>
        <div className="why-list">
          <div><span><Zap size={18} /></span><div><strong>打开就能用</strong><p>不登录、不绕路，搜索到工具就开始。</p></div></div>
          <div><span><ShieldCheck size={18} /></span><div><strong>本地优先</strong><p>能在浏览器完成的内容，不离开你的设备。</p></div></div>
          <div><span><Sparkles size={18} /></span><div><strong>持续变好</strong><p>先做好真正高频的功能，再慢慢补齐。</p></div></div>
        </div>
      </section>

      {recentTools.length > 0 && <section className="home-section recent-section">
        <div className="section-heading"><div><p className="section-kicker">留在这台设备</p><h2>最近使用</h2></div><span className="heading-note">不登录也能记住最近打开的工具</span></div>
        <ToolGrid tools={recentTools} className="recent-grid" />
      </section>}

      <footer className="site-footer"><div><strong>AI效率工具箱</strong><span>为中文用户准备的轻量在线工具集合。</span></div><nav aria-label="页脚导航"><Link href="/tools">工具库</Link><Link href="/#categories">工具分类</Link><span>免费 · 无需登录 · 本地优先</span></nav></footer>
    </>
  );
}
