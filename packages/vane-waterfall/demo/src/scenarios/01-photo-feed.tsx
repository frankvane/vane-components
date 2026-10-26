/**
 * 01 · 摄影作品错落流（对标 Unsplash）
 *
 * 版式诉求：图片高度天然不等、列数随容器变、滚到底继续加载。
 * 这里不用固定列数，交给 AutoColumnPlugin；不用 props.columns。
 */
import React, { useCallback, useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createA11yPlugin,
  createAutoColumnPlugin,
  createGapPlugin,
  createInfiniteScrollPlugin,
  createReducedMotionPlugin,
  createTransitionPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "photo-feed",
  title: "摄影作品错落流",
  group: "图片社区",
  ref: { label: "Unsplash", url: "https://unsplash.com/" },
  pain: "图片高度天然不等，列数还要跟着容器宽度走",
  plugs: [
    { fn: "createAutoColumnPlugin", cfg: "minColumnWidth: 200, maxColumns: 4", why: "按容器宽度算列数，窗口缩放不需要页面参与" },
    { fn: "createGapPlugin", cfg: "columnGap: 14, rowGap: 14", why: "图片流要更紧的间距，用插件而不是 Core props" },
    { fn: "createTransitionPlugin", cfg: "duration: 240", why: "重排时位置过渡，避免卡片瞬间跳动" },
    { fn: "createReducedMotionPlugin", why: "系统开了「减少动态效果」就自动关掉上面的过渡" },
    { fn: "createInfiniteScrollPlugin", cfg: "threshold: 400", why: "距底 400px 预加载，滚到底数据已就位" },
    { fn: "createA11yPlugin", cfg: 'containerLabel: "摄影作品列表"', why: "给容器和卡片补 role / aria-label" },
  ],
  props: ["containerStyle={{ height: 420 }}", "onLoadMore={loadMore}", "renderItem={(item) => <Card item={item} />}"],
  note: "列数是 AutoColumn 算的，所以 props 里不要写 columns —— 写了也会被插件覆盖。",
  tone: "light",
};

const BATCH = 12;
const MAX = 84;
const HEIGHTS: [number, number] = [150, 320];

function seedAt(offset: number) {
  return makeCards({ count: BATCH, seed: 4100 + offset * 7, heightRange: HEIGHTS });
}

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createAutoColumnPlugin({ minColumnWidth: 200, maxColumns: 4 }),
  createGapPlugin({ columnGap: 14, rowGap: 14 }),
  createTransitionPlugin({ duration: 240 }),
  createReducedMotionPlugin(),
  createInfiniteScrollPlugin({ threshold: 400 }),
  createA11yPlugin({ containerLabel: "摄影作品列表", enableTabIndex: false }),
]);

export default function PhotoFeedScenario() {
  const [items, setItems] = useState<SeedCard[]>(() => seedAt(0));

  const loadMore = useCallback(() => {
    setItems((prev) => {
      if (prev.length >= MAX) return prev;
      // 加载是同步的（本地假数据）：真实项目里这里换成 await fetch
      return [...prev, ...seedAt(prev.length / BATCH)];
    });
  }, []);

  return (
    <Waterfall
      items={items}
      containerStyle={{ height: 420 }}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <FeedCard card={item} variant="photo" />}
      onLoadMore={loadMore}
    />
  );
}
