/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetItem,
  AssetPlugin,
  AssetPluginCreator,
  AssetStatus,
} from "../../components/AssetLibraryPlugin/plugins/types";
import doc from "./doc.json";

/**
 * StatusBadgePlugin — 素材状态遮罩。
 *
 * processing / failed 的素材仍然可见（用户需要知道文件在库里），但不可选。
 * 「为什么点不动」必须在卡片上直接说清楚，否则用户只会觉得组件坏了 ——
 * 这是本包最容易被忽略的一条体验底线。
 */
export interface StatusBadgeConfig {
  labels?: Partial<Record<AssetStatus, string>>;
}

const DEFAULT_LABELS: Record<AssetStatus, string> = {
  ready: "",
  processing: "转码中",
  failed: "处理失败",
};

function StatusView({
  item,
  labels,
}: {
  item: AssetItem;
  labels: Record<AssetStatus, string>;
}) {
  const status = item.status ?? "ready";
  if (status === "ready") return null;
  const text = labels[status];

  return (
    <div className="vc-asset-status" data-status={status} role="img" aria-label={text}>
      <span className="vc-asset-status__text" data-tone={status === "failed" ? "danger" : "warn"}>
        {text}
      </span>
    </div>
  );
}

export const createStatusBadgePlugin: AssetPluginCreator<StatusBadgeConfig> = (
  config = {}
) => {
  const labels = { ...DEFAULT_LABELS, ...config.labels };

  return {
    name: "status-badge",
    version: "0.1.0",
    description: doc.description,
    priority: 23,
    config,
    hooks: {
      renderCardOverlay: (_context, item) => <StatusView item={item} labels={labels} />,
    },
  } satisfies AssetPlugin;
};

createStatusBadgePlugin.meta = doc as PluginDoc;
