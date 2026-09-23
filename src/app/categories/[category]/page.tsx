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
  return category ? { title: category.name, description: `${category.description} 浏览中文效率工具箱的${category.name}工具。` } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryId } = await params;
  const category = getCategoryById(categoryId);
  if (!category) notFound();
  const categoryTools = getToolsByCategory(category.id as ToolCategory);

  return <main className="listing-page container"><ToolBrowser initialCategory={category.id} mode="category" tools={categoryTools} /></main>;
}
