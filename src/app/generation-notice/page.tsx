import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";

export const metadata: Metadata = {
  title: "智能生成说明",
  description: "了解中文效率工具箱的云端模型服务、输入隐私和生成结果复核要求。",
};

export default function GenerationNoticePage() {
  return <TrustPage title="智能生成说明" description="标题、脚本、内容整理和提示词工具会调用云端模型服务；页面文案保持简洁，但处理事实和隐私边界不会被隐藏。" sections={[
    { title: "哪些工具会使用云端模型服务", paragraphs: ["内容标题、脚本、笔记整理、长文重点、工作周报、简历、面试准备、PPT 大纲、提示词和电商内容等工具，会把你主动提交的输入发送到云端模型服务后返回结果。"] },
    { title: "请不要输入敏感内容", bullets: ["不要输入密码、身份证号、银行卡号、验证码或私密账号信息。", "不要输入未公开的商业机密、合同原件、客户名单或不必要的个人信息。", "如果必须处理敏感材料，请先脱敏，或优先使用明确标注为浏览器本地的工具。"] },
    { title: "结果需要人工复核", paragraphs: ["生成结果可能有事实、数字、语气、版权或合规问题。请结合原始材料自行修改和核对，不要把结果当作专业意见或平台保证。", "上游服务偶发繁忙或超时是可能的；页面会停止等待并提供重试，不会用本地模板冒充成功结果。"] },
  ]} />;
}
