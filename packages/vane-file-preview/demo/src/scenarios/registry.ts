/**
 * 场景目录
 *
 * 与 demos 一样双 glob：组件 + `?raw` 源码。场景卡右栏可以切「最小装配 / 本页源码」，
 * 前者只有装配那十几行（贴进自己项目就能用），后者是这份版式的完整实现。
 */
import type { ScenarioModule } from "./types";

export interface ScenarioEntry {
  id: string;
  file: string;
  source: string;
  Module: ScenarioModule;
}

const modules = import.meta.glob<ScenarioModule>("./[0-9]*.tsx", { eager: true });
const sources = import.meta.glob<string>("./[0-9]*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const SCENARIOS: ScenarioEntry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const file = path.replace(/^\.\//, "");
    return {
      id: file.replace(/^\d+-/, "").replace(/\.tsx$/, ""),
      file,
      source: sources[path] ?? "",
      Module: mod,
    };
  })
  .sort((a, b) => a.file.localeCompare(b.file));

/** 场景里用到的插件工厂去重列表（装配顺序 = 首次出现的顺序） */
export function pluginsOf(entry: ScenarioEntry): string[] {
  return Array.from(new Set(entry.Module.meta.plugs.map((p) => p.fn)));
}

/**
 * 最小装配代码：只有 import + withPlugins，没有版式。
 *
 * 版式是业务的事，这一层只解决「按类型路由到哪个插件」，所以要标出来 ——
 * 否则用户会以为复制这段就有一模一样的界面。
 */
export function minimalCode(entry: ScenarioEntry): string {
  const { meta } = entry.Module;
  const fns = pluginsOf(entry);
  return [
    `// ${meta.code} ${meta.title} · 最小装配`,
    `// ${meta.pain}`,
    'import { FilePreviewCore, withPlugins } from "vane-file-preview";',
    // create<X>Plugin → custom-plugins/<X>Plugin，子路径名与工厂名一一对应
    ...fns.map(
      (fn) => `import { ${fn} } from "vane-file-preview/custom-plugins/${fn.replace(/^create/, "")}";`
    ),
    "",
    "const Preview = withPlugins(FilePreviewCore, [",
    ...fns.map((fn) => `  ${fn}(),`),
    "]);",
    "",
    "// 版式与数据由业务侧负责，这一层只决定「这个文件该由谁渲染」",
    "<Preview file={file} containerStyle={{ height: 420 }} />;",
  ].join("\n");
}
