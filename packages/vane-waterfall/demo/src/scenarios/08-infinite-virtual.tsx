/**
 * 08 · 无限流 + 虚拟化（1500 项）
 *
 * 版式诉求：数据量上千，DOM 节点不能跟着涨；滚到底继续追加。
 *
 * 这里的虚拟化是 **Core 自带能力**（`virtualize`），不是插件：旧版把虚拟化写成
 * VirtualWaterfallPlugin —— 它把 renderItem 置空、自己用 overlay 画卡片，
 * 等于架空 Core；未渲染的项量不到高度就直接 continue，总高严重偏小、滚动条乱跳。
 * 现在虚拟化只裁「渲染」，不裁「布局」：未测项按 estimateHeight 占位。
 */
import React, { useCallback, useRef, useState } from "react";
import { WaterfallCore, withPlugins, type WaterfallCoreRef } from "vane-waterfall";
import {
  createA11yPlugin,
  createAutoColumnPlugin,
  createGapPlugin,
  createInfiniteScrollPlugin,
  createThrottlePlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "infinite-virtual",
  title: "千项无限流 · 虚拟化",
  group: "性能",
  ref: { label: "Pinterest 首页", url: "https://www.pinterest.com/" },
  pain: "数据涨到上千条后，DOM 节点数跟着涨，滚动掉帧、内存翻倍",
  plugs: [
    { fn: "createAutoColumnPlugin", cfg: "minColumnWidth: 190, maxColumns: 5", why: "宽屏多列，配合虚拟化能明显看出渲染节点数不变" },
    { fn: "createGapPlugin", cfg: "columnGap: 12, rowGap: 12", why: "统一间距" },
    { fn: "createThrottlePlugin", cfg: "scroll: 16, resize: 120", why: "把滚动回调压到一帧一次；虚拟化下这个开销会被放大" },
    { fn: "createInfiniteScrollPlugin", cfg: "threshold: 600", why: "提前 600px 追加，滚动体验不断档" },
    { fn: "createA11yPlugin", cfg: 'containerLabel: "无限信息流"', why: "补语义" },
  ],
  props: [
    "ref={ref}",
    "containerStyle={{ height: 420 }}",
    "virtualize={{ overscan: 2, estimateHeight: 240 }}",
    "onScroll={() => setRange(ref.current?.getVisibleRange())}",
    "onLoadMore={loadMore}",
  ],
  note:
    "虚拟化与 RecyclePlugin 不要同开：一个裁渲染、一个改 visibility，叠在一起会互相打架（隐藏的项刚好又被卸载）。",
};

const BATCH = 30;
const MAX = 1500;
const HEIGHTS: [number, number] = [140, 300];

const seedAt = (offset: number) =>
  makeCards({ count: BATCH, seed: 8800 + offset * 13, heightRange: HEIGHTS });

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createAutoColumnPlugin({ minColumnWidth: 190, maxColumns: 5 }),
  createGapPlugin({ columnGap: 12, rowGap: 12 }),
  createThrottlePlugin({ scroll: 16, resize: 120 }),
  createInfiniteScrollPlugin({ threshold: 600 }),
  createA11yPlugin({ containerLabel: "无限信息流", enableTabIndex: false }),
]);

export default function InfiniteVirtualScenario() {
  const ref = useRef<WaterfallCoreRef>(null);
  const [items, setItems] = useState<SeedCard[]>(() => seedAt(0));
  const [range, setRange] = useState({ start: 0, end: -1 });

  /** 从 Core 读当前渲染区间；相等就直接 return，避免 setState 打转 */
  const syncRange = useCallback(() => {
    const next = ref.current?.getVisibleRange();
    if (!next) return;
    setRange((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  const loadMore = useCallback(() => {
    setItems((prev) => {
      if (prev.length >= MAX) return prev;
      return [...prev, ...seedAt(prev.length / BATCH)];
    });
  }, []);

  const rendered = Math.max(0, range.end - range.start + 1);

  return (
    <div className="scn-widget">
      <div className="scn-stats">
        <span>
          数据 <b>{items.length}</b> 项
        </span>
        <span>
          实际渲染 <b>{rendered || "…"}</b> 项
        </span>
        <span className="scn-stats-hint">滚动时节点数保持不变 → 虚拟化生效</span>
      </div>

      <Waterfall
        ref={ref}
        items={items}
        containerStyle={{ height: 372 }}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <FeedCard card={item} variant="photo" />}
        virtualize={{ overscan: 2, estimateHeight: 240 }}
        // 首帧也要有读数：只监听 onScroll 的话，不滚就永远显示 0
        onLayoutComplete={syncRange}
        onScroll={syncRange}
        onLoadMore={loadMore}
      />
    </div>
  );
}
