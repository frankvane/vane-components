import type React from "react";
import type {
  Plugin,
  PluginContext,
  PluginCreator,
  PluginHooks,
} from "vane-plugin-core";

/**
 * vane-asset-library 领域类型层。
 *
 * 内核 vane-plugin-core 提供 PluginContext / PluginHooks / Plugin 等通用类型；
 * 这里只声明「素材库」领域差异：素材数据模型、筛选/排序/选择状态、槽位集合。
 *
 * 约定：领域钩子一律用「方法语法」声明参数，内核把 context 收窄为领域上下文时
 * 才能通过方法参数双变性校验（strictFunctionTypes 下箭头函数属性会因逆变被拒）。
 */

// ============ 领域数据 ============

export type AssetKind = "image" | "video";
export type AssetStatus = "ready" | "processing" | "failed";
export type AssetSortKey = "name" | "createdAt" | "size" | "duration";
export type AssetSortDir = "asc" | "desc";
export type AssetView = "grid" | "list";
/** 空态原因：库本身没有素材 / 当前筛选条件无命中 */
export type AssetEmptyReason = "empty" | "filtered";

export interface AssetItem {
  /** 稳定唯一键；缺失或重复会在归一化阶段丢弃并告警 */
  id: string;
  kind: AssetKind;
  /** 原图 / 视频地址 */
  src: string;
  /** 缩略图；视频强烈建议提供，缺省时卡片显示占位块 */
  thumbnail?: string;
  /** 展示名；缺省回落到 src 的文件名，再缺省用 id */
  title?: string;
  width?: number;
  height?: number;
  /** 时长（秒），仅 video */
  duration?: number;
  /** 文件体积（字节） */
  size?: number;
  mimeType?: string;
  tags?: string[];
  folderId?: string | null;
  folderName?: string;
  /** 接受字符串 / 数字 / Date，内部统一成毫秒时间戳 */
  createdAt?: string | number | Date;
  /** 缺省视为 ready */
  status?: AssetStatus;
  favorite?: boolean;
  owner?: string;
  /** 宿主自定义字段，插件原样透传 */
  meta?: Record<string, unknown>;
}

export interface AssetFolder {
  id: string;
  name: string;
  /** 可选：宿主已算好的数量；不传时由 items 现算 */
  count?: number;
}

/** 筛选条件（不含排序与分页） */
export interface AssetFilter {
  query: string;
  kinds: AssetKind[];
  tags: string[];
  folderId: string | null;
}

export interface AssetSort {
  key: AssetSortKey;
  dir: AssetSortDir;
}

/** 内核可写状态（withAssetLibraryPlugins 内的唯一真相） */
export interface AssetLibraryState extends AssetFilter {
  /** 排序字段（对应 AssetSort.key） */
  sortKey: AssetSortKey;
  /** 排序方向（对应 AssetSort.dir） */
  sortDir: AssetSortDir;
  view: AssetView;
  page: number;
  pageSize: number;
  /** 有序：勾选顺序，SelectMark 的序号依赖它 */
  selectedIds: string[];
  /** 键盘焦点卡片 */
  activeId: string | null;
  /** LightBox 打开的素材 id */
  previewId: string | null;
}

// ============ 卡片视图模型（Core 只读这个，保持内核薄） ============

export interface AssetCardView {
  item: AssetItem;
  /** 在可见集中的下标 */
  index: number;
  selected: boolean;
  /** status === "ready" */
  selectable: boolean;
  /** 可选但已达选择上限 */
  blocked: boolean;
  active: boolean;
}

// ============ 槽位 ============

/**
 * 槽位由 withAssetLibraryPlugins 组装后注入 Core，让 Core 精确控制顺序：
 * dropzone → toolbar → 网格(cardOverlay / cardActions / cardMeta) → empty → footer → overlay
 */
export interface AssetSlots {
  dropzone: React.ReactNode[];
  toolbar: React.ReactNode[];
  footer: React.ReactNode[];
  overlay: React.ReactNode[];
  /** 单值槽：空态文案，最多一个节点 */
  empty: React.ReactNode[];
  cardOverlay: (item: AssetItem, index: number) => React.ReactNode[];
  cardActions: (item: AssetItem, index: number) => React.ReactNode[];
  cardMeta: (item: AssetItem, index: number) => React.ReactNode[];
}

/** 空槽常量：没有插件时 Core 拿到稳定空数组，避免每次渲染新建引用 */
export const EMPTY_SLOTS: AssetSlots = {
  dropzone: [],
  toolbar: [],
  footer: [],
  overlay: [],
  empty: [],
  cardOverlay: () => [],
  cardActions: () => [],
  cardMeta: () => [],
};

// ============ Core props / ref ============

/**
 * 组装组件对外 props。带【注入】注释的字段由 withAssetLibraryPlugins 计算后写入，
 * 宿主不该传（传了也会被装配器的计算结果覆盖）。
 */
export interface AssetLibraryCoreProps {
  // ---------- 宿主入参 ----------
  /** 全量素材（Core 不直接渲染它；由装配器归一化 + 过滤 + 分页后以 cards 注入） */
  items: AssetItem[];
  folders?: AssetFolder[];
  /** 受控选择：传了就以此为准，点击只回传 onSelectionChange */
  selectedIds?: string[];
  /** 非受控初值，只生效一次 */
  defaultSelectedIds?: string[];
  /** 选择上限；0 / 不传 = 不限 */
  maxSelected?: number;
  /** 多选；false 时点击即单选替换 */
  multiple?: boolean;
  /** 每页条数；0 表示不分页 */
  pageSize?: number;
  initialSort?: AssetSort;
  initialView?: AssetView;
  /** 网格基准列宽（px），列数由容器宽度自动推导 */
  columnWidth?: number;
  gap?: number;
  onSelectionChange?: (ids: string[], items: AssetItem[]) => void;
  /** 双击 / Enter 激活 */
  onItemActivate?: (item: AssetItem) => void;
  /** dropzone 收集到文件 */
  onUpload?: (files: File[]) => void;
  /** 卡片操作 / 批量操作交回宿主（action 自定义，如 "delete" / "download" / "rename"） */
  onAssetAction?: (action: string, payload: { id?: string; ids?: string[] }) => void;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  onMount?: () => void;
  onUnmount?: () => void;
  debug?: boolean;
  /** 由装配器注入，插件通过 ctx.refs.container 拿到同一个引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;

  // ---------- 【注入】装配器写入，Core 只读 ----------
  /** 当前页可见卡片 */
  cards?: AssetCardView[];
  slots?: AssetSlots;
  /** 空态原因，供 Core 的兜底文案分叉 */
  emptyReason?: AssetEmptyReason | null;
  /** 视图模式（props.view 受控优先，否则取内核 state） */
  view?: AssetView;
  /** 当前页（1-based） */
  page?: number;
  onToggleCard?: (id: string) => void;
  onActivateCard?: (id: string) => void;
  onFocusCard?: (id: string) => void;
}

export interface AssetLibraryCoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
  /** 当前选中 id（有序） */
  getSelection: () => string[];
  /** 当前页可见 id */
  getVisibleIds: () => string[];
}

// ============ 插件上下文 ============

/**
 * 素材库插件上下文：内核 PluginContext 已带 props / data / bus / refs / state /
 * setState / shared / deviceInfo / forceUpdate / getSize / logger；这里补领域字段。
 *
 * 插件读数据请一律用这里的归一化字段（items / filtered / visible），不要读 props.items：
 * props 是宿主原始入参，可能缺 id、status 非法、重复。
 */
export interface AssetLibraryContext
  extends PluginContext<AssetLibraryCoreProps, unknown> {
  /** 归一化后的全量素材 */
  items: AssetItem[];
  folders: AssetFolder[];
  /** 过滤 + 排序后（不含分页） */
  filtered: AssetItem[];
  /** 当前页 */
  visible: AssetItem[];
  total: number;
  emptyReason: AssetEmptyReason | null;

  query: string;
  kinds: AssetKind[];
  tags: string[];
  folderId: string | null;
  setQuery: (query: string) => void;
  toggleKind: (kind: AssetKind) => void;
  setKinds: (kinds: AssetKind[]) => void;
  toggleTag: (tag: string) => void;
  setTags: (tags: string[]) => void;
  setFolder: (folderId: string | null) => void;
  clearFilters: () => void;
  hasFilters: boolean;

  sortKey: AssetSortKey;
  sortDir: AssetSortDir;
  setSort: (key: AssetSortKey, dir?: AssetSortDir) => void;

  view: AssetView;
  setView: (view: AssetView) => void;

  page: number;
  pageSize: number;
  pageCount: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  /** 选中 id（有序） */
  selectedIds: string[];
  selectedItems: AssetItem[];
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  selectAllVisible: () => void;
  clearSelection: () => void;
  /** 0 = 不限 */
  maxSelected: number;
  isSelectable: (item: AssetItem) => boolean;
  /** 可选但已达上限（已选项永远允许取消） */
  isBlocked: (item: AssetItem) => boolean;

  activeId: string | null;
  setActiveId: (id: string | null) => void;

  /** 请求宿主上传（dropzone 收集到文件后调用） */
  requestUpload: (files: File[]) => void;
  /** 请求宿主处理素材操作（card-actions / bulk-bar 用） */
  requestAction: (action: string, payload: { id?: string; ids?: string[] }) => void;
  /** 打开 / 关闭大图预览 */
  previewId: string | null;
  openPreview: (id: string) => void;
  closePreview: () => void;
}

// ============ 插件钩子 ============

/**
 * 槽位分布（priority 建议区间，避免撞车）：
 *   renderDropzone    5–9
 *   renderToolbar     10–19
 *   renderCardOverlay 20–24
 *   renderCardActions 25–29
 *   renderCardMeta    25–29（与 actions 不同槽，可重叠）
 *   renderFooter      30–39
 *   renderEmpty       40–44（单值槽）
 *   renderOverlay     45–49
 */
export interface AssetPluginHooks
  extends PluginHooks<AssetLibraryCoreProps, unknown> {
  renderDropzone?(context: AssetLibraryContext): React.ReactNode;
  renderToolbar?(context: AssetLibraryContext): React.ReactNode;
  renderCardOverlay?(
    context: AssetLibraryContext,
    item: AssetItem,
    index: number
  ): React.ReactNode;
  renderCardActions?(
    context: AssetLibraryContext,
    item: AssetItem,
    index: number
  ): React.ReactNode;
  renderCardMeta?(
    context: AssetLibraryContext,
    item: AssetItem,
    index: number
  ): React.ReactNode;
  renderFooter?(context: AssetLibraryContext): React.ReactNode;
  renderEmpty?(
    context: AssetLibraryContext,
    reason: AssetEmptyReason
  ): React.ReactNode;
  renderOverlay?(context: AssetLibraryContext): React.ReactNode;

  /** 选择变化（宿主回调之外的插件观察点） */
  onSelectionChange?(
    context: AssetLibraryContext,
    ids: string[],
    items: AssetItem[]
  ): void;
  /** 双击 / Enter 激活素材 */
  onAssetActivate?(context: AssetLibraryContext, item: AssetItem): void;
  /** dropzone 收集到文件 */
  onUploadRequest?(context: AssetLibraryContext, files: File[]): void;
}

// ============ 插件定义 ============

export interface AssetPlugin extends Plugin<AssetLibraryCoreProps, unknown> {
  hooks: AssetPluginHooks;
}

/** 工厂 Config 泛型默认值用 unknown：配置对象可选，实参位再收窄 */
export type AssetPluginCreator<Config = unknown> = PluginCreator<
  Config,
  AssetLibraryCoreProps,
  unknown
>;

/** 装饰累积槽（多插件输出按顺序拼接） */
export const DECORATIVE_SLOTS = [
  "renderDropzone",
  "renderToolbar",
  "renderCardOverlay",
  "renderCardActions",
  "renderCardMeta",
  "renderFooter",
  "renderOverlay",
] as const;

export type DecorativeSlot = (typeof DECORATIVE_SLOTS)[number];
