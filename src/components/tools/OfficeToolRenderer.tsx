"use client";

import type { ToolRecord } from "@/data/tools";
import { DirectAiTool } from "./DirectAiTool";
import { officeAiConfigs } from "./direct-ai-configs";

export function OfficeToolRenderer({ tool }: { tool: ToolRecord }) {
  const config = officeAiConfigs[tool.slug];
  return config ? <DirectAiTool tool={tool} config={config} /> : null;
}
