"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import type { ToolRecord } from "@/data/tools";
import { getCategoryName } from "@/data/categories";
import { recordRecentTool } from "@/lib/storage";
import { ToolIcon } from "./Icons";
import { ToolGrid } from "./ToolGrid";
import { ToolRenderer } from "./ToolRenderer";

export function ToolDetailView({ tool, related }: { tool: ToolRecord; related: ToolRecord[] }) {
  useEffect(() => recordRecentTool(tool.slug), [tool.slug]);

  return (
    <main className="detail-page container">
      <Link href="/tools" className="back-link"><ArrowLeft size={16} />返回全部工具</Link>
      <section className="detail-intro">
        <div className={`detail-icon tone-${tool.category}`}><ToolIcon category={tool.category} size={29} strokeWidth={2.1} /></div>
        <div className="detail-copy"><div className="detail-meta"><span>{getCategoryName(tool.category)}</span><span>·</span><span>{tool.subCategory}</span><span className={`status-pill ${tool.isImplemented ? "status-live" : "status-soon"}`}>{tool.isImplemented ? <Check size={13} /> : <Clock3 size={13} />}{tool.isImplemented ? "已上线" : "即将上线"}</span></div><h1>{tool.name}</h1><p>{tool.description}</p><div className="detail-tags">{tool.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div>
      </section>

      {tool.isImplemented ? <ToolRenderer tool={tool} /> : <ComingSoonCard tool={tool} />}

      <section className="how-section"><div className="section-heading"><div><p className="section-kicker">使用说明</p><h2>三步完成</h2></div><span className="heading-note">简单、清楚、少打扰</span></div><div className="steps-grid"><div><span>01</span><strong>输入或选择内容</strong><p>按照页面提示粘贴文本，或选择需要处理的文件。</p></div><div><span>02</span><strong>调整选项并处理</strong><p>选择合适的参数，点击主要按钮开始处理。</p></div><div><span>03</span><strong>检查并保存结果</strong><p>确认结果符合预期后复制或下载，重要文件请留存备份。</p></div></div></section>

      {related.length > 0 && <section className="related-section"><div className="section-heading"><div><p className="section-kicker">继续处理</p><h2>相关工具</h2></div><Link href={`/categories/${tool.category}`} className="text-link">同类工具 <ArrowRight size={16} /></Link></div><ToolGrid tools={related} /></section>}
    </main>
  );
}

function ComingSoonCard({ tool }: { tool: ToolRecord }) {
  const isCreator = tool.category === "creator";
  return <section className="coming-soon-card"><div className="coming-soon-icon"><Clock3 size={29} /></div><div className="coming-soon-copy"><p className="section-kicker">正在排队</p><h2>这个工具还在准备中</h2><p>页面和工具信息已经准备好，功能上线后会优先保留本页入口。你可以先试试相关工具，或浏览其他已上线的本地工具。</p><div className="coming-points"><span><Check size={15} />无需登录的使用体验</span><span><Check size={15} />优先考虑浏览器本地处理</span><span><Check size={15} />上线前会说明文件处理方式</span></div><Link href="/tools" className="primary-button">去看已上线工具 <ArrowRight size={16} /></Link></div>{isCreator ? <div className="compliance-note"><ShieldCheck size={18} /><p>自媒体相关功能仅用于原创或已获授权的内容，请遵守平台规则和版权要求。</p></div> : <div className="compliance-note"><LockKeyhole size={18} /><p>文件类工具上线时会明确隐私保护、处理范围和自动清理说明。</p></div>}</section>;
}
