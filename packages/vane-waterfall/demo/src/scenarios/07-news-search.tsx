/**
 * 07 · 带搜索的资讯流
 *
 * 版式诉求：搜索框输入即筛、可按「最新 / 最热」切换、结果分页。
 * 三类条件都要能回顶，否则用户在第三页改关键词会看到一片空白。
 *
 * 这是数据管线的完整形态：Filter(40) → Sort(30) → Search(20) → Pagination(10)。
 */
import React, { useMemo, useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createFilterPlugin,
  createGapPlugin,
  createPaginationPlugin,
  createResponsiveColumnsPlugin,
  createSearchPlugin,
  createSortPlugin,
  createURLSyncPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "news-search",
  title: "资讯流 · 搜索筛排",
  group: "内容",
  ref: { label: "少数派 / 掘金 首页", url: "https://sspai.com/" },
  pain: "关键词、排序、页码三态联动，改任一条件都要回顶，且顺序不能错",
  plugs: [
    { fn: "createFilterPlugin", cfg: 'predicate: (item) => item.tag !== "旅行"', why: "先做粗筛（例如屏蔽某栏目），优先级 40" },
    { fn: "createSortPlugin", cfg: "comparator: (a, b) => b.likes - a.likes", why: "排序作用在粗筛后的集合上，优先级 30" },
    { fn: "createSearchPlugin", cfg: 'fields: ["title", "author"], scrollToTop: true', why: "关键词在排序后再筛，优先级 20；匹配字段要显式给，否则会把 undefined 也扫一遍" },
    { fn: "createPaginationPlugin", cfg: "pageSize: 15", why: "最后切片，优先级 10" },
    { fn: "createURLSyncPlugin", cfg: 'mode: "search", keys: ["searchQuery", "pageIndex"]', why: "条件写进 URL，刷新和分享都能复现同一屏" },
    { fn: "createResponsiveColumnsPlugin", cfg: "breakpoints: { sm: { width: 0, columns: 2 }, md: { width: 820, columns: 3 }, lg: { width: 1140, columns: 4 } }", why: "资讯卡在宽屏可以排 4 列" },
    { fn: "createGapPlugin", cfg: "columnGap: 14, rowGap: 16", why: "统一间距" },
  ],
  props: [
    "containerStyle={{ height: 340 }}",
    "searchQuery={query}",
    "pageIndex={page}",
    "pageSize={15}",
    "sortComparator={cmp}",
    "scrollToTopOnSearchChange",
    "scrollToTopOnPageChange",
  ],
  note:
    "URLSyncPlugin 会改写 location.search；demo 用的是 hash 路由，所以下方条件区另外显示了一遍当前条件，便于确认同步生效。",
};

const DATA = makeCards({ count: 60, seed: 7701, heightRange: [130, 210] });
const PAGE_SIZE = 15;

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createFilterPlugin<SeedCard>({ predicate: (item) => item.tag !== "旅行" }),
  createSortPlugin<SeedCard>({ comparator: (a, b) => b.likes - a.likes }),
  createSearchPlugin<SeedCard>({ fields: ["title", "author", "tag"], scrollToTop: true }),
  createPaginationPlugin<SeedCard>({ pageSize: PAGE_SIZE }),
  createURLSyncPlugin({ mode: "search", keys: ["searchQuery", "pageIndex"] }),
  createResponsiveColumnsPlugin({
    breakpoints: {
      sm: { width: 0, columns: 2 },
      md: { width: 820, columns: 3 },
      lg: { width: 1140, columns: 4 },
    },
  }),
  createGapPlugin({ columnGap: 14, rowGap: 16 }),
]);

export default function NewsSearchScenario() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"hot" | "new">("hot");

  const cmp = useMemo(
    () =>
      sortKey === "hot"
        ? (a: SeedCard, b: SeedCard) => b.likes - a.likes
        : (a: SeedCard, b: SeedCard) => a.minutesAgo - b.minutesAgo,
    [sortKey]
  );

  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = DATA.filter((item) => item.tag !== "旅行");
    if (!q) return pool;
    return pool.filter((item) =>
      [item.title, item.author, item.tag].some((v) => v.toLowerCase().includes(q))
    );
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));

  return (
    <div className="scn-widget">
      <div className="scn-toolbar">
        <input
          className="scn-input"
          value={query}
          placeholder="搜索标题 / 作者 / 标签"
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <div className="scn-seg">
          {(["hot", "new"] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={sortKey === k ? "is-on" : ""}
              onClick={() => {
                setSortKey(k);
                setPage(1);
              }}
            >
              {k === "hot" ? "最热" : "最新"}
            </button>
          ))}
        </div>
      </div>

      <Waterfall
        items={DATA}
        containerStyle={{ height: 316 }}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <FeedCard card={item} variant="doc" />}
        searchQuery={query}
        pageIndex={page}
        pageSize={PAGE_SIZE}
        sortComparator={cmp}
        scrollToTopOnSearchChange
        scrollToTopOnSortChange
        scrollToTopOnPageChange
      />

      <div className="scn-pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          上一页
        </button>
        <span>
          {page} / {totalPages}
          <em className="scn-pager-hint">命中 {matched.length} 条</em>
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          下一页
        </button>
      </div>
    </div>
  );
}
