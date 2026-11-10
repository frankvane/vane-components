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
 * CountPlugin — 结果计数。
 *
 * 三个数各说一件事：total=过滤后的总数、visible=当前页条数、selected=已选。
 * 分页时把「当前页/总数」写清楚，否则用户会以为筛选把素材弄丢了。
 */
export interface CountConfig {
  showTotal?: boolean;
  showVisible?: boolean;
  showSelected?: boolean;
  /** 分隔符，默认 · */
  separator?: string;
}

function CountView({
  ctx,
  showTotal,
  showVisible,
  showSelected,
  separator,
}: {
  ctx: AssetLibraryContext;
  showTotal: boolean;
  showVisible: boolean;
  showSelected: boolean;
  separator: string;
}) {
  const parts: string[] = [];
  if (showTotal) parts.push(`共 ${ctx.total} 项`);
  if (showVisible && ctx.pageCount > 1) {
    parts.push(`第 ${ctx.page} / ${ctx.pageCount} 页 · 本页 ${ctx.visible.length}`);
  }
  if (showSelected) parts.push(`已选 ${ctx.selectedIds.length}`);

  return (
    <span className="vc-asset-count" data-testid="asset-count" role="status" aria-live="polite">
      {parts.join(` ${separator} `)}
    </span>
  );
}

export const createCountPlugin: AssetPluginCreator<CountConfig> = (config = {}) => {
  const showTotal = config.showTotal !== false;
  const showVisible = config.showVisible !== false;
  const showSelected = config.showSelected !== false;
  const separator = config.separator ?? "·";

  return {
    name: "count",
    version: "0.1.0",
    description: doc.description,
    priority: 16,
    config,
    hooks: {
      renderToolbar: (context) => (
        <CountView
          ctx={context}
          showTotal={showTotal}
          showVisible={showVisible}
          showSelected={showSelected}
          separator={separator}
        />
      ),
    },
  } satisfies AssetPlugin;
};

createCountPlugin.meta = doc as PluginDoc;
