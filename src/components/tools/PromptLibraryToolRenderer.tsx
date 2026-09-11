"use client";

import type { ToolRecord } from "@/data/tools";
import { DirectAiTool } from "./DirectAiTool";
import { ecommerceConfig } from "./direct-ai-configs";

export function PromptLibraryToolRenderer({ tool }: { tool: ToolRecord }) {
  return <DirectAiTool tool={tool} config={ecommerceConfig} />;
}
