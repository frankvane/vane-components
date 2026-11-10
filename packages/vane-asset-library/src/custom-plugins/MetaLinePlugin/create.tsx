/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetItem,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { formatSize } from "../../components/AssetLibraryPlugin/domain";
import doc from "./doc.json";

/**
 * MetaLinePlugin — 卡片元信息行。
 *
 * 只呈现数据里已有的字段，缺什么就少一段，不编造（缺 width/height 就不写分辨率）。
 * 分隔点用 CSS 伪元素（.vc-asset-meta__dot），避免拼字符串时首尾多出一个点。
 */
export type MetaField = "size" | "dimension" | "folder" | "tags" | "date";

export interface MetaLineConfig {
  /** 展示哪些字段，默认 体积 + 分辨率 */
  show?: MetaField[];
  /** 标签最多显示几个，默认 2 */
  maxTags?: number;
}

const DEFAULT_SHOW: MetaField[] = ["size", "dimension"];

function formatDate(value: AssetItem["createdAt"]): string {
  if (value === undefined) return "";
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  if (!Number.isFinite(time)) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function MetaLineView({
  item,
  show,
  maxTags,
}: {
  item: AssetItem;
  show: MetaField[];
  maxTags: number;
}) {
  const parts: string[] = [];
  if (show.includes("dimension") && item.width && item.height) {
    parts.push(`${item.width}×${item.height}`);
  }
  if (show.includes("size")) {
    const size = formatSize(item.size);
    if (size) parts.push(size);
  }
  if (show.includes("folder") && item.folderName) parts.push(item.folderName);
  if (show.includes("date")) {
    const date = formatDate(item.createdAt);
    if (date) parts.push(date);
  }
  if (show.includes("tags") && item.tags?.length) {
    parts.push(item.tags.slice(0, maxTags).join(" / "));
  }
  if (!parts.length) return null;

  return (
    <span className="vc-asset-meta" data-testid="asset-meta">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className={index > 0 ? "vc-asset-meta__dot" : undefined}>
          {part}
        </span>
      ))}
    </span>
  );
}

export const createMetaLinePlugin: AssetPluginCreator<MetaLineConfig> = (config = {}) => {
  const show = config.show?.length ? config.show : DEFAULT_SHOW;
  const maxTags = config.maxTags ?? 2;

  return {
    name: "meta-line",
    version: "0.1.0",
    description: doc.description,
    priority: 26,
    config,
    hooks: {
      renderCardMeta: (_context, item) => (
        <MetaLineView item={item} show={show} maxTags={maxTags} />
      ),
    },
  } satisfies AssetPlugin;
};

createMetaLinePlugin.meta = doc as PluginDoc;
