/**
 * 「最小装配」代码生成（逐插件示例版）
 *
 * 和 scenarios/minimal.ts 同样的思路：由 meta 现场拼，而不是另写一份片段 ——
 * 插件名、配置、props 只有一处真相，改示例时不会忘同步文档。
 *
 * 比场景版多一件事：支持 `{{key}}` 占位，用控件当前值替换。
 * 这样把「间距」滑到 24，下面的代码就变成 `columnGap: 24` —— 拖控件 = 改代码。
 */
import type { DemoCfg, DemoMeta } from "./types";

const PH = /\{\{\s*([\w-]+)\s*\}\}/g;

function fill(text: string, cfg: DemoCfg): string {
  return text.replace(PH, (raw, key: string) => (key in cfg ? String(cfg[key]) : raw));
}

export function buildDemoCode(meta: DemoMeta, cfg: DemoCfg): string {
  const factories = meta.plugs.map((p) => p.fn).sort();
  const multi = factories.length > 3;

  const importLine = factories.length
    ? multi
      ? `import {\n${factories.map((f) => `  ${f},`).join("\n")}\n} from "vane-waterfall/custom-plugins";`
      : `import { ${factories.join(", ")} } from "vane-waterfall/custom-plugins";`
    : `// 这一页只用 Core props，不需要任何插件`;

  const pluginLines = meta.plugs
    .map((p) => `  ${p.fn}(${p.cfg ? `{ ${fill(p.cfg, cfg)} }` : ""}),`)
    .join("\n");

  const propLines = meta.props.map((p) => `      ${fill(p, cfg)}`).join("\n");

  const body = meta.plugs.length
    ? `const Waterfall = withPlugins(WaterfallCore, [
${pluginLines}
]);`
    : `const Waterfall = WaterfallCore;`;

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { WaterfallCore, withPlugins } from "vane-waterfall";
${importLine}

type Item = { id: string; title: string; height: number };

${body}

export default function Demo({ items }: { items: Item[] }) {
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
