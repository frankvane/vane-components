/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 坑位），由迁移脚本生成；
 *  2. `create.ts(x)` —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 *     26 个工厂的签名差异太大（有的必填对象、有的必填函数），没法自动生成。
 */
import type { WaterfallPlugin } from "vane-waterfall";
import {
  createA11yPlugin,
  createAlignmentPlugin,
  createAutoColumnPlugin,
  createBookmarkPlugin,
  createClickAnalyticsPlugin,
  createDebounceLayoutPlugin,
  createDragReorderPlugin,
  createFilterPlugin,
  createFixedHeightPlugin,
  createGapPlugin,
  createGroupingPlugin,
  createHeatmapAnalyticsPlugin,
  createInfiniteScrollPlugin,
  createPaginationPlugin,
  createPinItemPlugin,
  createRecyclePlugin,
  createReducedMotionPlugin,
  createResponsiveColumnsPlugin,
  createScrollAnchorPlugin,
  createSearchPlugin,
  createSortPlugin,
  createStatePersistencePlugin,
  createStickyHeaderPlugin,
  createThrottlePlugin,
  createTransitionPlugin,
  createURLSyncPlugin,
} from "vane-waterfall/custom-plugins";
import type { SeedCard } from "./seed";

export type PluginGroup = "layout" | "perf" | "data" | "interaction" | "ui";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  layout: "布局",
  perf: "性能与动效",
  data: "数据管线",
  interaction: "交互与埋点",
  ui: "语义与状态",
};

export const GROUP_ORDER: PluginGroup[] = ["layout", "perf", "data", "interaction", "ui"];

export interface PluginDocShape {
  name: string;
  description: string;
  since?: string;
  tags?: string[];
  config?: Array<{ name: string; type: string; default: string; description: string }>;
  example?: string;
  features?: string[];
  useCases?: string[];
  notes?: string[];
}

export interface PluginInfo {
  /** 目录名，同时是插件 name，如 FilterPlugin */
  dir: string;
  /** 工厂名，如 createFilterPlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 演示用配置；勾选后用它装配 */
  make: () => WaterfallPlugin<SeedCard>;
}

const DOCS = import.meta.glob<PluginDocShape>("/src/custom-plugins/*/doc.json", {
  eager: true,
  import: "default",
});
const RAW_TS = import.meta.glob<string>("/src/custom-plugins/*/create.ts", {
  eager: true,
  query: "?raw",
  import: "default",
});
const RAW_TSX = import.meta.glob<string>("/src/custom-plugins/*/create.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});
const RAW = { ...RAW_TS, ...RAW_TSX };

const dirOf = (path: string) => path.replace(/^.*\/custom-plugins\//, "").replace(/\/.*$/, "");

function priorityOf(dir: string): number {
  const path = Object.keys(RAW).find((p) => dirOf(p) === dir);
  const src = path ? RAW[path] : "";
  const m = /priority:\s*(\d+)/.exec(src);
  return m ? Number(m[1]) : 0;
}

function docOf(dir: string): PluginDocShape {
  const path = Object.keys(DOCS).find((p) => dirOf(p) === dir);
  return path
    ? DOCS[path]
    : { name: dir, description: "（缺少 doc.json）" };
}

type Def = {
  dir: string;
  group: PluginGroup;
  make: () => WaterfallPlugin<SeedCard>;
};

const DEFS: Def[] = [
  // ---------- layout ----------
  { dir: "AutoColumnPlugin", group: "layout", make: () => createAutoColumnPlugin({ minColumnWidth: 200, maxColumns: 4 }) },
  { dir: "ResponsiveColumnsPlugin", group: "layout", make: () => createResponsiveColumnsPlugin({ breakpoints: { sm: { width: 0, columns: 2 }, md: { width: 700, columns: 3 }, lg: { width: 1020, columns: 4 } } }) },
  { dir: "AlignmentPlugin", group: "layout", make: () => createAlignmentPlugin({ mode: "shortest" }) },
  { dir: "GapPlugin", group: "layout", make: () => createGapPlugin({ columnGap: 14, rowGap: 14 }) },
  { dir: "FixedHeightPlugin", group: "layout", make: () => createFixedHeightPlugin({ itemHeight: 180 }) },
  { dir: "PinItemPlugin", group: "layout", make: () => createPinItemPlugin({ pinnedIndices: [0], column: 0 }) },

  // ---------- perf ----------
  { dir: "ThrottlePlugin", group: "perf", make: () => createThrottlePlugin({ scroll: 16, resize: 120 }) },
  { dir: "DebounceLayoutPlugin", group: "perf", make: () => createDebounceLayoutPlugin({ delay: 160 }) },
  { dir: "TransitionPlugin", group: "perf", make: () => createTransitionPlugin({ duration: 240 }) },
  { dir: "ReducedMotionPlugin", group: "perf", make: () => createReducedMotionPlugin() },

  // ---------- data ----------
  { dir: "FilterPlugin", group: "data", make: () => createFilterPlugin<SeedCard>({ predicate: (item) => item.price <= 500 }) },
  { dir: "SortPlugin", group: "data", make: () => createSortPlugin<SeedCard>({ comparator: (a, b) => b.likes - a.likes }) },
  { dir: "SearchPlugin", group: "data", make: () => createSearchPlugin<SeedCard>({ fields: ["title", "author"] }) },
  { dir: "PaginationPlugin", group: "data", make: () => createPaginationPlugin({ pageSize: 18 }) },
  { dir: "InfiniteScrollPlugin", group: "data", make: () => createInfiniteScrollPlugin({ threshold: 400 }) },

  // ---------- interaction ----------
  { dir: "ClickAnalyticsPlugin", group: "interaction", make: () => createClickAnalyticsPlugin({ showOverlay: true }) },
  { dir: "HeatmapAnalyticsPlugin", group: "interaction", make: () => createHeatmapAnalyticsPlugin({ showOverlay: true }) },
  { dir: "DragReorderPlugin", group: "interaction", make: () => createDragReorderPlugin<SeedCard>({ showHandle: true }) },
  { dir: "ScrollAnchorPlugin", group: "interaction", make: () => createScrollAnchorPlugin<SeedCard>({}) },
  { dir: "RecyclePlugin", group: "interaction", make: () => createRecyclePlugin({ poolSize: 24 }) },

  // ---------- ui ----------
  { dir: "A11yPlugin", group: "ui", make: () => createA11yPlugin({ enableTabIndex: false }) },
  { dir: "GroupingPlugin", group: "ui", make: () => createGroupingPlugin<SeedCard>({ groupBy: (item) => item.tag }) },
  { dir: "StickyHeaderPlugin", group: "ui", make: () => createStickyHeaderPlugin({ title: "工坊预览" }) },
  { dir: "BookmarkPlugin", group: "ui", make: () => createBookmarkPlugin({ storageKey: "demo-workshop-bookmark" }) },
  { dir: "StatePersistencePlugin", group: "ui", make: () => createStatePersistencePlugin({ storageKey: "demo-workshop-state", persistScroll: true }) },
  { dir: "URLSyncPlugin", group: "ui", make: () => createURLSyncPlugin({ mode: "search", keys: ["searchQuery"] }) },
];

export const PLUGINS: PluginInfo[] = DEFS.map((def) => {
  const doc = docOf(def.dir);
  return {
    dir: def.dir,
    factory: `create${def.dir}`,
    group: def.group,
    priority: priorityOf(def.dir),
    summary: doc.description,
    doc,
    make: def.make,
  };
}).sort((a, b) => (GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)) || b.priority - a.priority);

/** 互斥关系：同开会让「看起来能用但其实不生效」或互相覆盖 */
export const CONFLICTS: Array<{ a: string; b: string; why: string }> = [
  { a: "AutoColumnPlugin", b: "ResponsiveColumnsPlugin", why: "两者都改列数，AutoColumn 按最小列宽算、Responsive 按断点表算，同时开会交替覆盖" },
  { a: "TransitionPlugin", b: "ReducedMotionPlugin", why: "ReducedMotion 会去掉过渡，同开等于把 Transition 关掉（不是错误，但别指望有动效）" },
  { a: "InfiniteScrollPlugin", b: "PaginationPlugin", why: "一个追加、一个切片，叠在一起会出现「翻到第 2 页又看到第 1 页」" },
  { a: "RecyclePlugin", b: "virtualize", why: "Recycle 改 visibility、virtualize 直接卸载 DOM，同开互相打架" },
];

/** 默认勾选：够看出瀑布流，又不至于一上来就互相干扰 */
export const DEFAULT_ON = ["AutoColumnPlugin", "GapPlugin", "TransitionPlugin", "A11yPlugin"];
