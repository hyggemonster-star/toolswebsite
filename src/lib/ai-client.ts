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

const AI_REQUEST_TIMEOUT_MS = 45_000;

function getEndpoint() {
  const configured = process.env.NEXT_PUBLIC_AI_API_URL || "/api/ai";
  return configured.replace(/\/+$/, "");
}

export async function requestAi(taskType: AiTaskType, input: AiRequestInput, signal?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, AI_REQUEST_TIMEOUT_MS);
  const abortRequest = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abortRequest, { once: true });

  let response: Response;
  let rawPayload = "";
  try {
    response = await fetch(`${getEndpoint()}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskType, input }),
      signal: controller.signal
    });
    rawPayload = await response.text();
  } catch (reason) {
    if (timedOut) throw new Error("生成请求超时，请稍后重试或检查服务状态");
    if (reason instanceof Error && reason.name === "AbortError") throw new Error("生成请求已取消，请重试");
    throw new Error("生成服务暂时无法连接，请检查网络或稍后重试");
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener("abort", abortRequest);
  }

  let payload: AiSuccess | AiFailure | null = null;
  try {
    payload = JSON.parse(rawPayload) as AiSuccess | AiFailure;
  } catch {
    payload = null;
  }
  if (!response.ok || !payload || payload.ok !== true || !payload.content) {
    throw new Error(payload && "error" in payload && payload.error ? payload.error : "生成服务暂时不可用，请稍后重试");
  }
  return payload.content;
}
