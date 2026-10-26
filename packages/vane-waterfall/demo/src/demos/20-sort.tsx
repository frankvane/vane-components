/**
 * 20 · Sort 插件
 *
 * 排序作用在**已过滤**的全量集合上，然后才分页 —— 这个顺序决定了「第 2 页」是不是真的第二页。
 * 换排序方式时会发现卡片位置整体跳动，那正是 transformProps 重新排了 items。
 */
import { createSortPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";
import type { SeedCard } from "../data/seed";

const COMPARATORS: Record<string, (a: SeedCard, b: SeedCard) => number> = {
  likes: (a, b) => b.likes - a.likes,
  price: (a, b) => a.price - b.price,
  fresh: (a, b) => a.minutesAgo - b.minutesAgo,
  tall: (a, b) => b.height - a.height,
};

const LABEL: Record<string, string> = {
  likes: "点赞数 高→低",
  price: "价格 低→高",
  fresh: "发布时间 新→旧",
  tall: "高度 高→低",
};

export const meta: DemoMeta = {
  slug: "sort",
  title: "Sort 插件",
  group: "plugin",
  plugin: "SortPlugin",
  intro: "四种排序切换，卡片整体重排 —— 顺序变了而不是重新请求。",
  why: "「按热度 / 价格 / 最新」这类前端可解的排序，交给插件比让后端多个接口省事；但数据量大时还是应该由后端排。",
  plugs: [
    {
      fn: "createSortPlugin",
      cfg: "comparator: (a, b) => b.likes - a.likes",
      why: "在过滤之后、分页之前重排 items（priority 30）",
    },
  ],
  props: ["sortComparator={comparator}", "columns={4}", "containerStyle={{ height: 420 }}"],
  note: "优先读 props.sortComparator：所以页面切换排序方式时不用重建组件。comparator 必须是纯函数，且不能依赖 items 顺序（否则排序结果不稳定）。",
  controls: [
    {
      key: "sortBy",
      label: "排序方式",
      kind: "select",
      init: "likes",
      options: [
        { label: LABEL.likes, value: "likes" },
        { label: LABEL.price, value: "price" },
        { label: LABEL.fresh, value: "fresh" },
        { label: LABEL.tall, value: "tall" },
      ],
    },
  ],
};

export default createFeedStage({
  count: 32,
  seed: 3601,
  commerce: true,
  variant: "product",
  instrument: true,
  pluginKeys: [],
  plugins: () => [createSortPlugin<SeedCard>({ comparator: COMPARATORS.likes })],
  coreProps: (api) => ({
    columns: 4,
    gap: 12,
    sortComparator: COMPARATORS[String(api.cfg.sortBy)] ?? COMPARATORS.likes,
    scrollToTopOnSortChange: false,
  }),
  chrome: (api) => (
    <p className="stage-tip">
      当前 <b>{LABEL[String(api.cfg.sortBy)]}</b> · 首项应是「{String(api.cfg.sortBy)} 最靠前」的那张
    </p>
  ),
});
