"use client";

import type { ToolRecord } from "@/data/tools";
import { DirectAiTool } from "./DirectAiTool";
import { promptGeneratorConfig } from "./direct-ai-configs";

export function AiToolRenderer({ tool }: { tool: ToolRecord }) {
  return <DirectAiTool tool={tool} config={promptGeneratorConfig} />;
}
