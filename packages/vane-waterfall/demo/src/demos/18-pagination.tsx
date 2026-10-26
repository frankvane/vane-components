/**
 * 18 · Pagination 插件
 *
 * 切片发生在整条数据管线的最后一环（Filter → Sort → Search → Pagination），
 * 所以「页数」永远是筛选后的页数。这页只有分页，但读数会写明这一点。
 */
import { createPaginationPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "pagination",
  title: "Pagination 插件",
  group: "plugin",
  plugin: "PaginationPlugin",
  intro: "pageIndex / pageSize 交给插件切片，翻页自动回顶。",
  why: "后台列表、搜索结果页：需要「第几页 / 共几页」这种确定性导航时用分页，不要用无限滚动。",
  plugs: [
    {
      fn: "createPaginationPlugin",
      cfg: "pageSize: {{pageSize}}, scrollToTop: true",
      why: "读 props.pageIndex（1 基）与 props.pageSize，对 items 切片",
    },
  ],
  props: [
    "pageIndex={{{pageIndex}}}",
    "pageSize={{{pageSize}}}",
    "scrollToTopOnPageChange",
    "columns={4}",
    "containerStyle={{ height: 420 }}",
  ],
  note: "它排在 Filter/Sort/Search 之后（priority 10），所以页数是过滤后的总数。顺序反了会出现「第 2 页是空的」。",
  controls: [
    { key: "pageSize", label: "pageSize", kind: "number", init: 12, min: 4, max: 36, step: 2 },
    { key: "pageIndex", label: "pageIndex", kind: "number", init: 1, min: 1, max: 12 },
  ],
};

export default createFeedStage({
  count: 48,
  seed: 3401,
  instrument: true,
  plugins: (api) => [
    createPaginationPlugin({ pageSize: Number(api.cfg.pageSize), scrollToTop: true }),
  ],
  coreProps: (api) => ({
    columns: 4,
    gap: 12,
    pageIndex: Number(api.cfg.pageIndex),
    pageSize: Number(api.cfg.pageSize),
    scrollToTopOnPageChange: true,
  }),
  chrome: (api) => {
    const size = Number(api.cfg.pageSize);
    const page = Number(api.cfg.pageIndex);
    const pages = Math.max(1, Math.ceil(api.items.length / size));
    return (
      <div className="stage-pager">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => api.setCfg("pageIndex", Math.max(1, page - 1))}
        >
          上一页
        </button>
        <span>
          第 <b>{page}</b> / {pages} 页 · 每页 {size} · 共 {api.items.length} 项
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => api.setCfg("pageIndex", Math.min(pages, page + 1))}
        >
          下一页
        </button>
      </div>
    );
  },
});
