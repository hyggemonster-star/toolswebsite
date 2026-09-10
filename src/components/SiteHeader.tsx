import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="AI效率工具箱首页">
          <span className="brand-mark"><Sparkles size={18} strokeWidth={2.5} /></span>
          <span>
            <strong>AI效率工具箱</strong>
            <small>tools-hub-100</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="主导航">
          <Link href="/">首页</Link>
          <Link href="/tools">全部工具</Link>
          <Link href="/#categories">工具分类</Link>
        </nav>

        <Link href="/tools" className="header-action">
          开始使用 <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}
