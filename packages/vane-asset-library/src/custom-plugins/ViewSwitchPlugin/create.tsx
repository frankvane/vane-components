/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
  AssetView,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { Chip } from "../_shared/ui";
import doc from "./doc.json";

/**
 * ViewSwitchPlugin — 网格 / 列表切换。
 *
 * 只切 view 状态；两种视图的布局由 components.css 的 data-view 选择器负责，
 * 插件不碰 DOM 结构，也不复制卡片渲染逻辑。
 */
export interface ViewSwitchConfig {
  views?: AssetView[];
  labels?: Partial<Record<AssetView, string>>;
}

const DEFAULT_VIEWS: AssetView[] = ["grid", "list"];
const DEFAULT_LABELS: Record<AssetView, string> = { grid: "网格", list: "列表" };

function ViewSwitchView({
  ctx,
  views,
  labels,
}: {
  ctx: AssetLibraryContext;
  views: AssetView[];
  labels: Record<AssetView, string>;
}) {
  return (
    <div className="vc-asset-toolbar" role="group" aria-label="视图切换">
      {views.map((view) => (
        <Chip key={view} active={ctx.view === view} onClick={() => ctx.setView(view)}>
          {labels[view]}
        </Chip>
      ))}
    </div>
  );
}

export const createViewSwitchPlugin: AssetPluginCreator<ViewSwitchConfig> = (
  config = {}
) => {
  const views = config.views?.length ? config.views : DEFAULT_VIEWS;
  const labels = { ...DEFAULT_LABELS, ...config.labels };

  return {
    name: "view-switch",
    version: "0.1.0",
    description: doc.description,
    priority: 15,
    config,
    hooks: {
      renderToolbar: (context) => (
        <ViewSwitchView ctx={context} views={views} labels={labels} />
      ),
    },
  } satisfies AssetPlugin;
};

createViewSwitchPlugin.meta = doc as PluginDoc;
