/**
 * 场景 01 · 直播弹幕
 *
 * 直播场景下「好看 + 可控」的最小组合：敏感词打码、粉丝牌、高赞置顶、关键词高亮、
 * 表情/提及/礼物连击、配色策略、防遮挡，外加四个控制层插件（设置/过滤/指令/统计）。
 */
import React from "react";
import {
  createSensitiveFilterPlugin,
  createFanBadgePlugin,
  createPinnedTopPlugin,
  createKeywordHighlightPlugin,
  createEmojiRenderPlugin,
  createAtMentionPlugin,
  createGiftComboPlugin,
  createColorPolicyPlugin,
  createCmdParsePlugin,
  createSafeZonePlugin,
  createSettingsPanelPlugin,
  createFilterTogglePlugin,
  createCommandInputPlugin,
  createStatsBarPlugin,
} from "vane-danmaku/custom-plugins";
import { LiveDanmaku, SAMPLE_BASIC } from "../demos/lib/LiveDanmaku";

const PLUGINS = [
  createSensitiveFilterPlugin({ words: ["广告", "代刷", "违规"], mode: "mask" }),
  createFanBadgePlugin({
    badges: {
      u1: { name: "老粉", level: 6, color: "#ff7a29" },
      u2: { name: "舰长", level: 12, color: "#5fd3c8" },
    },
  }),
  createPinnedTopPlugin({ minLevel: 20 }),
  createKeywordHighlightPlugin({ keywords: ["福利", "抽奖", "高能"] }),
  createEmojiRenderPlugin(),
  createAtMentionPlugin(),
  createGiftComboPlugin(),
  createColorPolicyPlugin(),
  createCmdParsePlugin(),
  createSafeZonePlugin({ reservedBands: { top: 0.18, bottom: 0.12 } }),
  createSettingsPanelPlugin(),
  createFilterTogglePlugin(),
  createCommandInputPlugin(),
  createStatsBarPlugin(),
];

export const meta = {
  id: "live-streaming",
  title: "直播弹幕",
  group: "直播",
  ref: { label: "B站 / 抖音直播", url: "https://live.bilibili.com" },
  pain: "直播弹幕既要热闹又不能乱：敏感词、刷屏、广告、人物遮挡全得管。",
  plugs: [
    { fn: "createSensitiveFilterPlugin", cfg: `words: ["广告","代刷"], mode: "mask"`, why: "命中敏感词打码，保留整条不闪烁" },
    { fn: "createFanBadgePlugin", why: "给老粉 / 舰长挂粉丝牌" },
    { fn: "createPinnedTopPlugin", cfg: "minLevel: 20", why: "高等级发言置顶固定" },
    { fn: "createKeywordHighlightPlugin", why: "福利/抽奖/高能 高亮" },
    { fn: "createGiftComboPlugin", why: "同一用户连送礼物合并成 xN" },
    { fn: "createSafeZonePlugin", why: "顶/底静态安全区，防主播被遮" },
    { fn: "createSettingsPanelPlugin", why: "观众调透明度/速度/轨道" },
    { fn: "createCommandInputPlugin", why: "观众发弹幕或 /clear 指令" },
  ],
  props: ["items={SAMPLE_BASIC}", "currentTime={t}", "playing"],
  tone: "dark",
};

export default function Scenario() {
  return (
    <LiveDanmaku
      plugins={PLUGINS}
      items={SAMPLE_BASIC}
      height={360}
      topInset={48}
      bottomInset={56}
    />
  );
}
