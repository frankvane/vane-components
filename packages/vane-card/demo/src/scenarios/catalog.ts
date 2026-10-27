/**
 * 场景目录
 *
 * 两个 glob 指向**同一批文件**：
 *  - `eager: true` → 拿到组件与 meta（页面渲染用）
 *  - `query: "?raw"` → 拿到源码字符串（「完整源码」代码块用）
 * 同源是刻意的：卡片上展示的代码就是正在跑的那份，不存在文档漂移。
 */
import type { ComponentType } from "react";
import type { ScenarioMeta, ScenarioModule } from "./types";

export interface ScenarioEntry {
  meta: ScenarioMeta;
  Component: ComponentType;
  /** 文件名，如 "01-sku-detail.tsx" */
  file: string;
  source: string;
}

const modules = import.meta.glob<ScenarioModule>("./[0-9]*.tsx", { eager: true });
const sources = import.meta.glob<string>("./[0-9]*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

const fileOf = (path: string) => path.replace(/^\.\//, "");

export const SCENARIOS: ScenarioEntry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const file = fileOf(path);
    return { meta: mod.meta, Component: mod.default, file, source: sources[path] ?? "" };
  })
  // 按文件名前缀排序，保证页面顺序 = 目录顺序，不受构建器枚举顺序影响
  .sort((a, b) => a.file.localeCompare(b.file));

/** 分类（按首次出现顺序，不重排） */
export const GROUPS: string[] = SCENARIOS.reduce<string[]>((acc, s) => {
  if (!acc.includes(s.meta.group)) acc.push(s.meta.group);
  return acc;
}, []);

/** 行业（按首次出现顺序）。"通用" 永远排第一，它是基线，不是某个行业 */
export const INDUSTRIES: string[] = SCENARIOS.reduce<string[]>((acc, s) => {
  if (!acc.includes(s.meta.industry)) acc.push(s.meta.industry);
  return acc;
}, []).sort((a, b) => (a === "通用" ? -1 : b === "通用" ? 1 : 0));

/** 全部场景用到的插件工厂（去重，供总览统计与校验脚本核对） */
export const USED_PLUGINS: string[] = Array.from(
  new Set(SCENARIOS.flatMap((s) => s.meta.plugs.map((p) => p.fn)))
).sort();
