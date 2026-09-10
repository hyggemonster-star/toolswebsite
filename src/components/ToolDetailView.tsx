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
        <div className="detail-copy"><div className="detail-meta"><span>{getCategoryName(tool.category)}</span><span>·</span><span>{tool.subCategory}</span><span className={`status-pill ${tool.isImplemented ? "status-live" : "status-soon"}`}>{tool.isImplemented ? <Check size={13} /> : <Clock3 size={13} />}{tool.isImplemented ? "现在可用" : "即将上线"}</span></div><h1>{tool.name}</h1><p>{tool.description}</p></div>
      </section>

      {tool.isImplemented ? <ToolRenderer tool={tool} /> : <ComingSoonCard tool={tool} />}

      <section className="how-section"><div className="section-heading"><div><p className="section-kicker">轻量提示</p><h2>三步完成</h2></div><span className="heading-note">跟着上面的操作区走就好</span></div><div className="steps-grid"><div><span>01</span><strong>输入或选择内容</strong><p>粘贴文本，或选择需要处理的文件。</p></div><div><span>02</span><strong>点击主要按钮</strong><p>保持默认选项也可以，先得到结果再调整。</p></div><div><span>03</span><strong>复制或下载</strong><p>确认结果后保存，重要文件请留存备份。</p></div></div></section>

      {related.length > 0 && <section className="related-section"><div className="section-heading"><div><p className="section-kicker">继续处理</p><h2>相关工具</h2></div><Link href={`/categories/${tool.category}`} className="text-link">同类工具 <ArrowRight size={16} /></Link></div><ToolGrid tools={related} /></section>}
    </main>
  );
}

function ComingSoonCard({ tool }: { tool: ToolRecord }) {
  const isCreator = tool.category === "creator";
  return <section className="coming-soon-card"><div className="coming-soon-icon"><Clock3 size={26} /></div><div className="coming-soon-copy"><p className="section-kicker">即将上线</p><h2>这个工具还在准备中</h2><p>入口和使用说明已经准备好。你可以先从现在可用的工具开始，后续功能会继续补齐。</p><div className="coming-points"><span><Check size={15} />无需登录</span><span><Check size={15} />优先考虑本地处理</span><span><Check size={15} />上线前说明隐私边界</span></div><Link href="/tools" className="primary-button">查看现在可用 <ArrowRight size={16} /></Link></div>{isCreator ? <div className="compliance-note"><ShieldCheck size={18} /><p>自媒体功能仅用于原创或已获授权的内容，请遵守平台规则和版权要求。</p></div> : <div className="compliance-note"><LockKeyhole size={18} /><p>文件类功能上线时会明确处理范围与自动清理说明。</p></div>}</section>;
}
