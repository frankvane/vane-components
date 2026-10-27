/**
 * 示例目录
 *
 * 两个 glob 指向同一批文件：一份拿组件、一份拿 `?raw` 源码 ——
 * 所以「下通栏」展示的代码就是正在跑的那份，不是另写的文档。
 * 排序用文件名前缀（01…17），不依赖构建器枚举顺序。
 */
import type { DemoFileModule } from "./types";
import { PLUGINS } from "../data/plugin-catalog";

export interface DemoEntry {
  /** = meta.plugin，也是路由 /demos/:id 的 id */
  id: string;
  file: string;
  source: string;
  Module: DemoFileModule;
}

const modules = import.meta.glob<DemoFileModule>("./[0-9]*.tsx", { eager: true });
const sources = import.meta.glob<string>("./[0-9]*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const DEMOS: DemoEntry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const file = path.replace(/^\.\//, "");
    return { id: mod.meta.plugin, file, source: sources[path] ?? "", Module: mod };
  })
  .sort((a, b) => a.file.localeCompare(b.file));

export function findDemo(id: string): DemoEntry | undefined {
  return DEMOS.find((d) => d.id === id);
}

/**
 * 一页对一插件，且档位声明必须与 catalog 完全一致。
 *
 * 两条都查，因为两种漂移都不会主动报错：
 *  - 少一页 → 侧栏点得到、页面 404；
 *  - 少一档 → 下拉里能选、渲染空白（`MAP[variant]` 落 undefined）。
 */
const byId = new Map(DEMOS.map((d) => [d.id, d]));

for (const plugin of PLUGINS) {
  const demo = byId.get(plugin.id);
  if (!demo) {
    throw new Error(`[demo] 插件 ${plugin.id} 没有对应的 demos/NN-*.tsx`);
  }
  const want = [...plugin.variants.map((v) => v.key)].sort().join(",");
  const got = [...demo.Module.keys].sort().join(",");
  if (want !== got) {
    throw new Error(
      `[demo] ${demo.file} 的 keys 与 catalog.variants 不一致：期望 ${want}，实际 ${got}`
    );
  }
}

const extra = DEMOS.filter((d) => !PLUGINS.some((p) => p.id === d.id));
if (extra.length) {
  throw new Error(`[demo] 这些示例页没有对应插件：${extra.map((d) => d.file).join(", ")}`);
}

export const DEMO_COUNT = DEMOS.length;
