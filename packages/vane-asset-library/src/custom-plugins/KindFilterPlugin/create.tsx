/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetKind,
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { Chip } from "../_shared/ui";
import doc from "./doc.json";

/**
 * KindFilterPlugin — 按素材类型筛选。
 *
 * 「全部」不是「清空所有筛选」，只清 kinds：搜索词、标签、分组必须保持。
 * 计数用归一化后的全量 items（不是过滤后的 filtered），否则点一次图片，
 * 「视频 12」会瞬间变成 0，用户会以为素材没了。
 */
export interface KindFilterConfig {
  /** 参与筛选的类型与文案，默认图片/视频 */
  kinds?: Array<{ kind: AssetKind; label: string }>;
  allLabel?: string;
}

const DEFAULT_KINDS: Array<{ kind: AssetKind; label: string }> = [
  { kind: "image", label: "图片" },
  { kind: "video", label: "视频" },
];

function KindFilterView({
  ctx,
  options,
  allLabel,
}: {
  ctx: AssetLibraryContext;
  options: Array<{ kind: AssetKind; label: string }>;
  allLabel: string;
}) {
  const countOf = (kind: AssetKind) =>
    ctx.items.filter((item) => item.kind === kind).length;

  return (
    <div className="vc-asset-toolbar" role="group" aria-label="按素材类型筛选">
      <Chip active={ctx.kinds.length === 0} onClick={() => ctx.setKinds([])}>
        {allLabel}
        <span className="vc-asset-count">{ctx.items.length}</span>
      </Chip>
      {options.map(({ kind, label }) => (
        <Chip
          key={kind}
          active={ctx.kinds.includes(kind)}
          onClick={() => ctx.toggleKind(kind)}
        >
          {label}
          <span className="vc-asset-count">{countOf(kind)}</span>
        </Chip>
      ))}
    </div>
  );
}

export const createKindFilterPlugin: AssetPluginCreator<KindFilterConfig> = (
  config = {}
) => {
  const options = config.kinds?.length ? config.kinds : DEFAULT_KINDS;
  const allLabel = config.allLabel ?? "全部";

  return {
    name: "kind-filter",
    version: "0.1.0",
    description: doc.description,
    priority: 11,
    config,
    hooks: {
      renderToolbar: (context) => (
        <KindFilterView ctx={context} options={options} allLabel={allLabel} />
      ),
    },
  } satisfies AssetPlugin;
};

createKindFilterPlugin.meta = doc as PluginDoc;
