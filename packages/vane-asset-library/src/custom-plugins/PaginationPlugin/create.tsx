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
 * PaginationPlugin — 分页器。
 *
 * pageCount 由 domain.paginateAssets 算（越界自动夹紧），插件只负责表达：
 * 页码窗口最多 5 个，当前页居中；只有一页时不渲染，避免占位抖动。
 */
export interface PaginationConfig {
  /** 可选每页条数，默认 [12, 24, 48]；传 [] 隐藏该下拉 */
  pageSizes?: number[];
  /** 页码窗口大小，默认 5 */
  window?: number;
}

function pageWindow(current: number, pageCount: number, size: number): number[] {
  const half = Math.floor(size / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(pageCount, start + size - 1);
  start = Math.max(1, end - size + 1);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

function PaginationView({
  ctx,
  pageSizes,
  size,
}: {
  ctx: AssetLibraryContext;
  pageSizes: number[];
  size: number;
}) {
  if (ctx.pageCount <= 1) return null;
  const pages = pageWindow(ctx.page, ctx.pageCount, size);

  return (
    <div className="vc-asset-pager" role="navigation" aria-label="分页">
      <button
        type="button"
        className="vc-asset-btn"
        disabled={ctx.page <= 1}
        onClick={() => ctx.setPage(ctx.page - 1)}
      >
        上一页
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className="vc-asset-btn"
          data-tone={page === ctx.page ? "accent" : undefined}
          aria-current={page === ctx.page ? "page" : undefined}
          onClick={() => ctx.setPage(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="vc-asset-btn"
        disabled={ctx.page >= ctx.pageCount}
        onClick={() => ctx.setPage(ctx.page + 1)}
      >
        下一页
      </button>
      {pageSizes.length ? (
        <select
          className="vc-asset-input"
          aria-label="每页条数"
          value={ctx.pageSize}
          onChange={(event) => ctx.setPageSize(Number(event.target.value))}
        >
          {pageSizes.map((value) => (
            <option key={value} value={value}>
              每页 {value}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

export const createPaginationPlugin: AssetPluginCreator<PaginationConfig> = (
  config = {}
) => {
  const pageSizes = config.pageSizes ?? [12, 24, 48];
  const size = config.window ?? 5;

  return {
    name: "pagination",
    version: "0.1.0",
    description: doc.description,
    priority: 31,
    config,
    hooks: {
      renderFooter: (context) => (
        <PaginationView ctx={context} pageSizes={pageSizes} size={size} />
      ),
    },
  } satisfies AssetPlugin;
};

createPaginationPlugin.meta = doc as PluginDoc;
