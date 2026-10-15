import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";
import { siteConfig } from "@/lib/site";
import "./globals.css";
import "./analytics.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["在线工具", "效率工具", "图片压缩", "JSON 格式化", "二维码生成器", "中文工具"],
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><AnalyticsTracker /><SiteHeader />{children}<SiteFooter /><AnalyticsConsent /></body></html>;
}
