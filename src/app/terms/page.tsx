import { TrustPage } from "@/components/TrustPage";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("/terms", "使用条款", "中文效率工具箱的使用边界、用户责任和内容规范。");

export default function TermsPage() {
  return <TrustPage title="使用条款" description="使用工具前请了解服务边界。本站提供轻量在线处理能力，不替代专业判断、平台审核或正式业务系统。" sections={[
    { title: "1. 服务范围", paragraphs: ["本站提供文件、图片、文本、开发和日常工具。工具支持的格式、处理范围和输出方式以具体页面说明为准。"] },
    { title: "2. 用户责任", bullets: ["只处理你有权使用、上传、修改或分享的文字、图片、音视频和文件。", "不得利用工具制作违法、侵权、欺诈、骚扰、恶意传播或违反平台规则的内容。", "使用工具输出前自行核对事实、版权、隐私、广告合规和适用平台规则。", "不要把密码、支付信息、身份信息或商业机密提交到不必要的处理流程。"] },
    { title: "3. 结果与可用性", paragraphs: ["工具输出可能需要检查，尤其是文件版式转换、文字提取和格式校验。本站不承诺结果适用于特定业务、机构审核或法律要求。", "如遇浏览器不支持或文件格式超出页面说明范围，请按提示检查输入或改用其他工具。"] },
    { title: "4. 外部链接", paragraphs: ["工具目录中的第三方入口不代表本站对其功能、价格、隐私、地区可用性或安全性作出保证。请以第三方官方页面为准。"] },
  ]} />;
}
