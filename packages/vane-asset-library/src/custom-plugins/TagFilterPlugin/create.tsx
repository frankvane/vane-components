/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { buildTagFacets } from "../../components/AssetLibraryPlugin/domain";
import { Chip } from "../_shared/ui";
import doc from "./doc.json";

/**
 * TagFilterPlugin — 标签面筛选。
 *
 * facet 从归一化后的全量 items 现算（不是当前结果集），否则选中一个标签后
 * 其他标签会跟着消失，用户没法二次叠加。
 * 多选语义是 OR（命中任一），与 filterAssets 实现严格一致。
 */
export interface TagFilterConfig {
  /** 最多展示几个标签，默认 8；0 = 不限 */
  max?: number;
  /** 排序方式，默认按出现次数 */
  sort?: "count" | "name";
}

function TagFilterView({
  ctx,
  max,
  sort,
}: {
  ctx: AssetLibraryContext;
  max: number;
  sort: "count" | "name";
}) {
  const facets = buildTagFacets(ctx.items);
  const ordered =
    sort === "name"
      ? [...facets].sort((a, b) => a.tag.localeCompare(b.tag, "zh-Hans-CN"))
      : facets;
  // 已选中的标签必须始终可见，否则「选中后自己被截断」就再也点不掉了
  const selectedFacets = facets.filter((facet) => ctx.tags.includes(facet.tag));
  const head = max > 0 ? ordered.slice(0, max) : ordered;
  const merged = [...selectedFacets, ...head.filter((f) => !ctx.tags.includes(f.tag))];
  const shown = max > 0 ? merged.slice(0, Math.max(max, selectedFacets.length)) : merged;

  if (!facets.length) return null;

  return (
    <div className="vc-asset-toolbar" role="group" aria-label="按标签筛选">
      {shown.map((facet) => (
        <Chip
          key={facet.tag}
          active={ctx.tags.includes(facet.tag)}
          onClick={() => ctx.toggleTag(facet.tag)}
        >
          {facet.tag}
          <span className="vc-asset-count">{facet.count}</span>
        </Chip>
      ))}
      {ctx.tags.length > 0 ? (
        <button type="button" className="vc-asset-btn" onClick={() => ctx.setTags([])}>
          清除标签
        </button>
      ) : null}
    </div>
  );
}

export const createTagFilterPlugin: AssetPluginCreator<TagFilterConfig> = (
  config = {}
) => {
  const max = config.max ?? 8;
  const sort = config.sort ?? "count";

  return {
    name: "tag-filter",
    version: "0.1.0",
    description: doc.description,
    priority: 12,
    config,
    hooks: {
      renderToolbar: (context) => <TagFilterView ctx={context} max={max} sort={sort} />,
    },
  } satisfies AssetPlugin;
};

createTagFilterPlugin.meta = doc as PluginDoc;
