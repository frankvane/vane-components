/**
 * 17 · InfiniteScroll 插件
 *
 * 距底 `threshold` 像素时触发 onLoadMore，追加数据。插件内带并发锁，
 * 快速滚到底也只发一次请求 —— 数据量读数会一档一档往上走，不会跳。
 */
import { createInfiniteScrollPlugin } from "vane-waterfall/custom-plugins";
import { makeCards } from "../data/seed";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

const MAX = 240;

export const meta: DemoMeta = {
  slug: "infinite-scroll",
  title: "InfiniteScroll 插件",
  group: "plugin",
  plugin: "InfiniteScrollPlugin",
  intro: "滚到底自动追加，加载完停在 240 项不再请求。",
  why: "信息流、图片流的标准做法。threshold 要在「用户快到底但还没到底」时触发，太小会看到空白等待。",
  plugs: [
    {
      fn: "createInfiniteScrollPlugin",
      cfg: "threshold: {{threshold}}",
      why: "把 props.reachBottomOffset 写成 threshold，并在 onReachBottom 里加并发锁与 hasMore 判断",
    },
  ],
  props: ["onLoadMore={loadMore}", "columns={3}", "containerStyle={{ height: 420 }}"],
  note: "与 PaginationPlugin 互斥：一个追加、一个切片，同开会「翻到第 2 页又看到第 1 页」。到上限时让插件 setState({ hasMore: false }) 或像这里在 onLoadMore 里短路。",
  controls: [
    { key: "threshold", label: "threshold（px）", kind: "number", init: 400, min: 100, max: 900, step: 50, nonLayout: true },
  ],
};

export default createFeedStage({
  count: 24,
  seed: 3301,
  instrument: true,
  plugins: (api) => [createInfiniteScrollPlugin({ threshold: Number(api.cfg.threshold) })],
  coreProps: (api) => ({
    columns: 3,
    gap: 12,
    onLoadMore: () => {
      api.setItems((prev) =>
        prev.length >= MAX
          ? prev
          : [...prev, ...makeCards({ count: 12, seed: 3301 + prev.length * 7 })]
      );
    },
  }),
  chrome: (api) => {
    const loaded = api.items.length;
    return (
      <p className="stage-tip">
        已加载 <b>{loaded}</b> / {MAX} 项 ·{" "}
        {loaded >= MAX ? "已到上限，不会再请求" : `距底 ${Number(api.cfg.threshold)}px 时追加 12 项`}
      </p>
    );
  },
});
