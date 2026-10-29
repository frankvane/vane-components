/**
 * 「最小装配版」代码生成
 *
 * 由 meta 现场拼出来，而不是另写一份文件：这样插件名、配置、props 只有一处真相，
 * 改场景时不会忘记同步文档。生成结果保证可编译（import 按工厂名排序、只导用到的工厂）。
 *
 * 与 vane-profile 的差别：SKU 走 createSkuSelector 装配 API + 深层子路径
 * import（一行一个），照抄到真实项目里不需要改任何路径。
 */
import type { ScenarioMeta } from "./types";

export function buildMinimal(meta: ScenarioMeta): string {
  const factories = meta.plugs.map((p) => p.fn).sort();

  // 深层子路径一行一个（消费者视角，vite 别名指回源码，发布后指 dist）
  const importLines = factories
    .map((f) => `import { ${f} } from "vane-sku/custom-plugins/${f.replace(/^create|Plugin$/g, "")}";`)
    .join("\n");

  const pluginLines = meta.plugs
    .map((p) => `  ${p.fn}(${p.cfg ? `{ ${p.cfg} }` : ""}),`)
    .join("\n");

  const propLines = meta.props.map((p) => `      ${p}`).join("\n");

  // plugs 为空：这一版只用内核（组合矩阵 + 禁用推导 + 规格按钮组）
  const assembly =
    meta.plugs.length === 0
      ? `// ${meta.title} · 这一版只用内核\nconst Sku = createSkuSelector([]);`
      : `const Sku = createSkuSelector([\n${pluginLines}\n]);`;

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { createSkuSelector } from "vane-sku";
${importLines}
import type { SkuAttribute, SkuVariant } from "vane-sku";

${assembly}

export default function Demo({
  attributes,
  variants,
}: {
  attributes: SkuAttribute[];
  variants: SkuVariant[];
}) {
  return (
    <Sku
      attributes={attributes}
      variants={variants}
${propLines}
    />
  );
}
`;
}
