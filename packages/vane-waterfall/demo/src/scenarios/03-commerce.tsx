/**
 * 03 · 商品流（对标京东搜索页）
 *
 * 版式诉求：价格区间筛选 + 销量/价格排序 + 分页 + 「收藏位置」。
 * 这一条是完整数据管线：Filter(40) → Sort(30) → Pagination(10)，
 * 顺序由 priority 决定，页面只管把条件塞进 props。
 */
import React, { useMemo, useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createBookmarkPlugin,
  createFilterPlugin,
  createGapPlugin,
  createPaginationPlugin,
  createResponsiveColumnsPlugin,
  createSortPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "commerce",
  title: "商品流 · 筛排翻",
  group: "电商",
  ref: { label: "京东搜索结果", url: "https://search.jd.com/" },
  pain: "筛选、排序、翻页三件事互相踩，顺序错了筛完再翻会把结果切碎",
  plugs: [
    { fn: "createFilterPlugin", cfg: "predicate: (item) => item.price <= 500", why: "价格区间筛选；优先级 40，必须排在排序与分页之前" },
    { fn: "createSortPlugin", cfg: "comparator: (a, b) => b.likes - a.likes", why: "按热度排序；优先级 30，作用在「已筛选」的全量集合上" },
    { fn: "createPaginationPlugin", cfg: "pageSize: 12, scrollToTop: true", why: "最后才切片；优先级 10，否则一页里只剩筛出来的零星几件" },
    { fn: "createResponsiveColumnsPlugin", cfg: "breakpoints: { sm: { width: 0, columns: 2 }, md: { width: 720, columns: 3 }, lg: { width: 1080, columns: 4 } }", why: "商品卡有最小宽度，用断点表比算最小列宽更直观" },
    { fn: "createGapPlugin", cfg: "columnGap: 12, rowGap: 12", why: "统一间距" },
    { fn: "createBookmarkPlugin", cfg: 'storageKey: "demo-commerce-bookmark"', why: "按 b 记位置、按 r 跳回，长列表里挑货很实用" },
  ],
  props: [
    "containerStyle={{ height: 420 }}",
    "pageIndex={page}",
    "filterFn={maxPrice > 0 ? (item) => item.price <= maxPrice : undefined}",
    "sortComparator={sort}",
    "scrollToTopOnPageChange",
  ],
  note: "管道顺序由 priority 固定，页面不需要关心调用次序；要改顺序只能改插件 priority，不要试图在 props 上绕。",
};

const DATA = makeCards({ count: 72, seed: 3301, heightRange: [150, 230], commerce: true });

const PAGE_SIZE = 12;

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createFilterPlugin<SeedCard>({ predicate: (item) => item.price <= 500 }),
  createSortPlugin<SeedCard>({ comparator: (a, b) => b.likes - a.likes }),
  createPaginationPlugin<SeedCard>({ pageSize: PAGE_SIZE, scrollToTop: true }),
  createResponsiveColumnsPlugin({
    breakpoints: {
      sm: { width: 0, columns: 2 },
      md: { width: 720, columns: 3 },
      lg: { width: 1080, columns: 4 },
    },
  }),
  createGapPlugin({ columnGap: 12, rowGap: 12 }),
  createBookmarkPlugin({ storageKey: "demo-commerce-bookmark" }),
]);

const SORTS = [
  { key: "hot", label: "热度", cmp: (a: SeedCard, b: SeedCard) => b.likes - a.likes },
  { key: "price-asc", label: "价格 ↑", cmp: (a: SeedCard, b: SeedCard) => a.price - b.price },
  { key: "price-desc", label: "价格 ↓", cmp: (a: SeedCard, b: SeedCard) => b.price - a.price },
  { key: "new", label: "最新", cmp: (a: SeedCard, b: SeedCard) => a.minutesAgo - b.minutesAgo },
];

const PRICES = [0, 200, 350, 500];

export default function CommerceScenario() {
  const [sortKey, setSortKey] = useState("hot");
  const [maxPrice, setMaxPrice] = useState(0);
  const [page, setPage] = useState(1);

  const sortCmp = useMemo(() => SORTS.find((s) => s.key === sortKey)!.cmp, [sortKey]);
  // 页数按「筛选后」算：Filter 在管道里先跑，页面若要显示总页数就得自己先算一遍
  const visibleCount = maxPrice > 0 ? DATA.filter((i) => i.price <= maxPrice).length : DATA.length;
  const totalPages = Math.max(1, Math.ceil(visibleCount / PAGE_SIZE));

  return (
    <div className="scn-widget">
      <div className="scn-toolbar">
        <div className="scn-seg">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={sortKey === s.key ? "is-on" : ""}
              onClick={() => {
                setSortKey(s.key);
                setPage(1);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="scn-seg">
          {PRICES.map((p) => (
            <button
              key={p}
              type="button"
              className={maxPrice === p ? "is-on" : ""}
              onClick={() => {
                setMaxPrice(p);
                setPage(1);
              }}
            >
              {p === 0 ? "不限价" : `≤¥${p}`}
            </button>
          ))}
        </div>
      </div>

      <Waterfall
        items={DATA}
        containerStyle={{ height: 362 }}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <FeedCard card={item} variant="product" />}
        pageIndex={page}
        pageSize={PAGE_SIZE}
        sortComparator={sortCmp}
        filterFn={maxPrice > 0 ? (item) => item.price <= maxPrice : undefined}
        scrollToTopOnPageChange
        scrollToTopOnSortChange
      />

      <div className="scn-pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          上一页
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
