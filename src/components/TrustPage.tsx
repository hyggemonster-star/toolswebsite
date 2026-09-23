import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export type TrustSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function TrustPage({ title, description, sections }: { title: string; description: string; sections: TrustSection[] }) {
  return <main className="info-page container">
    <Link href="/tools" className="back-link"><ArrowLeft size={16} />返回工具库</Link>
    <header className="info-header">
      <span className="info-kicker"><ShieldCheck size={15} />上线说明</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
    <div className="info-layout">
      <article className="info-card">
        {sections.map((section) => <section className="info-section" key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
        </section>)}
      </article>
      <aside className="info-aside">
        <strong>相关说明</strong>
        <Link href="/privacy">隐私政策</Link>
        <Link href="/terms">使用条款</Link>
        <Link href="/file-processing">文件处理说明</Link>
        <Link href="/generation-notice">智能生成说明</Link>
        <Link href="/disclaimer">免责声明</Link>
        <Link href="/contact">联系与关于</Link>
      </aside>
    </div>
  </main>;
}
