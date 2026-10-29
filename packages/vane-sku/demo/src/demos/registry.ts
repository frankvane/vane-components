/**
 * 示例目录（逐插件示例）
 *
 * 两个 glob 指向同一批文件：一份拿组件、一份拿源码 —— 展示的代码就是正在跑的那份。
 * 排序用文件名前缀（00…16），保证导航顺序稳定，不依赖构建器枚举顺序。
 */
import type { ComponentType } from "react";
import type { DemoGroup, DemoMeta, DemoModule, DemoStageProps } from "./types";

export interface DemoEntry {
  meta: DemoMeta;
  Stage: ComponentType<DemoStageProps>;
  /** 文件名，如 "06-price-link.tsx" */
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

export const DEMO_GROUPS: DemoGroup[] = ["basic", "advanced", "plugin"];

export function demosOf(group: DemoGroup): DemoEntry[] {
  return DEMOS.filter((d) => d.meta.group === group);
}

export function findDemo(slug: string): DemoEntry | undefined {
  return DEMOS.find((d) => d.meta.slug === slug);
}

/** 本目录覆盖到的官方插件（目录名），供总览统计与校验脚本核对 */
export const DEMO_PLUGINS: string[] = Array.from(
  new Set(DEMOS.map((d) => d.meta.plugin).filter((p): p is string => Boolean(p)))
).sort();
