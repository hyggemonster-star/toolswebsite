import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/categories";
import { getToolsByCategory } from "@/data/tools";
import { CategoryIcon } from "./Icons";

export function CategoryGrid() {
  return (
    <div className="category-grid">
      {categories.map((category) => {
        const categoryTools = getToolsByCategory(category.id);
        const availableCount = categoryTools.filter((tool) => tool.isImplemented).length;
        const comingSoonCount = categoryTools.length - availableCount;
        return (
          <Link href={`/categories/${category.id}`} className="category-card" data-tone={category.color} key={category.id}>
            <span className="category-icon"><CategoryIcon icon={category.icon} size={23} strokeWidth={2.1} /></span>
            <span className="category-card-copy">
              <strong>{category.name}</strong>
              <span>{category.description}</span>
              <small>{availableCount} 个可用{comingSoonCount > 0 ? ` · ${comingSoonCount} 个暂未开放` : ""}</small>
            </span>
            <ArrowUpRight size={18} className="category-arrow" />
          </Link>
        );
      })}
    </div>
  );
}
