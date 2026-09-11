import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Code2, Image, PenLine, Sparkles, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getToolBySlug } from "@/data/tools";
import { toolkits } from "@/data/toolkits";

const iconMap: Record<(typeof toolkits)[number]["icon"], LucideIcon> = {
  briefcase: BriefcaseBusiness,
  pen: PenLine,
  image: Image,
  video: Video,
  code: Code2,
  sparkles: Sparkles,
};

export function SceneToolkitGrid({ compact = false }: { compact?: boolean }) {
  return <div className={`toolkit-grid ${compact ? "toolkit-grid-compact" : ""}`.trim()}>{toolkits.map((toolkit) => {
    const Icon = iconMap[toolkit.icon];
    const toolkitTools = toolkit.toolSlugs.map((slug) => getToolBySlug(slug)).filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

    return <article className={`toolkit-card ${compact ? "toolkit-card-compact" : ""}`.trim()} key={toolkit.id}><div className="toolkit-card-top"><span className="toolkit-icon"><Icon size={19} /></span><span className="toolkit-eyebrow">{toolkit.eyebrow}</span></div><div><h2>{toolkit.title}</h2><p>{toolkit.description}</p></div><div className="toolkit-links">{toolkitTools.map((tool) => <Link href={`/tools/${tool.slug}`} key={tool.slug} className="toolkit-link"><span>{tool.name}</span><ArrowUpRight size={15} /></Link>)}</div></article>;
  })}</div>;
}
