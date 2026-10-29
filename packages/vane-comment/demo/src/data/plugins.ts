/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 坑位），与插件一同发布；
 *  2. `create.tsx`   —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
import type { CommentPlugin } from "vane-comment";
import { createLikePlugin } from "vane-comment/custom-plugins/LikePlugin";
import { createSortPlugin } from "vane-comment/custom-plugins/SortPlugin";
import { createThreadPlugin } from "vane-comment/custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "vane-comment/custom-plugins/RichComposerPlugin";
import { createReportPlugin } from "vane-comment/custom-plugins/ReportPlugin";
import { createSharePlugin } from "vane-comment/custom-plugins/SharePlugin";
import { createCopyPlugin } from "vane-comment/custom-plugins/CopyPlugin";
import { createReactionPlugin } from "vane-comment/custom-plugins/ReactionPlugin";
import { createFavoritePlugin } from "vane-comment/custom-plugins/FavoritePlugin";
import { createPinPlugin } from "vane-comment/custom-plugins/PinPlugin";
import { createLocationPlugin } from "vane-comment/custom-plugins/LocationPlugin";
import { createTimestampPlugin } from "vane-comment/custom-plugins/TimestampPlugin";
import { createCountPlugin } from "vane-comment/custom-plugins/CountPlugin";
import { createFilterPlugin } from "vane-comment/custom-plugins/FilterPlugin";
import { createSearchPlugin } from "vane-comment/custom-plugins/SearchPlugin";
import { createModerationPlugin } from "vane-comment/custom-plugins/ModerationPlugin";
import { createLoginPromptPlugin } from "vane-comment/custom-plugins/LoginPromptPlugin";

export type PluginGroup = "engage" | "organize" | "compose";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  engage: "互动",
  organize: "组织",
  compose: "编辑",
};

export const GROUP_ORDER: PluginGroup[] = ["engage", "organize", "compose"];

export interface PluginDocShape {
  name: string;
  description: string;
  since?: string;
  config?: Array<{ name: string; type: string; default: string; description: string }>;
  features?: string[];
  useCases?: string[];
  notes?: string[];
}

export interface PluginInfo {
  /** 目录名，同时是插件 name，如 LikePlugin */
  dir: string;
  /** 工厂名，如 createLikePlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 演示用配置；勾选后用它装配 */
  make: () => CommentPlugin;
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
  const m = /priority:\s*(\d+)/.exec(src);
  return m ? Number(m[1]) : 0;
}

function docOf(dir: string): PluginDocShape {
  const path = Object.keys(DOCS).find((p) => dirOf(p) === dir);
  return path ? DOCS[path] : { name: dir, description: "（缺少 doc.json）" };
}

type Def = {
  dir: string;
  group: PluginGroup;
  make: () => CommentPlugin;
};

const DEFS: Def[] = [
  // ---------- engage：互动（逐条操作行） ----------
  {
    dir: "LikePlugin",
    group: "engage",
    make: () => createLikePlugin(),
  },
  {
    dir: "ThreadPlugin",
    group: "engage",
    make: () => createThreadPlugin({ maxDepth: 3 }),
  },
  {
    dir: "ReportPlugin",
    group: "engage",
    make: () => createReportPlugin(),
  },
  {
    dir: "SharePlugin",
    group: "engage",
    make: () => createSharePlugin(),
  },
  {
    dir: "CopyPlugin",
    group: "engage",
    make: () => createCopyPlugin(),
  },
  {
    dir: "ReactionPlugin",
    group: "engage",
    make: () => createReactionPlugin(),
  },
  {
    dir: "FavoritePlugin",
    group: "engage",
    make: () => createFavoritePlugin(),
  },
  {
    dir: "PinPlugin",
    group: "engage",
    make: () => createPinPlugin(),
  },
  {
    dir: "LocationPlugin",
    group: "engage",
    make: () => createLocationPlugin(),
  },
  {
    dir: "TimestampPlugin",
    group: "engage",
    make: () => createTimestampPlugin(),
  },

  // ---------- organize：组织（顶栏 / 数据级） ----------
  {
    dir: "SortPlugin",
    group: "organize",
    make: () => createSortPlugin(),
  },
  {
    dir: "CountPlugin",
    group: "organize",
    make: () => createCountPlugin(),
  },
  {
    dir: "FilterPlugin",
    group: "organize",
    make: () => createFilterPlugin(),
  },
  {
    dir: "SearchPlugin",
    group: "organize",
    make: () => createSearchPlugin(),
  },
  {
    dir: "ModerationPlugin",
    group: "organize",
    make: () => createModerationPlugin(),
  },

  // ---------- compose：编辑（底部） ----------
  {
    dir: "RichComposerPlugin",
    group: "compose",
    make: () =>
      createRichComposerPlugin({ features: { emoji: true, image: true, mention: true } }),
  },
  {
    dir: "LoginPromptPlugin",
    group: "compose",
    make: () => createLoginPromptPlugin(),
  },
];

export const PLUGINS: PluginInfo[] = DEFS.map((def) => {
  const doc = docOf(def.dir);
  return {
    dir: def.dir,
    factory: `create${def.dir}Plugin`,
    group: def.group,
    priority: priorityOf(def.dir),
    summary: doc.description,
    doc,
    make: def.make,
  };
}).sort(
  (a, b) =>
    GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || b.priority - a.priority
);

/** 默认勾选：全部 17 个 —— 工坊的乐趣就是逐个取消，看每件长尾的代价 */
export const DEFAULT_ON = PLUGINS.map((p) => p.dir);
