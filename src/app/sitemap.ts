import type { MetadataRoute } from "next";
import { categories } from "@/data/categories";
import { siteConfig } from "@/lib/site";
import { tools } from "@/data/tools";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const trustRoutes = ["/privacy", "/terms", "/disclaimer", "/contact", "/file-processing", "/generation-notice"];
  return [
    { url: siteConfig.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...trustRoutes.map((path) => ({ url: `${siteConfig.url}${path}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })),
    ...categories.map((category) => ({ url: `${siteConfig.url}/categories/${category.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...tools.map((tool) => ({ url: `${siteConfig.url}/tools/${tool.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: tool.isImplemented ? 0.7 : 0.4 })),
  ];
}
