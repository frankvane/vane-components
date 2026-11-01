/**
 * 场景 05 · 全功能中台
 *
 * 23 个插件全部装配：内容治理、视觉强调、互动指令、轨道策略、控制层 + 防遮挡。
 * 真实业务中你不会一次开满，这里用来展示「一个内核能承载多少业务语义」。
 */
import React from "react";
import {
  createSensitiveFilterPlugin,
  createKeywordBlockPlugin,
  createLangFilterPlugin,
  createEmojiRenderPlugin,
  createAtMentionPlugin,
  createUserMutePlugin,
  createDedupPlugin,
  createRateLimitPlugin,
  createAuditLogPlugin,
  createPinnedTopPlugin,
  createKeywordHighlightPlugin,
  createGiftComboPlugin,
  createColorPolicyPlugin,
  createStylePresetPlugin,
  createCmdParsePlugin,
  createFanBadgePlugin,
  createTrackStrategyPlugin,
  createSpeedControlPlugin,
  createSafeZonePlugin,
  createSettingsPanelPlugin,
  createFilterTogglePlugin,
  createCommandInputPlugin,
  createStatsBarPlugin,
} from "vane-danmaku/custom-plugins";
import { LiveDanmaku, SAMPLE_BASIC } from "../demos/lib/LiveDanmaku";

const PLUGINS = [
  createSensitiveFilterPlugin({ words: ["广告", "代刷", "违规"], mode: "mask" }),
  createKeywordBlockPlugin({ words: ["竞品"] }),
  createLangFilterPlugin({ allow: ["cjk", "latin"] }),
  createEmojiRenderPlugin(),
  createAtMentionPlugin(),
  createUserMutePlugin({ users: ["bot"] }),
  createDedupPlugin({ window: 5 }),
  createRateLimitPlugin({ max: 3, window: 6 }),
  createAuditLogPlugin(),
  createPinnedTopPlugin({ minLevel: 20 }),
  createKeywordHighlightPlugin({ keywords: ["福利", "抽奖", "高能"] }),
  createGiftComboPlugin(),
  createColorPolicyPlugin(),
  createStylePresetPlugin(),
  createCmdParsePlugin(),
  createFanBadgePlugin({
    badges: {
      u1: { name: "老粉", level: 6, color: "#ff7a29" },
      u2: { name: "舰长", level: 12, color: "#5fd3c8" },
    },
  }),
  createTrackStrategyPlugin(),
  createSpeedControlPlugin({ factor: 1 }),
  createSafeZonePlugin({ reservedBands: { top: 0.16, bottom: 0.1 } }),
  createSettingsPanelPlugin(),
  createFilterTogglePlugin(),
  createCommandInputPlugin(),
  createStatsBarPlugin(),
];

export const meta = {
  id: "full-stack",
  title: "全功能中台",
  group: "综合",
  ref: { label: "23 插件全集", url: "https://github.com/frankvane/vane-components" },
  pain: "一个内核能不能承载全部业务语义？这里把 23 个插件一次开满，看组合的边界。",
  plugs: [
    { fn: "createSensitiveFilterPlugin", why: "内容治理起点：敏感词打码" },
    { fn: "createKeywordBlockPlugin", why: "硬屏蔽词删除" },
    { fn: "createLangFilterPlugin", why: "语种过滤" },
    { fn: "createDedupPlugin", why: "去重" },
    { fn: "createRateLimitPlugin", why: "限速" },
    { fn: "createPinnedTopPlugin", why: "高赞置顶" },
    { fn: "createKeywordHighlightPlugin", why: "关键词高亮" },
    { fn: "createGiftComboPlugin", why: "礼物连击" },
    { fn: "createFanBadgePlugin", why: "粉丝牌" },
    { fn: "createCmdParsePlugin", why: "互动指令" },
    { fn: "createSafeZonePlugin", why: "防遮挡（静态 + 可注入 MediaPipe）" },
    { fn: "createSettingsPanelPlugin", why: "控制层：设置面板" },
    { fn: "createFilterTogglePlugin", why: "控制层：过滤开关" },
    { fn: "createCommandInputPlugin", why: "控制层：指令输入" },
    { fn: "createStatsBarPlugin", why: "控制层：统计条" },
  ],
  props: ["items={SAMPLE_BASIC}", "currentTime={t}", "playing"],
  tone: "dark",
};

export default function Scenario() {
  return (
    <LiveDanmaku
      plugins={PLUGINS}
      items={SAMPLE_BASIC}
      height={380}
      topInset={48}
      bottomInset={56}
    />
  );
}
