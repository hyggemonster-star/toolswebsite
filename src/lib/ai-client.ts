export type AiTaskType = "xhs_title" | "douyin_script" | "text_expression";

export type AiRequestInput = Record<string, string>;

type AiSuccess = {
  ok: true;
  content: string;
  taskType: AiTaskType;
};

type AiFailure = {
  ok: false;
  error?: string;
};

function getEndpoint() {
  const configured = process.env.NEXT_PUBLIC_AI_API_URL || "/api/ai";
  return configured.replace(/\/+$/, "");
}

export async function requestAi(taskType: AiTaskType, input: AiRequestInput, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(`${getEndpoint()}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskType, input }),
      signal
    });
  } catch {
    throw new Error("AI 服务暂时无法连接，请检查网络或稍后重试；本地模式仍可继续使用");
  }

  const payload = await response.json().catch(() => null) as AiSuccess | AiFailure | null;
  if (!response.ok || !payload || payload.ok !== true || !payload.content) {
    throw new Error(payload && "error" in payload && payload.error ? payload.error : "AI 服务暂时不可用，请稍后重试；本地模式仍可继续使用");
  }
  return payload.content;
}
