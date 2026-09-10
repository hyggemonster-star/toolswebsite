"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Heart, LockKeyhole, Share2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { getCategoryName } from "@/data/categories";
import { isFavoriteTool, recordRecentTool, toggleFavoriteTool } from "@/lib/storage";
import type { ToolFaq } from "@/lib/seo";
import { ToolIcon } from "./Icons";
import { ToolGrid } from "./ToolGrid";
import { ToolRenderer } from "./ToolRenderer";

export function ToolDetailView({ tool, related, faqs }: { tool: ToolRecord; related: ToolRecord[]; faqs: ToolFaq[] }) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => recordRecentTool(tool.slug), [tool.slug]);

  useEffect(() => {
    const initial = window.setTimeout(() => setFavorited(isFavoriteTool(tool.slug)), 0);
    const refresh = () => setFavorited(isFavoriteTool(tool.slug));
    window.addEventListener("tools-hub-favorites-updated", refresh);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("tools-hub-favorites-updated", refresh);
    };
  }, [tool.slug]);

  function toggleFavorite() {
    setFavorited(toggleFavoriteTool(tool.slug));
  }

  return (
    <main className="detail-page container">
      <Link href="/tools" className="back-link"><ArrowLeft size={16} />返回全部工具</Link>
      <section className="detail-intro">
        <div className={`detail-icon tone-${tool.category}`}><ToolIcon category={tool.category} size={29} strokeWidth={2.1} /></div>
        <div className="detail-copy"><div className="detail-meta"><span>{getCategoryName(tool.category)}</span><span>·</span><span>{tool.subCategory}</span><span className={`status-pill ${tool.isImplemented ? "status-live" : "status-soon"}`}>{tool.isImplemented ? <Check size={13} /> : <Clock3 size={13} />}{tool.isImplemented ? "现在可用" : "即将上线"}</span></div><h1>{tool.name}</h1><p>{tool.description}</p><div className="detail-actions"><button type="button" className="soft-button detail-action-button" aria-pressed={favorited} onClick={toggleFavorite}><Heart size={16} fill={favorited ? "currentColor" : "none"} />{favorited ? "已收藏" : "收藏"}</button><ShareButton tool={tool} /></div></div>
      </section>

      {tool.isImplemented ? <ToolRenderer tool={tool} /> : <ComingSoonCard tool={tool} />}

      <section className="how-section"><div className="section-heading"><div><p className="section-kicker">轻量提示</p><h2>三步完成</h2></div><span className="heading-note">跟着上面的操作区走就好</span></div><div className="steps-grid"><div><span>01</span><strong>输入或选择内容</strong><p>粘贴文本，或选择需要处理的文件。</p></div><div><span>02</span><strong>点击主要按钮</strong><p>保持默认选项也可以，先得到结果再调整。</p></div><div><span>03</span><strong>复制或下载</strong><p>确认结果后保存，重要文件请留存备份。</p></div></div></section>

      {faqs.length > 0 && <section className="faq-section" aria-labelledby="faq-title"><div className="section-heading"><div><p className="section-kicker">常见问题</p><h2 id="faq-title">使用前先看这里</h2></div><span className="heading-note">关于使用、隐私和结果保存</span></div><div className="faq-list">{faqs.map((faq) => <details key={faq.question} className="faq-item"><summary>{faq.question}<ChevronDown size={17} /></summary><p>{faq.answer}</p></details>)}</div></section>}

      {related.length > 0 && <section className="related-section"><div className="section-heading"><div><p className="section-kicker">继续处理</p><h2>相关工具</h2></div><Link href={`/categories/${tool.category}`} className="text-link">同类工具 <ArrowRight size={16} /></Link></div><ToolGrid tools={related} /></section>}
    </main>
  );
}

function ShareButton({ tool }: { tool: ToolRecord }) {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: tool.name, text: tool.description, url });
        return;
      }

      await copyText(url);
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2200);
    }
  }

  return <button type="button" className="soft-button detail-action-button" onClick={() => void share()}><Share2 size={16} />{status === "done" ? "链接已复制" : status === "error" ? "复制失败" : "分享"}</button>;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Copy command failed");
}

function ComingSoonCard({ tool }: { tool: ToolRecord }) {
  const isCreator = tool.category === "creator";
  return <section className="coming-soon-card"><div className="coming-soon-icon"><Clock3 size={26} /></div><div className="coming-soon-copy"><p className="section-kicker">即将上线</p><h2>这个工具还在准备中</h2><p>入口和使用说明已经准备好。你可以先从现在可用的工具开始，后续功能会继续补齐。</p><div className="coming-points"><span><Check size={15} />无需登录</span><span><Check size={15} />优先考虑本地处理</span><span><Check size={15} />上线前说明隐私边界</span></div><Link href="/tools" className="primary-button">查看现在可用 <ArrowRight size={16} /></Link></div>{isCreator ? <div className="compliance-note"><ShieldCheck size={18} /><p>自媒体功能仅用于原创或已获授权的内容，请遵守平台规则和版权要求。</p></div> : <div className="compliance-note"><LockKeyhole size={18} /><p>文件类功能上线时会明确处理范围与自动清理说明。</p></div>}</section>;
}
