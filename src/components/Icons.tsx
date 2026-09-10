import {
  Clapperboard,
  Code2,
  FileText,
  ImageIcon,
  PenLine,
  Sparkles,
  SunMedium,
  Wrench,
  type LucideProps,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { CategoryRecord } from "@/data/categories";
import type { ToolCategory } from "@/data/tools";

type IconComponent = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

const categoryIcons: Record<CategoryRecord["icon"], IconComponent> = {
  file: FileText,
  image: ImageIcon,
  video: Clapperboard,
  pen: PenLine,
  sparkles: Sparkles,
  code: Code2,
  sun: SunMedium,
};

const toolIcons: Record<ToolCategory, IconComponent> = {
  "pdf-office": FileText,
  image: ImageIcon,
  "video-audio": Clapperboard,
  creator: PenLine,
  ai: Sparkles,
  developer: Code2,
  daily: SunMedium,
};

export function CategoryIcon({ icon, ...props }: { icon: CategoryRecord["icon"] } & LucideProps) {
  const Icon = categoryIcons[icon];
  return <Icon aria-hidden="true" {...props} />;
}

export function ToolIcon({ category, ...props }: { category: ToolCategory } & LucideProps) {
  const Icon = toolIcons[category];
  return <Icon aria-hidden="true" {...props} />;
}

export { Wrench };
