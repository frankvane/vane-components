/**
 * 「最小装配版」代码生成
 *
 * 由 meta 现场拼出来，而不是另写一份文件：这样插件名、配置、props 只有一处真相，
 * 改场景时不会忘记同步文档。生成结果保证可编译（import 按字母序、只导用到的工厂）。
 */
import type { ScenarioMeta } from "./types";

export function buildMinimal(meta: ScenarioMeta): string {
  const factories = meta.plugs.map((p) => p.fn).sort();
  const multi = factories.length > 3;

  const importLine = multi
    ? `import {\n${factories.map((f) => `  ${f},`).join("\n")}\n} from "vane-waterfall/custom-plugins";`
    : `import { ${factories.join(", ")} } from "vane-waterfall/custom-plugins";`;

  const pluginLines = meta.plugs
    .map((p) => `  ${p.fn}(${p.cfg ? `{ ${p.cfg} }` : ""}),`)
    .join("\n");

  const propLines = meta.props.map((p) => `      ${p}`).join("\n");

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { WaterfallCore, withPlugins } from "vane-waterfall";
${importLine}

type Item = { id: string; title: string; height: number; author: string };

const Waterfall = withPlugins(WaterfallCore, [
${pluginLines}
]);

export default function Feed({ items }: { items: Item[] }) {
  return (
    <Waterfall
      items={items}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <Card item={item} />}
${propLines}
    />
  );
}
`;
}
