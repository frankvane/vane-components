/**
 * 场景 03 · 互动玩法
 *
 * 直播互动的「人味」组合：粉丝牌、@提及高亮、礼物连击、互动指令（/clear、#lottery）、表情。
 */
import React from "react";
import {
  createFanBadgePlugin,
  createAtMentionPlugin,
  createGiftComboPlugin,
  createCmdParsePlugin,
  createEmojiRenderPlugin,
  createPinnedTopPlugin,
  createSafeZonePlugin,
} from "vane-danmaku/custom-plugins";
import { LiveDanmaku, SAMPLE_INTERACTION } from "../demos/lib/LiveDanmaku";

const PLUGINS = [
  createFanBadgePlugin({
    badges: {
      u1: { name: "老粉", level: 6, color: "#ff7a29" },
      u2: { name: "舰长", level: 12, color: "#5fd3c8" },
    },
  }),
  createAtMentionPlugin(),
  createGiftComboPlugin(),
  createCmdParsePlugin(),
  createEmojiRenderPlugin(),
  createPinnedTopPlugin({ minLevel: 20 }),
  createSafeZonePlugin({ reservedBands: { top: 0.16, bottom: 0.1 } }),
];

export const meta = {
  id: "interaction",
  title: "互动玩法",
  group: "互动",
  ref: { label: "礼物 / 粉丝牌 / 指令", url: "https://live.bilibili.com" },
  pain: "观众互动是直播的灵魂：识别粉丝、聚合礼物、解析指令、高亮提及，缺一个都不完整。",
  plugs: [
    { fn: "createFanBadgePlugin", why: "老粉 / 舰长身份牌" },
    { fn: "createAtMentionPlugin", why: "@主播 等提及高亮" },
    { fn: "createGiftComboPlugin", why: "连送礼物合并 xN" },
    { fn: "createCmdParsePlugin", why: "解析 /clear、#lottery 等指令" },
    { fn: "createEmojiRenderPlugin", why: ":rocket: 这类短码转表情" },
  ],
  props: ["items={SAMPLE_INTERACTION}", "currentTime={t}", "playing"],
  tone: "dark",
};

export default function Scenario() {
  return <LiveDanmaku plugins={PLUGINS} items={SAMPLE_INTERACTION} height={340} />;
}
