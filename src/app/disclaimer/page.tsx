import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";

export const metadata: Metadata = {
  title: "免责声明",
  description: "中文效率工具箱的结果、版权、合规和服务可用性说明。",
};

export default function DisclaimerPage() {
  return <TrustPage title="免责声明" description="工具结果用于辅助处理和整理，不构成法律、医疗、财务、职业或平台审核意见。" sections={[
    { title: "结果仅供参考", paragraphs: ["生成、提取、转换、检测和分析结果都可能存在遗漏或误差。请根据实际材料和适用规则进行复核，不要只凭工具结果做重要决定。"] },
    { title: "版权与授权", paragraphs: ["上传或输入内容的版权、隐私和使用授权由使用者负责。涉及视频文案、封面、图片、文章或第三方资料时，请先确认你拥有相应权利或已获得授权。"] },
    { title: "文件与格式边界", paragraphs: ["浏览器本地工具通常适合轻量任务；原始版式、扫描文字、复杂表格、特殊编码和大文件可能无法完整保留。下载结果前后都应打开检查。"] },
    { title: "服务变化", paragraphs: ["浏览器、第三方入口、云端模型服务、网络和服务器维护都可能导致暂时不可用。页面会尽量给出失败和重试提示，但不承诺连续可用或结果时效。"] },
  ]} />;
}
