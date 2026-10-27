/**
 * 「最小装配」代码生成（逐项示例版）
 *
 * 由 meta 现场拼，而不是另写一份片段：插件名、配置、props 只有一处真相，
 * 改示例时不会忘同步代码块。支持 `{{key}}` 占位 —— 把控件拖到 3，
 * 下面的代码就变成 `{ min: 3 }`，所谓「拖控件 = 改代码」。
 */
import type { DemoCfg, DemoMeta } from "./types";

const PH = /\{\{\s*([\w-]+)\s*\}\}/g;

function fill(text: string, cfg: DemoCfg): string {
  return text.replace(PH, (raw, key: string) => (key in cfg ? String(cfg[key]) : raw));
}

export function buildDemoCode(meta: DemoMeta, cfg: DemoCfg): string {
  // 页内局部插件（local: true）不在官方桶里，不能让读者去 import —— 只在装配处留一行注释
  const official = meta.plugs.filter((p) => !p.local);
  const locals = meta.plugs.filter((p) => p.local);
  const factories = official.map((p) => p.fn).sort();
  const multi = factories.length > 3;

  const importLine = factories.length
    ? multi
      ? `import {\n${factories.map((f) => `  ${f},`).join("\n")}\n} from "vane-card/custom-plugins";`
      : `import { ${factories.join(", ")} } from "vane-card/custom-plugins";`
    : `// 这一页只用 Core props，不需要任何插件`;

  const localNote = locals.length
    ? `\n// 页内局部插件（本文件内定义，不在 vane-card/custom-plugins 里）：\n//   ${locals
        .map((p) => `${p.fn}()`)
        .join("、")}`
    : "";

  const pluginLines = meta.plugs
    .map(
      (p) =>
        `  ${p.fn}(${p.cfg ? `{ ${fill(p.cfg, cfg)} }` : ""}),${
          p.local ? "  // 局部插件" : ""
        }`
    )
    .join("\n");

  const propLines = meta.props
    .filter((p) => typeof p === "string" || !p.when || p.when(cfg))
    .map((p) => `      ${fill(typeof p === "string" ? p : p.text, cfg)}`)
    .join("\n");

  const body = meta.plugs.length
    ? `const Card = withPlugins(CardCore, {\n  plugins: [\n${pluginLines
        .split("\n")
        .map((l) => `  ${l}`)
        .join("\n")}\n  ],\n});`
    : `const Card = CardCore;`;

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { CardCore, withPlugins } from "vane-card";
${importLine}${localNote}
import type { ProductData } from "vane-card";

${body}

export function Demo({ product }: { product: ProductData }) {
  return (
    <Card
      cardId="${meta.slug}"
      data={product}
${propLines}
    >
${meta.children ?? "      {/* 卡片内容来自插件；没装插件时这里就是全部内容 */}"}
    </Card>
  );
}
`;
}

/** 数据对象代码块：让读者知道「插件读的是哪些字段」 */
export function buildDataCode(meta: DemoMeta): string {
  if (meta.dataCode) return meta.dataCode;
  return `// 插件只读这些字段（缺哪个就只是对应区域不渲染，不抛错）
{
  title: "经典圆领 T 恤 · 260g 长绒棉",
  subtitle: "新疆长绒棉 · 双纱领口 · 三色可选",
  price: 299,
  oldPrice: 399,
  image: "data:image/svg+xml,…",
  inventory: 12,
  rating: 4.6,
  ratingCount: 1284,
  tags: ["纯棉", "夏季", "基础款"],
  variants: [
    { sku: "TS-RED-M", attrs: { 颜色: "赤陶", 尺码: "M" }, price: 319, stock: 3 },
    { sku: "TS-OLIVE-L", attrs: { 颜色: "橄榄", 尺码: "L" }, price: 299, stock: 0 },
  ],
}`;
}
