import { HomeExplorer } from "@/components/HomeExplorer";
import { getPopularTools } from "@/data/tools";
import { getPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = getPageMetadata("/", siteConfig.name, siteConfig.description);

export default function Home() {
  return <main className="site-main container"><HomeExplorer popularTools={getPopularTools()} /></main>;
}
