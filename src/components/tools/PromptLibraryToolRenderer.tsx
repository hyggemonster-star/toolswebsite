"use client";

import { BookOpen, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { generateEcommercePrompts, type EcommercePromptCategory, type EcommercePromptTone } from "@/lib/text";
import { AiEnhancementPanel } from "./AiEnhancementPanel";
import { CopyButton, HistoryControls, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleProduct = "可折叠通勤保温杯";
const sampleAudience = "需要通勤携带、重视收纳和日常饮水的上班族";
const sampleFeatures = "容量 450ml，可折叠收纳；食品接触级材质（具体检测信息需补充）；杯盖带密封结构；适合办公室和短途通勤，不建议装碳酸饮料。";
const sampleMarket = "国内电商平台，商品详情页";
const categories: Array<{ value: EcommercePromptCategory; label: string }> = [
  { value: "product", label: "商品信息" },
  { value: "marketing", label: "营销内容" },
  { value: "customer-service", label: "客服沟通" },
  { value: "cross-border", label: "跨境电商" },
];
const tones: Array<{ value: EcommercePromptTone; label: string }> = [
  { value: "clear", label: "清晰直接" },
  { value: "warm", label: "温和友好" },
  { value: "professional", label: "专业克制" },
  { value: "concise", label: "短句精简" },
];

export function PromptLibraryToolRenderer({ tool }: { tool: ToolRecord }) {
  const [product, setProduct] = useState(sampleProduct);
  const [audience, setAudience] = useState(sampleAudience);
  const [features, setFeatures] = useState(sampleFeatures);
  const [market, setMarket] = useState(sampleMarket);
  const [category, setCategory] = useState<EcommercePromptCategory>("product");
  const [tone, setTone] = useState<EcommercePromptTone>("clear");
  const [submittedProduct, setSubmittedProduct] = useState(sampleProduct);
  const [submittedAudience, setSubmittedAudience] = useState(sampleAudience);
  const [submittedFeatures, setSubmittedFeatures] = useState(sampleFeatures);
  const [submittedMarket, setSubmittedMarket] = useState(sampleMarket);
  const [submittedCategory, setSubmittedCategory] = useState<EcommercePromptCategory>("product");
  const [submittedTone, setSubmittedTone] = useState<EcommercePromptTone>("clear");
  const draft = useMemo(() => generateEcommercePrompts(submittedProduct, submittedAudience, submittedFeatures, submittedMarket, submittedTone, submittedCategory), [submittedAudience, submittedCategory, submittedFeatures, submittedMarket, submittedProduct, submittedTone]);
  const allPrompts = draft?.prompts.map((item, index) => `模板 ${index + 1}：${item.title}\n用途：${item.use}\n\n${item.prompt}`).join("\n\n---\n\n") ?? "";

  function reset() {
    setProduct(sampleProduct);
    setAudience(sampleAudience);
    setFeatures(sampleFeatures);
    setMarket(sampleMarket);
    setCategory("product");
    setTone("clear");
    setSubmittedProduct(sampleProduct);
    setSubmittedAudience(sampleAudience);
    setSubmittedFeatures(sampleFeatures);
    setSubmittedMarket(sampleMarket);
    setSubmittedCategory("product");
    setSubmittedTone("clear");
  }

  function submit() {
    setSubmittedProduct(product);
    setSubmittedAudience(audience);
    setSubmittedFeatures(features);
    setSubmittedMarket(market);
    setSubmittedCategory(category);
    setSubmittedTone(tone);
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="按电商场景筛选并填充可复制的 Prompt 模板，在浏览器本地整理商品、客服和跨境运营素材。" /><div className="title-tool-grid"><TextareaField label="真实卖点与规格" value={features} onChange={setFeatures} placeholder="每行写一条真实参数、卖点、限制或证据，不要写未经确认的承诺" rows={9} /><div className="title-options"><label className="tool-field"><span>商品 / 服务</span><input value={product} onChange={(event) => setProduct(event.target.value)} placeholder="例如：手冲咖啡礼盒、收纳箱" /></label><label className="tool-field"><span>目标用户</span><input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="例如：租房上班族、跨境买家" /></label><label className="tool-field"><span>平台 / 市场</span><input value={market} onChange={(event) => setMarket(event.target.value)} placeholder="例如：淘宝详情页、Amazon 美国站" /></label><label className="tool-field"><span>模板场景</span><select value={category} onChange={(event) => setCategory(event.target.value as EcommercePromptCategory)}>{categories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="tool-field"><span>表达方向</span><select value={tone} onChange={(event) => setTone(event.target.value as EcommercePromptTone)}>{tones.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={submit} disabled={!product.trim()}><BookOpen size={17} />整理 Prompt 模板</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">本地模板库，不调用 AI</span></div>{draft && <div className="prompt-library-result-list" aria-live="polite"><div className="prompt-library-header"><strong>{draft.categoryLabel} · {draft.toneLabel}</strong><span>已填充真实信息，可复制到你有权限使用的模型或工作流中</span></div>{draft.prompts.map((item) => <article className="prompt-library-card" key={item.title}><div className="prompt-library-card-heading"><div><strong>{item.title}</strong><small>{item.use}</small></div><CopyButton value={item.prompt} /></div><pre>{item.prompt}</pre></article>)}</div>}<div className="workspace-actions title-result-actions"><CopyButton value={allPrompts} />{allPrompts && <TextDownloadButton value={allPrompts} name="ecommerce-prompt-templates.txt" />}<span className="count-note">复制前请检查商品信息与平台规则</span></div><HistoryControls toolSlug={tool.slug} content={allPrompts} title="电商 Prompt 模板组" /><ToolNotice tone="warning">这是本地电商 Prompt 模板库，不代表自动生成、实时热度或平台推荐；请只填入真实信息，核对功效、认证、价格、物流、客户资料和广告合规要求。</ToolNotice><AiEnhancementPanel taskType="ecommerce_copy" toolSlug={tool.slug} title="电商内容" input={{ product: submittedProduct, audience: submittedAudience, features: submittedFeatures, market: submittedMarket, category: submittedCategory, tone: submittedTone }} localContent={allPrompts} /></div>;
}
