/**
 * 版式目录
 *
 * 与场景库同一套做法：两个 glob 指向同一批文件 —— `eager` 拿组件、
 * `?raw` 拿源码。页面上贴的就是左边正在跑的那份，改一个 padding 两边同步变。
 */
import type { ComponentType } from "react";
import type { LayoutMeta, LayoutModule } from "./types";

export interface LayoutEntry {
  meta: LayoutMeta;
  Component: ComponentType;
  file: string;
  source: string;
}

const modules = import.meta.glob<LayoutModule>("./[0-9]*.tsx", { eager: true });
const sources = import.meta.glob<string>("./[0-9]*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const LAYOUTS: LayoutEntry[] = Object.entries(modules)
  .map(([path, mod]) => ({
    meta: mod.meta,
    Component: mod.default,
    file: path.replace(/^\.\//, ""),
    source: sources[path] ?? "",
  }))
  // 按文件名前缀排序：页面顺序 = 目录顺序，不受构建器枚举顺序影响
  .sort((a, b) => a.file.localeCompare(b.file));
