/**
 * 示例目录（逐项示例）
 *
 * 两个 glob 指向同一批文件：一份拿组件、一份拿源码 —— 展示的代码就是正在跑的那份。
 * 排序用文件名前缀（00…NN），保证导航顺序稳定，不依赖构建器枚举顺序。
 */
import type { ComponentType } from "react";
import type { DemoGroup, DemoMeta, DemoModule, DemoStageProps } from "./types";

export interface DemoEntry {
  meta: DemoMeta;
  Stage: ComponentType<DemoStageProps>;
  /** 文件名，如 "00-basic.tsx" */
  file: string;
  source: string;
}

const modules = import.meta.glob<DemoModule>("./[0-9]*.tsx", { eager: true });
const sources = import.meta.glob<string>("./[0-9]*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

const fileOf = (path: string) => path.replace(/^\.\//, "");

export const DEMOS: DemoEntry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const file = fileOf(path);
    return { meta: mod.meta, Stage: mod.default, file, source: sources[path] ?? "" };
  })
  .sort((a, b) => a.file.localeCompare(b.file));

export const DEMO_GROUPS: DemoGroup[] = Array.from(
  new Set(DEMOS.map((d) => d.meta.group))
) as DemoGroup[];

export function findDemo(slug: string): DemoEntry | undefined {
  return DEMOS.find((d) => d.meta.slug === slug);
}
