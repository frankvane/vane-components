/**
 * 「最小装配版」代码生成
 *
 * 由 meta 现场拼出来，而不是另写一份文件：插件名、配置、props 只有一处真相，
 * 改场景时不会忘记同步文档。生成结果保证可编译 ——
 * import 按字母序、只导用到的工厂、每个工厂一条子路径（ADR-6 禁止桶导出）。
 */
import type { ScenarioMeta } from "./types";

const PKG = "vane-asset-library";

/** 工厂名 → 插件目录名：createKindFilterPlugin → KindFilterPlugin */
function dirOf(factory: string): string {
  return `${factory.replace(/^create/, "").replace(/Plugin$/, "")}Plugin`;
}

export function buildMinimal(meta: ScenarioMeta): string {
  const factories = [...new Set(meta.plugs.map((p) => p.fn))].sort();

  const importLine = factories.length
    ? factories.map((fn) => `import { ${fn} } from "${PKG}/custom-plugins/${dirOf(fn)}";`).join("\n")
    : "// 这个场景只用 Core props，不需要任何插件";

  const pluginBlock = factories.length
    ? `const Library = withAssetLibraryPlugins(AssetLibraryCore, [
${meta.plugs.map((p) => `  ${p.fn}(${p.cfg ? `{ ${p.cfg} }` : ""}),`).join("\n")}
]);`
    : "const Library = AssetLibraryCore;";

  const propLines = meta.props.map((p) => `      ${p}`).join("\n");

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { AssetLibraryCore, withAssetLibraryPlugins } from "${PKG}";
import type { AssetItem } from "${PKG}";
${importLine}

${pluginBlock}

export default function Page({ items }: { items: AssetItem[] }) {
  return (
    <Library
      items={items}
${propLines}
    />
  );
}
`;
}
