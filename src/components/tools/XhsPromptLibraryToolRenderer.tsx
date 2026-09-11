"use client";

import type { ToolRecord } from "@/data/tools";
import { DirectAiTool } from "./DirectAiTool";
import { xhsPromptConfig } from "./direct-ai-configs";

export function XhsPromptLibraryToolRenderer({ tool }: { tool: ToolRecord }) {
  return <DirectAiTool tool={tool} config={xhsPromptConfig} />;
}
