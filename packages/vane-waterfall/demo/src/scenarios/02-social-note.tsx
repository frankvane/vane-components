/**
 * 02 · 三列图文笔记（对标小红书）
 *
 * 版式诉求：固定三列、窄间距、第一条「官方活动」永远占最左列顶部；
 * 点击要能统计（运营侧看点击率）。这三点分别落在 PinItem / Gap / ClickAnalytics。
 */
import React, { useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createAutoColumnPlugin,
  createClickAnalyticsPlugin,
  createGapPlugin,
  createPinItemPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "social-note",
  title: "三列图文笔记",
  group: "图文社区",
  ref: { label: "小红书", url: "https://www.xiaohongshu.com/explore" },
  pain: "第一条运营活动要钉在最左列顶部，其余内容从它下面继续排",
  plugs: [
    { fn: "createPinItemPlugin", cfg: "pinnedIndices: [0], column: 0", why: "把 index 0 钉成「置顶块」，普通项落到该列且低于置顶块底部时自动下推" },
    { fn: "createAutoColumnPlugin", cfg: "minColumnWidth: 148, maxColumns: 4", why: "笔记卡窄，手机宽度下也要保 2 列以上" },
    { fn: "createGapPlugin", cfg: "columnGap: 10, rowGap: 10", why: "信息密度高的流用 10px 间距" },
    { fn: "createClickAnalyticsPlugin", cfg: "showOverlay: true", why: "点击计数角标，验证 onItemClick 钩子真的被触发" },
  ],
  props: ["containerStyle={{ height: 420 }}", "renderItem={(item, i) => <Note item={item} pinned={i === 0} />}"],
  note:
    "PinItemPlugin 用的是 D1-A 的 calculateItemPosition —— 这个钩子在旧版 Core 里从来没有被执行点，所以旧版置顶是完全不生效的（空转插件）。",
  tone: "light",
};

const DATA = makeCards({ count: 30, seed: 2201, heightRange: [160, 280] });

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createPinItemPlugin({ pinnedIndices: [0], column: 0 }),
  createAutoColumnPlugin({ minColumnWidth: 148, maxColumns: 4 }),
  createGapPlugin({ columnGap: 10, rowGap: 10 }),
  createClickAnalyticsPlugin({ showOverlay: true }),
]);

export default function SocialNoteScenario() {
  const [items] = useState(DATA);

  return (
    <Waterfall
      items={items}
      containerStyle={{ height: 420 }}
      keyExtractor={(item) => item.id}
      renderItem={(item, index) => (
        <FeedCard card={item} variant="note" pinned={index === 0} />
      )}
    />
  );
}
