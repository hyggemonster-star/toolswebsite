import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolBrowser } from "@/components/ToolBrowser";
import { categories, getCategoryById } from "@/data/categories";
import { getToolsByCategory, type ToolCategory } from "@/data/tools";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: categoryId } = await params;
  const category = getCategoryById(categoryId);
  return category ? { title: category.name, description: `${category.description} 浏览 AI效率工具箱的${category.name}工具。` } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryId } = await params;
  const category = getCategoryById(categoryId);
  if (!category) notFound();
  const categoryTools = getToolsByCategory(category.id as ToolCategory);

  return <main className="listing-page container"><div className="page-heading category-heading"><p className="eyebrow"><span className="eyebrow-dot" /> 工具分类</p><h1>{category.name}</h1><p>{category.description} 共 {categoryTools.length} 个工具。</p></div><ToolBrowser initialCategory={category.id} tools={categoryTools} /></main>;
}
