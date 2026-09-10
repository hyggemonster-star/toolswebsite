export type BarcodeResult = {
  value: string;
  svg: string;
};

const leftPatterns = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const leftGPatterns = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const rightPatterns = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const parityPatterns = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

function checksum(value: string) {
  const sum = Array.from(value).reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return String((10 - (sum % 10)) % 10);
}

function escapeSvg(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

export function createEan13Barcode(input: string): BarcodeResult {
  const digits = input.replace(/[\s-]/g, "");
  if (!/^\d{12,13}$/.test(digits)) throw new Error("EAN-13 需要输入 12 位数字（自动补校验位）或完整 13 位数字。 ");
  const value = digits.length === 12 ? digits + checksum(digits) : digits;
  if (digits.length === 13 && value[12] !== checksum(value.slice(0, 12))) throw new Error("校验位不正确，请检查 EAN-13 数字。 ");

  const first = Number(value[0]);
  const parity = parityPatterns[first];
  const left = Array.from(value.slice(1, 7), (digit, index) => parity[index] === "G" ? leftGPatterns[Number(digit)] : leftPatterns[Number(digit)]).join("");
  const right = Array.from(value.slice(7), (digit) => rightPatterns[Number(digit)]).join("");
  const modules = `101${left}01010${right}101`;
  const moduleWidth = 3;
  const leftEdge = 21;
  const barTop = 16;
  const regularHeight = 112;
  const guardHeight = 124;
  const bars = Array.from(modules).reduce((markup, bit, index) => {
    if (bit !== "1") return markup;
    const isGuard = index < 3 || (index >= 45 && index < 50) || index >= modules.length - 3;
    return `${markup}<rect x="${leftEdge + index * moduleWidth}" y="${barTop}" width="${moduleWidth}" height="${isGuard ? guardHeight : regularHeight}"/>`;
  }, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${leftEdge * 2 + modules.length * moduleWidth}" height="160" viewBox="0 0 ${leftEdge * 2 + modules.length * moduleWidth} 160" role="img" aria-label="EAN-13 条形码 ${escapeSvg(value)}"><rect width="100%" height="100%" fill="#ffffff"/> <g fill="#17233f" shape-rendering="crispEdges">${bars}</g><g fill="#17233f" font-family="Arial, sans-serif" font-size="17" text-anchor="middle"><text x="13" y="149">${value[0]}</text><text x="${leftEdge + 24 * moduleWidth}" y="149">${value.slice(1, 7).split("").join(" ")}</text><text x="${leftEdge + 71 * moduleWidth}" y="149">${value.slice(7).split("").join(" ")}</text></g></svg>`;
  return { value, svg };
}

export function barcodeSvgBlob(svg: string) {
  return new Blob([`<?xml version="1.0" encoding="UTF-8"?>${svg}`], { type: "image/svg+xml;charset=utf-8" });
}
