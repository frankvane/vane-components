/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 场景），docs:plugins 的同一份数据；
 *  2. `create.ts(x)` —— `?raw` 读源码，正则取 priority（工坊按真实 priority 展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
import type { AssetLibraryCoreProps, AssetPlugin } from "vane-asset-library";
import {
  createBulkBarPlugin,
  createCardActionsPlugin,
  createCountPlugin,
  createDropzonePlugin,
  createDurationPlugin,
  createEmptyStatePlugin,
  createFavoritePlugin,
  createFolderFilterPlugin,
  createKindBadgePlugin,
  createKindFilterPlugin,
  createLightBoxPlugin,
  createMetaLinePlugin,
  createPaginationPlugin,
  createSearchPlugin,
  createSelectAllPlugin,
  createSelectMarkPlugin,
  createSortPlugin,
  createStatusBadgePlugin,
  createTagFilterPlugin,
  createViewSwitchPlugin,
} from "vane-asset-library/custom-plugins";

export type PluginGroup = "filter" | "card" | "batch" | "flow";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  filter: "筛选与浏览",
  card: "卡片增强",
  batch: "批量与分页",
  flow: "上传与预览",
};

export const GROUP_ORDER: PluginGroup[] = ["filter", "card", "batch", "flow"];

export interface PluginDocShape {
  name: string;
  description: string;
  since?: string;
  tags?: string[];
  config?: Array<{ name: string; type: string; default: string; description: string }>;
  example?: string;
  features?: string[];
  useCases?: string[];
}

export interface PluginInfo {
  /** 目录名，如 SearchPlugin */
  dir: string;
  /** 工厂名，如 createSearchPlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  make: () => AssetPlugin;
}

const DOCS = import.meta.glob<PluginDocShape>("/src/custom-plugins/*/doc.json", {
  eager: true,
  import: "default",
});

const RAW = import.meta.glob<string>("/src/custom-plugins/*/create.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

const dirOf = (path: string) =>
  path.replace(/^.*\/custom-plugins\//, "").replace(/\/.*$/, "");

function priorityOf(dir: string): number {
  const path = Object.keys(RAW).find((p) => dirOf(p) === dir);
  const src = path ? RAW[path] : "";
  const match = /priority:\s*(\d+)/.exec(src);
  return match ? Number(match[1]) : 0;
}

function docOf(dir: string): PluginDocShape {
  const path = Object.keys(DOCS).find((p) => dirOf(p) === dir);
  return path ? DOCS[path] : { name: dir, description: "（缺少 doc.json）" };
}

type Def = { dir: string; group: PluginGroup; make: () => AssetPlugin };

const DEFS: Def[] = [
  // ---------- filter ----------
  { dir: "SearchPlugin", group: "filter", make: () => createSearchPlugin({}) },
  { dir: "KindFilterPlugin", group: "filter", make: () => createKindFilterPlugin({}) },
  { dir: "TagFilterPlugin", group: "filter", make: () => createTagFilterPlugin({ max: 6 }) },
  { dir: "FolderFilterPlugin", group: "filter", make: () => createFolderFilterPlugin({}) },
  { dir: "SortPlugin", group: "filter", make: () => createSortPlugin({}) },
  { dir: "ViewSwitchPlugin", group: "filter", make: () => createViewSwitchPlugin({}) },
  { dir: "CountPlugin", group: "filter", make: () => createCountPlugin({}) },
  { dir: "SelectAllPlugin", group: "filter", make: () => createSelectAllPlugin({}) },

  // ---------- card ----------
  { dir: "SelectMarkPlugin", group: "card", make: () => createSelectMarkPlugin({}) },
  { dir: "KindBadgePlugin", group: "card", make: () => createKindBadgePlugin({}) },
  { dir: "DurationPlugin", group: "card", make: () => createDurationPlugin({ fallback: true }) },
  { dir: "StatusBadgePlugin", group: "card", make: () => createStatusBadgePlugin({}) },
  { dir: "FavoritePlugin", group: "card", make: () => createFavoritePlugin({}) },
  { dir: "CardActionsPlugin", group: "card", make: () => createCardActionsPlugin({}) },
  {
    dir: "MetaLinePlugin",
    group: "card",
    make: () => createMetaLinePlugin({ show: ["size", "dimension", "folder"] }),
  },

  // ---------- batch ----------
  { dir: "BulkBarPlugin", group: "batch", make: () => createBulkBarPlugin({}) },
  { dir: "PaginationPlugin", group: "batch", make: () => createPaginationPlugin({}) },

  // ---------- flow ----------
  { dir: "DropzonePlugin", group: "flow", make: () => createDropzonePlugin({}) },
  { dir: "EmptyStatePlugin", group: "flow", make: () => createEmptyStatePlugin({}) },
  { dir: "LightBoxPlugin", group: "flow", make: () => createLightBoxPlugin({}) },
];

export const PLUGINS: PluginInfo[] = DEFS.map((def) => {
  const doc = docOf(def.dir);
  return {
    dir: def.dir,
    factory: `create${def.dir.replace(/Plugin$/, "")}Plugin`,
    group: def.group,
    priority: priorityOf(def.dir),
    summary: doc.description,
    doc,
    make: def.make,
  };
}).sort(
  (a, b) =>
    GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.priority - b.priority
);

/** 默认勾选：够看出「一个能用的素材库」全貌，又不互相干扰 */
export const DEFAULT_ON = [
  "SearchPlugin",
  "KindFilterPlugin",
  "SortPlugin",
  "CountPlugin",
  "ViewSwitchPlugin",
  "SelectMarkPlugin",
  "KindBadgePlugin",
  "MetaLinePlugin",
  "PaginationPlugin",
  "EmptyStatePlugin",
];

/** 插件工坊的「试装」舞台 props：只给最小必需项 */
export const STAGE_PROPS: Pick<AssetLibraryCoreProps, "multiple" | "pageSize"> = {
  multiple: true,
  pageSize: 8,
};
