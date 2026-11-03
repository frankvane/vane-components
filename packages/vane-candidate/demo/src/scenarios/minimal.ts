/**
 * 「最小装配版」代码生成
 *
 * 由 meta 现场拼出来，而不是另写一份文件：这样插件名、配置、props 只有一处真相，
 * 改场景时不会忘记同步文档。生成结果保证可编译（import 一插件一行、深层子路径、按名称序）。
 */
import type { ScenarioMeta } from "./types";

/** 一插件一行 import，深层子路径（ADR-6 严格），按工厂名排序 */
function importLines(meta: ScenarioMeta): string {
  const factories = meta.plugs.map((p) => p.fn).sort();
  return factories
    .map((fn) => {
      const dir = `${fn.replace(/^create/, "").replace(/Plugin$/, "")}Plugin`;
      return `import { ${fn} } from "vane-candidate/custom-plugins/${dir}";`;
    })
    .join("\n");
}

export function buildMinimal(meta: ScenarioMeta): string {
  const pluginLines = meta.plugs
    .map((p) => `  ${p.fn}(${p.cfg ? `{ ${p.cfg} }` : ""}),`)
    .join("\n");

  const propLines = meta.props.map((p) => `      ${p}`).join("\n");

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { CandidateCore, withPlugins } from "vane-candidate";
import type { Candidate } from "vane-candidate";
${importLines(meta)}

const Board = withPlugins(CandidateCore, [
${pluginLines}
]);

export default function Demo({ data }: { data: Candidate[] }) {
  return (
    <Board
      data={data}
${propLines}
    />
  );
}
`;
}
