import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolDetailView } from "@/components/ToolDetailView";
import { getToolBySlug, tools } from "@/data/tools";
import { getToolFaqs, getToolStructuredData, safeJsonLd, toolUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const canonical = toolUrl(tool.slug);
  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    keywords: tool.tags,
    alternates: { canonical },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: canonical,
      type: "website",
      locale: "zh_CN",
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary",
      title: tool.seoTitle,
      description: tool.seoDescription,
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();
  const related = tool.relatedTools.map((relatedSlug) => getToolBySlug(relatedSlug)).filter((item): item is NonNullable<typeof item> => Boolean(item)).slice(0, 3);
  const faqs = getToolFaqs(tool);
  const structuredData = getToolStructuredData(tool, related, faqs);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
    <ToolDetailView tool={tool} related={related} faqs={faqs} />
  </>;
}
