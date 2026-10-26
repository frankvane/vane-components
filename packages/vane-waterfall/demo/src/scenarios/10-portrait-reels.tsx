/**
 * 10 · 竖屏短视频流（9:16）
 *
 * 版式诉求：封面严格竖屏比例、等高、列要窄；一行能放 5–6 个才像信息流。
 * 与「视频封面墙」的区别：那边是 16:9 横卡，这边是 9:16 竖卡，
 * 行高与列宽的关系反过来，靠 FixedHeight + AutoColumn 一起控。
 */
import React, { useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createAlignmentPlugin,
  createAutoColumnPlugin,
  createFixedHeightPlugin,
  createGapPlugin,
  createReducedMotionPlugin,
  createTransitionPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { Thumb } from "../components/Thumb";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "portrait-reels",
  title: "竖屏短视频流",
  group: "视频",
  ref: { label: "抖音 / Reels 探索页", url: "https://www.douyin.com/" },
  pain: "竖屏卡要等高、列要窄，横屏那套固定高度直接套会变成大长条",
  plugs: [
    { fn: "createFixedHeightPlugin", cfg: "itemHeight: 300", why: "竖卡固定 300px 高，覆盖 item.height 字段" },
    { fn: "createAutoColumnPlugin", cfg: "minColumnWidth: 128, maxColumns: 6", why: "竖卡窄，最小列宽压到 128 才能排出 5–6 列" },
    { fn: "createAlignmentPlugin", cfg: 'mode: "sequential"', why: "等高场景用轮转，避免某列多出一个" },
    { fn: "createGapPlugin", cfg: "columnGap: 10, rowGap: 14", why: "列紧行松，视觉上更像视频流" },
    { fn: "createTransitionPlugin", cfg: "duration: 200", why: "重排过渡" },
    { fn: "createReducedMotionPlugin", why: "尊重系统减少动效" },
  ],
  props: ["containerStyle={{ height: 420 }}", "renderItem={(item) => <Reel item={item} />}"],
  note: "AutoColumn 与 FixedHeight 同开时，列宽由容器算、行高由插件固定 —— 两者互不覆盖，可以放心组合。",
};

const DATA = makeCards({ count: 36, seed: 10101, heightRange: [220, 320] });

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createFixedHeightPlugin<SeedCard>({ itemHeight: 300 }),
  createAutoColumnPlugin({ minColumnWidth: 128, maxColumns: 6 }),
  createAlignmentPlugin({ mode: "sequential" }),
  createGapPlugin({ columnGap: 10, rowGap: 14 }),
  createTransitionPlugin({ duration: 200 }),
  createReducedMotionPlugin(),
]);

function Reel({ item }: { item: SeedCard }) {
  return (
    <div className="wf-card is-reel" style={{ height: item.height }}>
      <Thumb height="100%" hue={item.hue} radius={8} deep />
      <div className="wf-reel-cap">
        <p className="wf-reel-title">{item.title}</p>
        <p className="wf-reel-meta">
          <span>{item.author}</span>
          <span>♥ {item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}</span>
        </p>
      </div>
    </div>
  );
}

export default function PortraitReelsScenario() {
  const [items] = useState(DATA);
  return (
    <Waterfall
      items={items}
      containerStyle={{ height: 420 }}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <Reel item={item} />}
    />
  );
}
