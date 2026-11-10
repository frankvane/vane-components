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
 * SelectMarkPlugin — 卡片选择标记。
 *
 * 已选显示勾选（多选模式下显示「第几个被选中」），未选显示空心圈。
 * 点击必须 stopPropagation：否则会先被标记按钮处理、再冒泡到卡片触发一次 toggle，
 * 结果就是「点一下选中又取消」。
 *
 * 未就绪素材不渲染标记：不给用户一个按了没反应的按钮（原因由 status-badge 说明）。
 */
export interface SelectMarkConfig {
  /** 多选时显示选择序号，默认 true */
  showIndex?: boolean;
}

function SelectMarkView({
  ctx,
  item,
  showIndex,
}: {
  ctx: AssetLibraryContext;
  item: AssetItem;
  showIndex: boolean;
}) {
  if (!ctx.isSelectable(item)) return null;

  const selected = ctx.isSelected(item.id);
  const order = ctx.selectedIds.indexOf(item.id) + 1;
  const blocked = ctx.isBlocked(item);
  const label = selected
    ? `取消选择 ${item.title ?? item.id}`
    : blocked
      ? `已达选择上限，无法选择 ${item.title ?? item.id}`
      : `选择 ${item.title ?? item.id}`;

  return (
    <CardCorner align="start">
      <button
        type="button"
        className="vc-asset-mark"
        data-selected={selected ? "true" : "false"}
        aria-pressed={selected}
        aria-label={label}
        title={label}
        disabled={blocked}
        onClick={(event) => {
          stop(event);
          ctx.toggleSelect(item.id);
        }}
      >
        {selected ? (showIndex && ctx.selectedIds.length > 1 ? order : "✓") : ""}
      </button>
    </CardCorner>
  );
}

export const createSelectMarkPlugin: AssetPluginCreator<SelectMarkConfig> = (
  config = {}
) => {
  const showIndex = config.showIndex !== false;

  return {
    name: "select-mark",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    config,
    hooks: {
      renderCardOverlay: (context, item) => (
        <SelectMarkView ctx={context} item={item} showIndex={showIndex} />
      ),
    },
  } satisfies AssetPlugin;
};

createSelectMarkPlugin.meta = doc as PluginDoc;
