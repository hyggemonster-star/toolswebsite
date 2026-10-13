import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer container">
      <div className="site-footer-brand">
        <strong>中文效率工具箱</strong>
        <span>为中文用户准备的轻量在线工具集合。</span>
      </div>
      <nav aria-label="页脚导航">
        <Link href="/tools">工具库</Link>
        <Link href="/#categories">工具分类</Link>
        <Link href="/privacy">隐私政策</Link>
        <Link href="/terms">使用条款</Link>
        <Link href="/file-processing">文件处理说明</Link>
        <Link href="/disclaimer">免责声明</Link>
        <Link href="/contact">联系与关于</Link>
      </nav>
      <div className="site-footer-bottom">
        <span>免费 · 无需登录 · 本地处理</span>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">鄂ICP备2026057021号</a>
      </div>
    </footer>
  );
}
