import http from "node:http";

const PORT = Number(process.env.PORT || 39100);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://106.12.81.63:39090";
const ARK_BASE_URL = (process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/+$/, "");
const ARK_MODEL = process.env.ARK_MODEL || "ep-20260911113143-bbsnh";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_INPUT_CHARS = 12000;
const MAX_OUTPUT_TOKENS = 1200;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 90 * 1000);
const FACTUAL_GROUNDING = "结构化输入是事实的唯一来源。任何可被理解为已经发生的细节（人物、物品、地点、动作、时长、数量、费用、原因、结果、效果、数据、评价或经历）都必须有输入原文的明确依据；禁止猜测、补全或把可能性写成事实。保留原文中的数字、否定、条件和不确定性。没有依据的信息应省略，或写成【请按真实情况补充】。可以提出新的创作建议，但必须逐项明确标注为【建议】或【示例】，不可伪装成用户真实经历。只有输入明确包含第一人称经历时才可使用‘我/我们’叙述。不要宣称内容已经核实、全部来自输入或效果有保证，除非逐项确实满足。输出前逐句对照输入，删除所有无来源的事实，特别检查费用、时间、因果、实测、前后变化和行动结果。";

const taskPrompts = {
  xhs_title: {
    label: "小红书标题",
    prompt: "根据输入生成 8 条具体、自然的小红书标题候选，每行一条。标题只陈述输入明确支持的内容，不额外添加人物、场景、数量、时长、费用或效果。禁止‘零成本、低成本、扩容、搞定、实测、救星、再也、保证’等没有明确证据支持的结论。输入只提出计划或主题时，不得写成事情已经发生；未明确说明观察/改造已完成时，用‘计划/思路/观察方向’等中性措辞，不得暗示已有结果。"
  },
  xhs_title_analysis: {
    label: "小红书标题结构分析",
    prompt: "只分析标题文字本身的主题、明示受众、利益点、情绪信号、具体程度和可能的理解障碍，并给出 3 个保持事实不变的修改方向。未在标题中说明的受众、经历、效果和内容都标注为‘标题未提供’，不要自行推断。不得预测流量、点赞或爆款概率。修改候选不得新增原题未支持的事实、数字、因果或效果。"
  },
  xhs_tags: {
    label: "小红书标签",
    prompt: "根据输入整理 8 到 12 个相关标签，分成核心主题、使用场景和细分人群三类。主题标签可做同义归纳；场景和人群标签只有在输入明确支持时才给出，否则少给并标注‘需补充场景/受众’。不要声称实时热度，不要编造平台数据或实测结果，不要推荐与输入无关的标签。"
  },
  xhs_note_rewrite: {
    label: "小红书笔记改写",
    prompt: "在不改变输入事实、数字、体验和立场的前提下，把笔记整理成更易阅读的结构。保留真实限制；不得补充时间、物品、动作、费用、效果、因果或亲身体验。标题候选也必须严格基于原文。输出标题建议、正文改写和需要人工核对的内容；若未添加事实，核对项写‘无新增事实’，不要写‘所有内容均已核实’。"
  },
  douyin_title: {
    label: "抖音标题",
    prompt: "根据输入生成 8 条适合短视频封面或标题区的候选。每条只使用输入明确支持的事实，不能把计划写成已经发生，也不得添加场景、人物、结果或前后对比。除非输入明确描述真实结果，否则不要使用‘改善、搞定、扩容、成功’等结果词。避免夸张承诺、虚假对比、诱导互动和爆款保证；事实不足时使用中性主题标题。"
  },
  douyin_script: {
    label: "抖音口播脚本",
    prompt: "生成一份可编辑的短视频口播脚本，按开场、核心内容、收束行动分段。口播事实只能来自输入；不能编造人物、道具、地点、动作结果、体验、数据或效果。为了便于拍摄可以提出新的画面安排，但每项必须写成【拍摄建议】，且不得暗示它已经发生。缺少具体内容时使用【请按真实情况补充】。"
  },
  short_video_storyboard: {
    label: "短视频分镜",
    prompt: "生成一份可编辑的短视频分镜。每个镜头包含时长、景别、画面、口播和拍摄重点。时长只能使用输入给出的时长或标为建议；画面中的人物、物品、地点和动作必须来自输入，否则明确写为【拍摄建议】或【请按真实情况补充】。不得描述未提供的现状、过程、结果、光线或效果为事实，不得编造案例。"
  },
  wechat_title: {
    label: "公众号标题",
    prompt: "根据输入生成 8 条公众号标题候选。标题只陈述输入明确支持的内容，不得新增受众、结果、原因、数字或结论。不得承诺打开率，不得使用未经证实的结论或夸张营销词；信息有限时采用清晰的主题型标题。"
  },
  moments_copy: {
    label: "朋友圈文案",
    prompt: "根据输入生成 3 条自然克制的朋友圈文案。只使用已明确的经历、关系、地点、原因和结果；尤其不得自行添加植物/产品效果及其原因。输入没有第一人称经历时使用中性表达。可以给出不同措辞，但不得把新事实写成用户经历；必要时以【请按真实情况补充】留空。"
  },
  comment_reply: {
    label: "评论回复",
    prompt: "根据评论原文和输入的场景/语气生成 5 条礼貌、自然的回复候选。不要假设评论者、用户、产品或服务的额外情况，不要代替用户承诺事实，不要编造个人经历或效果。缺少关键信息时，用【请按实际情况回复】占位或建议先询问。"
  },
  text_expression: {
    label: "文本表达",
    prompt: "在不改变事实、数字、立场、条件和原意的前提下，改善输入文字的清晰度、节奏和表达自然度。不得添加背景、原因、结果、评价或行动项。输出：改写后的文本、主要调整点、需要人工核对的事实；对含糊内容保留原样或标为待核对，不要擅自解释。"
  },
  long_summary: {
    label: "长文重点整理",
    prompt: "根据长文和阅读重点，输出简洁摘要、关键事实、行动项和待核对信息。每个事实和行动项必须能在原文找到依据；区分已完成、计划、建议和未确定事项。不得将建议写成行动项、将相关性写成因果、将未确定事项写成结论。保留数字、条件、时间和不确定性。"
  },
  weekly_report: {
    label: "工作周报",
    prompt: "根据输入整理一份适合发送前编辑的工作周报，按完成事项、重点判断、问题风险、下周计划和需要协同分段。完成事项只能来自‘本周完成’字段；不得把计划写成已完成，不得添加输入没有的工作成果、数字、客户信息、原因或承诺。空缺栏目写‘未提供’，不可自行补写。"
  },
  resume: {
    label: "简历内容优化",
    prompt: "根据目标岗位和真实经历整理更清晰的简历内容。只可改写已有经历；不得新增公司、职位、职责、工具、数字、项目规模、结果或技能熟练度。原文明确说没有的经验不得弱化或反向改写。没有量化证据时不要制造成果，标记【请补充可核实证据】。"
  },
  interview_questions: {
    label: "面试准备",
    prompt: "根据目标岗位、面试阶段和真实经历生成面试练习问题、回答组织提示和可反问问题。问题可以合理推演岗位相关主题，但回答组织提示只能指出需要从用户真实经历中提取的信息，不能代写带有未提供事实的答案。任何示例必须逐条标记【示例，仅供参考，需替换】，且不可填入虚构的人物、组织、受众、业务结果、公司流程或数据；缺少信息时写【请按真实情况补充】。不推测特定公司的工作方式或录用标准，不预测录用概率，也不要重复不必要的敏感信息。"
  },
  ppt_outline: {
    label: "PPT 大纲",
    prompt: "根据主题、受众、目标、场景和时长生成一份清晰的演示大纲。每页给出目的、要点和视觉建议。事实、数字、结论、案例和承诺只能来自输入；没有依据的内容明确写【待补充真实数据/案例】。可以提出视觉建议，但要标明‘建议’，不得把示例当作组织现状或已验证结论。"
  },
  prompt_generate: {
    label: "Prompt 生成",
    prompt: "根据目标、受众、背景、输出格式、语气和要求，生成一份可复制使用的 Prompt。准确保留用户给出的事实、限制和未知项；指示后续模型不得虚构事实、结果或来源，信息不足时提问或使用占位符。明确角色、任务、输入、约束和输出格式，不要添加用户未提供的背景，也不要把敏感信息写入示例。"
  },
  ecommerce_copy: {
    label: "电商内容",
    prompt: "根据商品真实信息、目标用户、平台市场、场景和语气生成可编辑的电商内容草稿。只能陈述输入明确给出的材质、规格、功能和限制；不得推导性能或使用效果，不得编造功效、认证、价格、销量、物流、保修或用户评价。客服话术遇到未知参数时先请用户核实，不承诺未知事项。"
  }
};

const rateState = new Map();

function respond(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify(payload));
}

function setCors(response, request) {
  const origin = request.headers.origin;
  if (origin && origin === FRONTEND_ORIGIN) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Vary", "Origin");
  }
}

async function readJson(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      const error = new Error("request_too_large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("invalid_json");
    error.statusCode = 400;
    throw error;
  }
}

function clientKey(request) {
  const forwarded = request.headers["x-forwarded-for"];
  return typeof forwarded === "string" ? forwarded.split(",")[0].trim() : request.socket.remoteAddress || "unknown";
}

function checkRateLimit(request) {
  const key = clientKey(request);
  const now = Date.now();
  const recent = (rateState.get(key) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rateState.set(key, recent);
  return true;
}

function inputAsJson(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const serialized = JSON.stringify(input);
  if (serialized.length > MAX_INPUT_CHARS) return null;
  return serialized;
}

function extractContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter((item) => item && typeof item.text === "string")
      .map((item) => item.text)
      .join("\n")
      .trim();
  }
  return "";
}

async function generateWithArk(taskType, input) {
  const task = taskPrompts[taskType];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const upstream = await fetch(`${ARK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ARK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ARK_MODEL,
        temperature: 0.7,
        max_tokens: MAX_OUTPUT_TOKENS,
        thinking: { type: "disabled" },
        messages: [
          { role: "system", content: `你是工具箱中的${task.label}助手。${FACTUAL_GROUNDING}\n${task.prompt}` },
          { role: "user", content: `请只基于以下结构化输入工作：\n${JSON.stringify(input)}` }
        ]
      }),
      signal: controller.signal
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) throw new Error("ark_request_failed");
    const content = extractContent(payload);
    if (!content) throw new Error("ark_empty_response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

async function handleGenerate(request, response) {
  if (!checkRateLimit(request)) {
    respond(response, 429, { ok: false, error: "请求较多，请稍后操作" });
    return;
  }

  let body;
  try {
    body = await readJson(request);
  } catch (error) {
    respond(response, error.statusCode || 400, { ok: false, error: "请求格式不正确" });
    return;
  }

  const taskType = typeof body.taskType === "string" ? body.taskType : "";
  const input = inputAsJson(body.input);
  if (!taskPrompts[taskType] || !input) {
    respond(response, 400, { ok: false, error: "暂不支持这个 AI 工具或输入过长" });
    return;
  }

  if (!process.env.ARK_API_KEY) {
    respond(response, 503, { ok: false, code: "ai_not_configured", error: "AI 服务暂未配置" });
    return;
  }

  try {
    const content = await generateWithArk(taskType, JSON.parse(input));
    respond(response, 200, { ok: true, taskType, content });
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    const code = timedOut ? "ai_timeout" : "ai_unavailable";
    respond(response, 502, { ok: false, code, error: timedOut ? "模型响应超时" : "AI 模型服务暂时不可用" });
  }
}

const server = http.createServer(async (request, response) => {
  setCors(response, request);
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method === "GET" && (request.url === "/health" || request.url === "/api/ai/health")) {
    respond(response, 200, { ok: true, service: "tools-hub-100-ai-api", arkConfigured: Boolean(process.env.ARK_API_KEY) });
    return;
  }

  if (request.method === "POST" && request.url === "/api/ai/generate") {
    await handleGenerate(request, response);
    return;
  }

  respond(response, 404, { ok: false, error: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`tools-hub-100-ai-api listening on 127.0.0.1:${PORT}`);
});

function closeServer() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
