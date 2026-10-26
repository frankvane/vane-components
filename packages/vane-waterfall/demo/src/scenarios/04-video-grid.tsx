/**
 * 04 · 视频封面墙（对标 B 站分区页）
 *
 * 版式诉求：封面必须严格 16:9 等高，否则缩略图会被裁得七零八落。
 * FixedHeightPlugin 统一的是**整项高度**，所以卡片要自己吃满 item.height
 * （FeedCard 的 fixed 分支），并且卡片内部的封面用 flex 占满剩余空间。
 */
import React, { useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createAlignmentPlugin,
  createFixedHeightPlugin,
  createGapPlugin,
  createReducedMotionPlugin,
  createResponsiveColumnsPlugin,
  createTransitionPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "video-grid",
  title: "视频封面墙 · 等高网格",
  group: "视频",
  ref: { label: "Bilibili 分区", url: "https://www.bilibili.com/v/douga/" },
  pain: "封面比例必须统一，否则同一行的封面高度对不齐、看起来像坏图",
  plugs: [
    { fn: "createFixedHeightPlugin", cfg: "itemHeight: 176", why: "把每项高度改成固定值；注意它改的是 item.height 字段，卡片要照着渲染" },
    { fn: "createAlignmentPlugin", cfg: 'mode: "sequential"', why: "等高时用轮转分配，保证每行列数稳定、不会出现「某列空一格」" },
    { fn: "createResponsiveColumnsPlugin", cfg: "breakpoints: { sm: { width: 0, columns: 2 }, md: { width: 780, columns: 3 }, lg: { width: 1120, columns: 4 } }", why: "视频卡偏宽，断点比最小列宽更好控制" },
    { fn: "createGapPlugin", cfg: "columnGap: 16, rowGap: 18", why: "行间距略大于列间距，避免两行标题粘连" },
    { fn: "createTransitionPlugin", cfg: "duration: 180", why: "切换分区时重排的过渡" },
    { fn: "createReducedMotionPlugin", why: "尊重系统的减少动效偏好" },
  ],
  props: ["containerStyle={{ height: 420 }}", "renderItem={(item) => <Cover item={item} fixed />}"],
  note:
    "FixedHeightPlugin 只覆盖 `item.height` 字段，Core 量的是 DOM 的 offsetHeight —— 所以卡片必须真的按 height 渲染，否则插件等于没开。",
};

const DATA = makeCards({ count: 40, seed: 4401, heightRange: [150, 230] });

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createFixedHeightPlugin<SeedCard>({ itemHeight: 176 }),
  createAlignmentPlugin({ mode: "sequential" }),
  createResponsiveColumnsPlugin({
    breakpoints: {
      sm: { width: 0, columns: 2 },
      md: { width: 780, columns: 3 },
      lg: { width: 1120, columns: 4 },
    },
  }),
  createGapPlugin({ columnGap: 16, rowGap: 18 }),
  createTransitionPlugin({ duration: 180 }),
  createReducedMotionPlugin(),
]);

export default function VideoGridScenario() {
  const [items] = useState(DATA);
  return (
    <Waterfall
      items={items}
      containerStyle={{ height: 420 }}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <FeedCard card={item} variant="video" fixed />}
    />
  );
}
