/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { isAssetSelectable } from "../../components/AssetLibraryPlugin/domain";
import doc from "./doc.json";

/**
 * SelectAllPlugin — 全选 / 取消选择。
 *
 * 语义严格限定在「当前页可见且就绪的素材」：
 *  - 不含未就绪（processing / failed）—— 它们本来就不可选；
 *  - 不含分页外的项 —— 「全选」跨页却不显示数量，是后台最常见的误删来源；
 *  - 已达 maxSelected 时按上限截断，按钮如实禁用。
 * 文案因此写「全选本页」，不自欺。
 */
export interface SelectAllConfig {
  selectLabel?: string;
  clearLabel?: string;
}

function SelectAllView({
  ctx,
  selectLabel,
  clearLabel,
}: {
  ctx: AssetLibraryContext;
  selectLabel: string;
  clearLabel: string;
}) {
  const selectable = ctx.visible.filter(isAssetSelectable);
  const allSelected =
    selectable.length > 0 && selectable.every((item) => ctx.isSelected(item.id));
  const atLimit = ctx.maxSelected > 0 && ctx.selectedIds.length >= ctx.maxSelected;

  return (
    <div className="vc-asset-toolbar" role="group" aria-label="批量选择">
      <button
        type="button"
        className="vc-asset-btn"
        disabled={!selectable.length || allSelected || atLimit}
        onClick={() => ctx.selectAllVisible()}
      >
        {selectLabel}
        {selectable.length ? `（${selectable.length}）` : ""}
      </button>
      <button
        type="button"
        className="vc-asset-btn"
        disabled={ctx.selectedIds.length === 0}
        onClick={() => ctx.clearSelection()}
      >
        {clearLabel}
      </button>
    </div>
  );
}

export const createSelectAllPlugin: AssetPluginCreator<SelectAllConfig> = (
  config = {}
) => {
  const selectLabel = config.selectLabel ?? "全选本页";
  const clearLabel = config.clearLabel ?? "取消选择";

  return {
    name: "select-all",
    version: "0.1.0",
    description: doc.description,
    priority: 17,
    config,
    hooks: {
      renderToolbar: (context) => (
        <SelectAllView ctx={context} selectLabel={selectLabel} clearLabel={clearLabel} />
      ),
    },
  } satisfies AssetPlugin;
};

createSelectAllPlugin.meta = doc as PluginDoc;
