/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
  AssetSortKey,
} from "../../components/AssetLibraryPlugin/plugins/types";
import doc from "./doc.json";

/**
 * SortPlugin — 排序。
 *
 * 点同一个字段 = 反转方向；换字段 = 用该字段的默认方向（时间默认新在前，
 * 其余默认升序）。排序本身在 domain.sortAssets 里，缺值恒沉底，不由插件决定。
 */
export interface SortOption {
  key: AssetSortKey;
  label: string;
}

export interface SortConfig {
  /** 可选排序项，默认 名称/时间/体积/时长 */
  options?: SortOption[];
}

const DEFAULT_OPTIONS: SortOption[] = [
  { key: "createdAt", label: "时间" },
  { key: "name", label: "名称" },
  { key: "size", label: "体积" },
  { key: "duration", label: "时长" },
];

function SortView({ ctx, options }: { ctx: AssetLibraryContext; options: SortOption[] }) {
  return (
    <div className="vc-asset-toolbar" role="group" aria-label="排序">
      <select
        className="vc-asset-input"
        aria-label="排序字段"
        value={ctx.sortKey}
        onChange={(event) => ctx.setSort(event.target.value as AssetSortKey)}
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="vc-asset-btn"
        aria-label={ctx.sortDir === "asc" ? "当前升序，点击改为降序" : "当前降序，点击改为升序"}
        onClick={() => ctx.setSort(ctx.sortKey, ctx.sortDir === "asc" ? "desc" : "asc")}
      >
        {ctx.sortDir === "asc" ? "↑ 升序" : "↓ 降序"}
      </button>
    </div>
  );
}

export const createSortPlugin: AssetPluginCreator<SortConfig> = (config = {}) => {
  const options = config.options?.length ? config.options : DEFAULT_OPTIONS;

  return {
    name: "sort",
    version: "0.1.0",
    description: doc.description,
    priority: 14,
    config,
    hooks: {
      renderToolbar: (context) => <SortView ctx={context} options={options} />,
    },
  } satisfies AssetPlugin;
};

createSortPlugin.meta = doc as PluginDoc;
