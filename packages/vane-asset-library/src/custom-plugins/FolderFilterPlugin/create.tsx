/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { buildFolderFacets } from "../../components/AssetLibraryPlugin/domain";
import { Chip } from "../_shared/ui";
import doc from "./doc.json";

/**
 * FolderFilterPlugin — 分组（文件夹）筛选。
 *
 * 刻意只做「平铺 chip」，不做文件树：本包定位是网格墙，树形侧栏是另一个组件的事
 * （分析 §0 已划界）。分组来源是宿主传入的 folders，计数按 items 现算。
 */
export interface FolderFilterConfig {
  allLabel?: string;
  /** 隐藏 0 项的分组，默认 false（保留可见，避免分组「凭空消失」） */
  hideEmpty?: boolean;
}

function FolderFilterView({
  ctx,
  allLabel,
  hideEmpty,
}: {
  ctx: AssetLibraryContext;
  allLabel: string;
  hideEmpty: boolean;
}) {
  const facets = buildFolderFacets(ctx.items, ctx.folders);
  const shown = hideEmpty ? facets.filter((facet) => facet.count > 0) : facets;
  if (!shown.length) return null;

  return (
    <div className="vc-asset-toolbar" role="group" aria-label="按分组筛选">
      <Chip active={ctx.folderId === null} onClick={() => ctx.setFolder(null)}>
        {allLabel}
      </Chip>
      {shown.map((facet) => (
        <Chip
          key={facet.id}
          active={ctx.folderId === facet.id}
          onClick={() => ctx.setFolder(facet.id)}
        >
          {facet.name}
          <span className="vc-asset-count">{facet.count}</span>
        </Chip>
      ))}
    </div>
  );
}

export const createFolderFilterPlugin: AssetPluginCreator<FolderFilterConfig> = (
  config = {}
) => {
  const allLabel = config.allLabel ?? "全部分组";
  const hideEmpty = config.hideEmpty === true;

  return {
    name: "folder-filter",
    version: "0.1.0",
    description: doc.description,
    priority: 13,
    config,
    hooks: {
      renderToolbar: (context) => (
        <FolderFilterView ctx={context} allLabel={allLabel} hideEmpty={hideEmpty} />
      ),
    },
  } satisfies AssetPlugin;
};

createFolderFilterPlugin.meta = doc as PluginDoc;
