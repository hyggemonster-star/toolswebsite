import { HomeExplorer } from "@/components/HomeExplorer";
import { getPopularTools, tools } from "@/data/tools";

export default function Home() {
  return <main className="site-main container"><HomeExplorer popularTools={getPopularTools()} allTools={tools} /></main>;
}
