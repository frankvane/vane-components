/**
 * 逐项示例的共享舞台工厂
 *
 * 每个 `NN-slug.tsx` 只声明 `meta` 并导出 `makeStage("<Dir>Plugin")`，
 * 真正的装配集中在这里：一份 MAKERS 表把「插件目录名」映射成演示用装配函数，
 * 一份 baseProps 把控件值映射成 Core props，并统一挂事件日志。
 * 这样 20 个示例文件都是「数据」，不重复写 withAssetLibraryPlugins / SAMPLE_ASSETS。
 *
 * 需要宿主状态（上传后追加、收藏切换、操作回调）的页面不走工厂，
 * 用下面的 `useLibrary` 自己写 Stage —— 状态归页面管，插件只发请求。
 *
 * 注意文件名以 `_` 开头，`[0-9]*.tsx` 的 glob 不会把它当成一页。
 */
import { useMemo } from "react";
import { AssetLibraryCore, withAssetLibraryPlugins } from "vane-asset-library";
import type {
  AssetItem,
  AssetLibraryCoreProps,
  AssetPlugin,
} from "vane-asset-library";
import type { ComponentType } from "react";
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
import { SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";
import type { DemoCfg, DemoLog, DemoStageProps } from "./types";

export type Maker = (cfg: DemoCfg) => AssetPlugin;

const num = (cfg: DemoCfg, key: string, fallback: number) =>
  cfg[key] === undefined ? fallback : Number(cfg[key]);

const truthy = (cfg: DemoCfg, key: string, fallback = true) =>
  cfg[key] === undefined ? fallback : Boolean(cfg[key]);

export const MAKERS: Record<string, Maker> = {
  DropzonePlugin: (cfg) =>
    createDropzonePlugin({
      label: cfg.label === undefined ? "拖素材到这里，或点击选择" : String(cfg.label),
      multiple: truthy(cfg, "multiple"),
      accept: ["image/*", "video/*"],
    }),
  SearchPlugin: (cfg) =>
    createSearchPlugin({
      placeholder: "搜素材名 / 标签",
      hotkey: truthy(cfg, "hotkey"),
      debounce: num(cfg, "debounce", 180),
    }),
  KindFilterPlugin: (cfg) =>
    createKindFilterPlugin({
      allLabel: "全部",
      kinds:
        cfg.kinds === "both"
          ? undefined
          : [
              { kind: "image", label: "图片" },
              { kind: "video", label: "视频" },
            ],
    }),
  TagFilterPlugin: (cfg) =>
    createTagFilterPlugin({ max: num(cfg, "max", 6), sort: cfg.sort === "name" ? "name" : "count" }),
  FolderFilterPlugin: () => createFolderFilterPlugin({ allLabel: "全部素材", hideEmpty: false }),
  SortPlugin: () => createSortPlugin({}),
  ViewSwitchPlugin: (cfg) =>
    createViewSwitchPlugin({
      views: cfg.views === "grid" ? ["grid"] : ["grid", "list"],
    }),
  CountPlugin: (cfg) =>
    createCountPlugin({
      showTotal: truthy(cfg, "showTotal"),
      showVisible: truthy(cfg, "showVisible"),
      showSelected: truthy(cfg, "showSelected"),
    }),
  SelectAllPlugin: () => createSelectAllPlugin({}),
  SelectMarkPlugin: (cfg) => createSelectMarkPlugin({ showIndex: truthy(cfg, "showIndex") }),
  KindBadgePlugin: (cfg) =>
    createKindBadgePlugin(
      cfg.showFor === "both" ? {} : { labels: { video: "视频" }, showFor: ["video"] }
    ),
  DurationPlugin: () => createDurationPlugin({ fallback: true }),
  StatusBadgePlugin: () => createStatusBadgePlugin({}),
  FavoritePlugin: () => createFavoritePlugin({ action: "favorite" }),
  CardActionsPlugin: () =>
    createCardActionsPlugin({
      actions: [
        { action: "download", label: "下载", icon: "↓" },
        { action: "rename", label: "重命名", icon: "✎" },
        { action: "delete", label: "删除", icon: "×", tone: "danger" },
      ],
    }),
  MetaLinePlugin: (cfg) =>
    createMetaLinePlugin({
      show: cfg.fields === "size" ? ["size"] : ["size", "dimension", "folder"],
      maxTags: 2,
    }),
  BulkBarPlugin: () =>
    createBulkBarPlugin({
      // 文案里的 {n} 由插件替换成已选数量
      label: "已选 {n} 项",
      actions: [
        { action: "bulk:download", label: "批量下载" },
        { action: "bulk:move", label: "移动到…" },
        { action: "bulk:delete", label: "批量删除", tone: "danger" },
      ],
    }),
  PaginationPlugin: (cfg) =>
    createPaginationPlugin({
      pageSizes: cfg.sizes === "wide" ? [8, 16, 48] : [6, 12, 24],
    }),
  EmptyStatePlugin: () => createEmptyStatePlugin({}),
  LightBoxPlugin: () => createLightBoxPlugin({ arrows: true, restoreFocus: true }),
};

/** 控件值 → Core props。只处理出现在 cfg 里的键，其余用 Core 默认 */
export function baseProps(cfg: DemoCfg, log?: DemoLog): Partial<AssetLibraryCoreProps> {
  const props: Partial<AssetLibraryCoreProps> = {};
  if ("pageSize" in cfg) props.pageSize = num(cfg, "pageSize", 12);
  if ("maxSelected" in cfg) {
    const max = num(cfg, "maxSelected", 0);
    if (max > 0) props.maxSelected = max;
  }
  if ("multiple" in cfg) props.multiple = truthy(cfg, "multiple");
  if ("columnWidth" in cfg) props.columnWidth = num(cfg, "columnWidth", 176);
  if ("gap" in cfg) props.gap = num(cfg, "gap", 12);
  if (log) {
    props.onSelectionChange = (ids: string[], items: AssetItem[]) => {
      if (!ids.length) return log("选择已清空", "info");
      log(`选中 ${ids.length} 项：${items.map((i) => i.title ?? i.id).join(" / ")}`);
    };
    props.onItemActivate = (item) =>
      log(`激活 ${item.title ?? item.id}（双击 / Enter）`, "info");
  }
  return props;
}

/**
 * 装配 + 稳定化：
 * cfg 引用在控件变化时才变，依赖它即可 —— 无关重渲染（如写日志）不会重建组件类型，
 * 也就不会把整面墙卸了重挂。
 */
export function useLibrary(dir: string, cfg: DemoCfg) {
  return useMemo(() => {
    const maker = MAKERS[dir];
    if (!maker) throw new Error(`未注册的示例插件：${dir}`);
    return withAssetLibraryPlugins(AssetLibraryCore, [maker(cfg)]);
  }, [dir, cfg]);
}

export interface StageOptions {
  /** 换一套素材（大库 / 空库） */
  items?: AssetItem[];
  /** 额外 props，参数是当前控件值与日志函数 */
  bind?: (cfg: DemoCfg, log: DemoLog) => Partial<AssetLibraryCoreProps>;
}

export function makeStage(dir: string, options: StageOptions = {}): ComponentType<DemoStageProps> {
  if (!MAKERS[dir]) throw new Error(`未注册的示例插件：${dir}`);
  const items = options.items ?? SAMPLE_ASSETS;

  return function Stage({ cfg, log }: DemoStageProps) {
    const Library = useLibrary(dir, cfg);
    const extra = options.bind?.(cfg, log) ?? {};
    return (
      <div className="stage">
        <Library items={items} folders={SAMPLE_FOLDERS} {...baseProps(cfg, log)} {...extra} />
      </div>
    );
  };
}
