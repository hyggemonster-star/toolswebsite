import type { Metadata } from "next";
import { AnalyticsAdmin } from "@/components/AnalyticsAdmin";

export const metadata: Metadata = {
  title: "数据分析后台",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AnalyticsAdmin />;
}
