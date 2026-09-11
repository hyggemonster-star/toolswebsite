export type AiTaskType =
  | "xhs_title"
  | "xhs_title_analysis"
  | "xhs_tags"
  | "xhs_note_rewrite"
  | "douyin_title"
  | "douyin_script"
  | "short_video_storyboard"
  | "wechat_title"
  | "moments_copy"
  | "comment_reply"
  | "text_expression"
  | "long_summary"
  | "weekly_report"
  | "resume"
  | "interview_questions"
  | "ppt_outline"
  | "prompt_generate"
  | "ecommerce_copy";

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
    throw new Error("AI 服务暂时无法连接，请检查网络或稍后重试");
  }

  const payload = await response.json().catch(() => null) as AiSuccess | AiFailure | null;
  if (!response.ok || !payload || payload.ok !== true || !payload.content) {
    throw new Error(payload && "error" in payload && payload.error ? payload.error : "AI 服务暂时不可用，请稍后重试");
  }
  return payload.content;
}
