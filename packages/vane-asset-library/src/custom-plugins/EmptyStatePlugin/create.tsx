/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetEmptyReason,
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import doc from "./doc.json";

/**
 * EmptyStatePlugin — 空态。
 *
 * 必须分叉两种原因（分析 §2.2 第 5 条）：
 *  - `empty`：库里真没素材 → 引导上传；
 *  - `filtered`：筛选把结果筛没了 → 给「清空筛选」，否则用户只能一个个猜是哪个条件。
 * 混成一句「暂无数据」是最常见的体验塌方：用户会去翻素材是否被删了。
 *
 * 单值槽：多个 empty 插件同时装上时，priority 最高的那个胜出。
 */
export interface EmptyStateConfig {
  emptyText?: string;
  emptyHint?: string;
  filteredText?: string;
  clearLabel?: string;
}

function EmptyView({
  ctx,
  reason,
  config,
}: {
  ctx: AssetLibraryContext;
  reason: AssetEmptyReason;
  config: Required<EmptyStateConfig>;
}) {
  if (reason === "filtered") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <p>{config.filteredText}</p>
        <button
          type="button"
          className="vc-asset-btn"
          data-tone="accent"
          onClick={() => ctx.clearFilters()}
        >
          {config.clearLabel}
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <p>{config.emptyText}</p>
      <span className="vc-asset-meta">{config.emptyHint}</span>
    </div>
  );
}

export const createEmptyStatePlugin: AssetPluginCreator<EmptyStateConfig> = (
  config = {}
) => {
  const resolved: Required<EmptyStateConfig> = {
    emptyText: config.emptyText ?? "素材库还是空的",
    emptyHint: config.emptyHint ?? "拖拽图片或视频到上方区域即可开始",
    filteredText: config.filteredText ?? "没有符合当前条件的素材",
    clearLabel: config.clearLabel ?? "清空筛选条件",
  };

  return {
    name: "empty-state",
    version: "0.1.0",
    description: doc.description,
    priority: 40,
    config,
    hooks: {
      renderEmpty: (context, reason) => (
        <EmptyView ctx={context} reason={reason} config={resolved} />
      ),
    },
  } satisfies AssetPlugin;
};

createEmptyStatePlugin.meta = doc as PluginDoc;
