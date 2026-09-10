import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="AI效率工具箱首页">
          <span className="brand-mark"><Wrench size={18} strokeWidth={2.4} /></span>
          <span>
            <strong>AI效率工具箱</strong>
            <small>TOOLS / 100</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="主导航">
          <Link href="/tools">工具库</Link>
          <Link href="/#categories">分类</Link>
        </nav>

        <Link href="/tools" className="header-action">
          开始使用 <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}
