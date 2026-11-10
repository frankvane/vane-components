/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetItem,
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { CardCorner, stop } from "../_shared/ui";
import doc from "./doc.json";

/**
 * FavoritePlugin — 收藏星标。
 *
 * 组件不改素材数据（items 是宿主的），只抛 `onAssetAction("favorite", { id })`；
 * 星标亮灭取决于宿主回写后的 item.favorite。这是「受控 data」的必然结果：
 * 组件内先乐观翻转会和宿主数据打架。
 */
export interface FavoriteConfig {
  /** 回调动作名，默认 favorite */
  action?: string;
  /** 已收藏填充色，默认 #f5a524 */
  activeColor?: string;
}

function FavoriteView({
  ctx,
  item,
  action,
  activeColor,
}: {
  ctx: AssetLibraryContext;
  item: AssetItem;
  action: string;
  activeColor: string;
}) {
  const active = item.favorite === true;
  const label = active ? `取消收藏 ${item.title ?? item.id}` : `收藏 ${item.title ?? item.id}`;

  return (
    <CardCorner align="bottom-start">
      <button
        type="button"
        className="vc-asset-icon"
        data-active={active ? "true" : "false"}
        aria-pressed={active}
        aria-label={label}
        title={label}
        style={{ color: active ? activeColor : undefined }}
        onClick={(event) => {
          stop(event);
          ctx.requestAction(action, { id: item.id });
        }}
      >
        {active ? "★" : "☆"}
      </button>
    </CardCorner>
  );
}

export const createFavoritePlugin: AssetPluginCreator<FavoriteConfig> = (config = {}) => {
  const action = config.action ?? "favorite";
  const activeColor = config.activeColor ?? "#f5a524";

  return {
    name: "favorite",
    version: "0.1.0",
    description: doc.description,
    priority: 24,
    config,
    hooks: {
      renderCardOverlay: (context, item) => (
        <FavoriteView ctx={context} item={item} action={action} activeColor={activeColor} />
      ),
    },
  } satisfies AssetPlugin;
};

createFavoritePlugin.meta = doc as PluginDoc;
