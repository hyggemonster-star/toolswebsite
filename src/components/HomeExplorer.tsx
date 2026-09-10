"use client";

import Link from "next/link";
import { ArrowRight, Check, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ToolRecord } from "@/data/tools";
import { getRecentSlugs } from "@/lib/storage";
import { CategoryGrid } from "./CategoryGrid";
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
    router.push("/tools");
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> 100 个实用工具，随手就能用</p>
          <h1>把琐碎任务，<br /><span>变成一键完成。</span></h1>
          <p className="hero-description">文件、图片、文字和开发小事，集中在一个清爽的工具箱里。免费、无需登录，能在本地完成的就不离开你的浏览器。</p>
          <form className="hero-search" onSubmit={submitSearch}>
            <Search size={22} aria-hidden="true" />
            <label htmlFor="home-tool-search" className="sr-only">搜索工具</label>
            <input id="home-tool-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="试试搜索：JSON、图片压缩、二维码…" />
            <button type="submit">搜索工具 <ArrowRight size={17} /></button>
          </form>
          <div className="search-suggestions">
            <span>大家常用：</span>
            {["JSON 格式化", "图片压缩", "二维码生成器", "密码生成器"].map((item) => (
              <button type="button" key={item} onClick={() => setQuery(item)}>{item}</button>
            ))}
          </div>
        </div>
        <div className="hero-note-card">
          <div className="hero-note-header"><span className="mini-window-dots"><i /><i /><i /></span><span>today’s toolkit</span><Sparkles size={15} /></div>
          <div className="hero-note-main">
            <span className="hero-note-icon"><Zap size={23} /></span>
            <div><strong>轻装上阵</strong><span>不登录，也能马上开始</span></div>
          </div>
          <div className="hero-note-list">
            <span><Check size={15} /> 15 个工具已上线</span>
            <span><ShieldCheck size={15} /> 本地处理优先</span>
            <span><Sparkles size={15} /> 还有 85 个在路上</span>
          </div>
          <div className="hero-note-footer"><span>工具箱状态</span><strong><i /> 持续更新中</strong></div>
        </div>
      </section>

      <section className="stats-strip" aria-label="工具箱概览">
        <div><strong>100</strong><span>实用工具</span></div>
        <div><strong>15</strong><span>现在可用</span></div>
        <div><strong>7</strong><span>主题分类</span></div>
        <div><strong>0</strong><span>登录门槛</span></div>
      </section>

      <section className="home-section" id="categories">
        <div className="section-heading"><div><p className="section-kicker">按场景找</p><h2>今天想处理什么？</h2></div><Link href="/tools" className="text-link">浏览全部 <ArrowRight size={16} /></Link></div>
        <CategoryGrid />
      </section>

      <section className="home-section soft-section">
        <div className="section-heading"><div><p className="section-kicker">大家在用</p><h2>热门工具</h2></div><span className="heading-note">从最常见的小事开始</span></div>
        <ToolGrid tools={popularTools} />
      </section>

      <section className="home-section recent-section">
        <div className="section-heading"><div><p className="section-kicker">留在这台设备</p><h2>最近使用</h2></div><span className="heading-note">不登录也能记住最近打开的工具</span></div>
        {recentTools.length ? <ToolGrid tools={recentTools} /> : <div className="recent-empty"><span>🧺</span><div><strong>这里会出现你最近打开的工具</strong><p>先试试一个工具，回来就能从这里继续。</p></div><Link href="/tools">去逛逛 <ArrowRight size={16} /></Link></div>}
      </section>

      <section className="trust-band">
        <div><span className="trust-icon"><ShieldCheck size={20} /></span><div><strong>隐私保护提示</strong><p>本地工具不会把你的内容上传到服务器；上传类工具上线时会单独说明处理方式与自动清理规则。</p></div></div>
        <div><span className="trust-icon mint"><Sparkles size={20} /></span><div><strong>小步持续更新</strong><p>先把真正高频、轻量的功能做好，再逐步补齐其他工具。</p></div></div>
      </section>

      <footer className="site-footer"><div><strong>AI效率工具箱</strong><span>为中文用户准备的轻量在线工具集合。</span></div><span>tools-hub-100 · 2026</span></footer>
    </>
  );
}
