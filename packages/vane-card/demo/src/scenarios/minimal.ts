/**
 * 「最小装配版」代码生成
 *
 * 由 meta 现场拼出来，而不是另写一份文件：插件名、配置、props 只有一处真相。
 * 生成结果保证可编译（import 按字母序、只导用到的工厂）。
 */
import type { ScenarioMeta } from "./types";

export function buildMinimal(meta: ScenarioMeta): string {
  const factories = meta.plugs.map((p) => p.fn).sort();
  const multi = factories.length > 3;

  const importLine = factories.length
    ? multi
      ? `import {\n${factories.map((f) => `  ${f},`).join("\n")}\n} from "vane-card/custom-plugins";`
      : `import { ${factories.join(", ")} } from "vane-card/custom-plugins";`
    : `// 这个场景只用 Core props`;

  const pluginLines = meta.plugs
    .map((p) => `  ${p.fn}(${p.cfg ? `{ ${p.cfg} }` : ""}),`)
    .join("\n");

  const propLines = meta.props.map((p) => `      ${p}`).join("\n");

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { CardCore, withPlugins } from "vane-card";
${importLine}
import type { ProductData } from "vane-card";

const Card = withPlugins(CardCore, {
  plugins: [
${pluginLines}
  ],
});

export function Scene({ product }: { product: ProductData }) {
  return (
    <Card cardId="${meta.id}" data={product}
${propLines}
    >
      {/* 卡片内容区：插件负责图 / 价 / 按钮 */}
    </Card>
  );
}
`;
}
