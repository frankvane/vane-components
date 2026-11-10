/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetKind,
  AssetItem,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { Badge, CardCorner } from "../_shared/ui";
import doc from "./doc.json";

/**
 * KindBadgePlugin — 类型角标。
 *
 * 图片墙里视频的缩略图就是一张静帧，不给角标用户分不出「这是图还是视频」。
 * 只读归一化后的 kind（非法值在 normalizeAssets 已归一到 image）。
 */
export interface KindBadgeConfig {
  labels?: Partial<Record<AssetKind, string>>;
  /** 仅在这些类型上显示，默认 视频 才显示（图片常有明显特征，不占角标位） */
  showFor?: AssetKind[];
}

const DEFAULT_LABELS: Record<AssetKind, string> = { image: "PIC", video: "VID" };

function KindBadgeView({
  item,
  labels,
  showFor,
}: {
  item: AssetItem;
  labels: Record<AssetKind, string>;
  showFor: AssetKind[];
}) {
  if (!showFor.includes(item.kind)) return null;
  return (
    <CardCorner align="end">
      <Badge>{labels[item.kind]}</Badge>
    </CardCorner>
  );
}

export const createKindBadgePlugin: AssetPluginCreator<KindBadgeConfig> = (
  config = {}
) => {
  const labels = { ...DEFAULT_LABELS, ...config.labels };
  const showFor = config.showFor ?? ["video"];

  return {
    name: "kind-badge",
    version: "0.1.0",
    description: doc.description,
    priority: 21,
    config,
    hooks: {
      renderCardOverlay: (_context, item) => (
        <KindBadgeView item={item} labels={labels} showFor={showFor} />
      ),
    },
  } satisfies AssetPlugin;
};

createKindBadgePlugin.meta = doc as PluginDoc;
