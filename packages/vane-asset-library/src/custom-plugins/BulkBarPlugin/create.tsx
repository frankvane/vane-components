/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import doc from "./doc.json";

/**
 * BulkBarPlugin — 批量操作条（页脚）。
 *
 * 未选择时不渲染任何东西：页脚空占一行会把网格往下推 30px，页面会「跳」。
 * 所有操作名带 `bulk:` 前缀，宿主据此区分「单卡操作」与「批量操作」，
 * 不必猜 payload 里的 id 是单个还是数组。
 */
export interface BulkAction {
  action: string;
  label: string;
  tone?: "default" | "danger";
}

export interface BulkBarConfig {
  actions?: BulkAction[];
  /** 已选文案，`{n}` 会被替换成数量 */
  label?: string;
}

const DEFAULT_ACTIONS: BulkAction[] = [
  { action: "bulk:download", label: "批量下载" },
  { action: "bulk:delete", label: "批量删除", tone: "danger" },
];

function BulkBarView({
  ctx,
  actions,
  label,
}: {
  ctx: AssetLibraryContext;
  actions: BulkAction[];
  label: string;
}) {
  const count = ctx.selectedIds.length;
  if (!count) return null;

  return (
    <div className="vc-asset-footer" role="region" aria-label="批量操作">
      <span className="vc-asset-count" role="status" aria-live="polite">
        {label.replace("{n}", String(count))}
      </span>
      {actions.map((entry) => (
        <button
          key={entry.action}
          type="button"
          className="vc-asset-btn"
          data-tone={entry.tone}
          onClick={() => ctx.requestAction(entry.action, { ids: ctx.selectedIds })}
        >
          {entry.label}
        </button>
      ))}
      <button type="button" className="vc-asset-btn" onClick={() => ctx.clearSelection()}>
        清空选择
      </button>
    </div>
  );
}

export const createBulkBarPlugin: AssetPluginCreator<BulkBarConfig> = (config = {}) => {
  const actions = config.actions?.length ? config.actions : DEFAULT_ACTIONS;
  const label = config.label ?? "已选 {n} 项";

  return {
    name: "bulk-bar",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    config,
    hooks: {
      renderFooter: (context) => (
        <BulkBarView ctx={context} actions={actions} label={label} />
      ),
    },
  } satisfies AssetPlugin;
};

createBulkBarPlugin.meta = doc as PluginDoc;
