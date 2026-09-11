"use client";

import type { ToolRecord } from "@/data/tools";
import { DirectAiTool } from "./DirectAiTool";
import { shortVideoPromptConfig } from "./direct-ai-configs";

export function ShortVideoPromptLibraryToolRenderer({ tool }: { tool: ToolRecord }) {
  return <DirectAiTool tool={tool} config={shortVideoPromptConfig} />;
}
