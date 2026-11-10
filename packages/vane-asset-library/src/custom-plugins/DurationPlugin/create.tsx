/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetItem,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { formatDuration } from "../../components/AssetLibraryPlugin/domain";
import { Badge, CardCorner } from "../_shared/ui";
import doc from "./doc.json";

/**
 * DurationBadgePlugin — 视频时长角标。
 *
 * 只读 item.duration，绝不在组件里 load metadata：
 * 那会让每张卡在渲染后多一次网络请求，且 happy-dom / 无媒体解码环境里必然拿不到值。
 * 宿主想要时长，就该在生成素材数据时写进 duration。
 */
export interface DurationConfig {
  /** 无时长的视频是否显示 "--:--"，默认 false（不显示） */
  fallback?: boolean;
}

function DurationView({ item, fallback }: { item: AssetItem; fallback: boolean }) {
  if (item.kind !== "video") return null;
  const text = formatDuration(item.duration);
  if (!text && !fallback) return null;
  return (
    <CardCorner align="bottom">
      <Badge title={`时长 ${text || "未知"}`}>{text || "--:--"}</Badge>
    </CardCorner>
  );
}

export const createDurationPlugin: AssetPluginCreator<DurationConfig> = (config = {}) => {
  const fallback = config.fallback === true;

  return {
    name: "duration",
    version: "0.1.0",
    description: doc.description,
    priority: 22,
    config,
    hooks: {
      renderCardOverlay: (_context, item) => <DurationView item={item} fallback={fallback} />,
    },
  } satisfies AssetPlugin;
};

createDurationPlugin.meta = doc as PluginDoc;
