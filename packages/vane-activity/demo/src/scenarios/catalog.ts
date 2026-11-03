/**
 * 场景库注册表（场景示例页数据源）
 *
 * 跟 `demos/registry.ts` 同一套路：两个 glob 指向同一批文件，一份拿组件、一份拿
 * `?raw` 原文 —— 场景卡里展示并复制的代码，就是正在跑的那个文件本身，零手抄。
 *
 * 插件清单也不手写：从源码里正则提取 `custom-plugins/XxxPlugin`，再按 priority
 * 排序，于是卡上「装配清单」永远不会和文件里的 withPlugins 数组对不上。
 */
import type { ComponentType } from "react";
import { PLUGIN_BY_DIR } from "../data/plugins";

export interface ScenarioMeta {
  id: string;
  title: string;
  group: string;
  blurb: string;
  /** 用的哪份数据、加权进度算到多少 —— 直接写在卡上，不让人自己算 */
  dataNote: string;
}

/** `import.meta.glob` 拿到的场景模块形状 */
export interface ScenarioModule {
  meta: ScenarioMeta;
  default: ComponentType;
}

export interface ScenarioEntry {
  meta: ScenarioMeta;
  /** 场景自身的组件（内部已装配好插件并渲染），卡片直接挂载 */
  Stage: ComponentType;
  /** 文件名，如 "01-signin.tsx" */
  file: string;
  /** 该文件的完整源码（`?raw`），卡片内展示 + 一键复制 */
  source: string;
  /** 装配清单：从源码提取、按 priority 升序，即真实执行顺序 */
  plugs: string[];
}

const modules = import.meta.glob<ScenarioModule>("./[0-9]*.tsx", { eager: true });
const sources = import.meta.glob<string>("./[0-9]*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

const fileOf = (path: string) => path.replace(/^\.\//, "");

function plugsOf(source: string): string[] {
  const dirs = Array.from(
    new Set(
      Array.from(source.matchAll(/custom-plugins\/([A-Za-z]+Plugin)/g)).map((m) => m[1])
    )
  );
  return dirs.sort(
    (a, b) => (PLUGIN_BY_DIR.get(a)?.priority ?? 0) - (PLUGIN_BY_DIR.get(b)?.priority ?? 0)
  );
}

export const SCENARIOS: ScenarioEntry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const source = sources[path] ?? "";
    return {
      meta: mod.meta,
      Stage: mod.default,
      file: fileOf(path),
      source,
      plugs: plugsOf(source),
    };
  })
  .sort((a, b) => a.file.localeCompare(b.file));

/** 场景分组（供顶部 tab 过滤） */
export const GROUPS: string[] = Array.from(new Set(SCENARIOS.map((s) => s.meta.group)));

/** 全部场景用到的插件（去重，供页头统计） */
export const USED_PLUGINS: string[] = Array.from(
  new Set(SCENARIOS.flatMap((s) => s.plugs))
);
