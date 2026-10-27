/**
 * 版式结构校验
 *
 * 检查的不是像素，是「目录结构对不对」—— 这类问题在页面上看不出来，
 * 但会让「01/02/03 的编号」和侧栏顺序慢慢跑偏：
 *
 *   1. 文件编号连续（01…09），没有断号
 *   2. meta.id 与文件名去掉序号后一致（`01-vertical.tsx` ↔ `vertical`）
 *   3. meta.width 是正数（版式的宽度就是它的定义，缺了整页都会错位）
 *   4. 每个文件都 export meta 与默认组件
 *
 * 用法：node scripts/verify-layouts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "demo/src/layouts");

const files = fs
  .readdirSync(DIR)
  .filter((f) => /^\d{2}-.+\.tsx$/.test(f))
  .sort();

const problems = [];

files.forEach((file, i) => {
  const no = file.slice(0, 2);
  const expectNo = String(i + 1).padStart(2, "0");
  if (no !== expectNo) problems.push(`${file}: 编号应为 ${expectNo}，实际 ${no}`);

  const src = fs.readFileSync(path.join(DIR, file), "utf8");
  const idInFile = file.slice(3, -4);
  const m = /id:\s*"([\w-]+)"/.exec(src);
  if (!m) problems.push(`${file}: 没有 meta.id`);
  else if (m[1] !== idInFile) problems.push(`${file}: meta.id「${m[1]}」与文件名「${idInFile}」不一致`);

  if (!/export\s+const\s+meta\b/.test(src)) problems.push(`${file}: 没有 export const meta`);
  if (!/export\s+default\s+function/.test(src)) problems.push(`${file}: 没有 export default function`);

  // 只在 meta 对象块里找 width —— 文件里别处也有 width（比如 svgPlate({ width: 1000 })），
  // 全文正则会把那种当成版式宽度，报出「1000 超宽」这种假警。
  const metaBlock = /export const meta: LayoutMeta = \{([\s\S]*?)\n\};/.exec(src)?.[1] ?? "";
  const w = /width:\s*(\d+)/.exec(metaBlock);
  if (!w || Number(w[1]) <= 0) problems.push(`${file}: meta.width 缺失或非正数`);
  // 舞台这一列实际可用宽约 610，超过必溢出
  else if (Number(w[1]) > 610) problems.push(`${file}: width ${w[1]} 超过舞台可用宽 610，会溢出`);
});

if (problems.length) {
  console.error(`✗ 版式校验失败（${problems.length} 项）：`);
  problems.forEach((p) => console.error("  - " + p));
  process.exit(1);
}

console.log(`✓ ${files.length} 个版式：编号连续 / id 与文件名一致 / 都有 meta 与默认导出 / 宽度不溢出`);
