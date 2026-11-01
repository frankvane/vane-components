/**
 * 场景 04 · 内容审核
 *
 * 平台治理组合：敏感词打码、硬屏蔽词删除、语种过滤、用户禁言、去重、限速、审计旁路。
 * 这一组把「脏弹幕」在进渲染前全部清掉，内核只看到干净流。
 */
import React from "react";
import {
  createSensitiveFilterPlugin,
  createKeywordBlockPlugin,
  createLangFilterPlugin,
  createUserMutePlugin,
  createDedupPlugin,
  createRateLimitPlugin,
  createAuditLogPlugin,
  createSafeZonePlugin,
} from "vane-danmaku/custom-plugins";
import { LiveDanmaku, SAMPLE_MODERATION } from "../demos/lib/LiveDanmaku";

const PLUGINS = [
  createSensitiveFilterPlugin({ words: ["广告", "代刷", "违规", "政治敏感"], mode: "mask" }),
  createKeywordBlockPlugin({ words: ["竞品", "违规"] }),
  createLangFilterPlugin({ allow: ["cjk", "latin"] }),
  createUserMutePlugin({ users: ["bot"] }),
  createDedupPlugin({ window: 5 }),
  createRateLimitPlugin({ max: 3, window: 6 }),
  createAuditLogPlugin(),
  createSafeZonePlugin({ reservedBands: { top: 0.16, bottom: 0.1 } }),
];

export const meta = {
  id: "content-moderation",
  title: "内容审核",
  group: "治理",
  ref: { label: "弹幕风控", url: "https://www.bilibili.com" },
  pain: "广告、代刷、刷屏机器人、违规语种——不拦就在公屏里炸开，必须进渲染前清干净。",
  plugs: [
    { fn: "createSensitiveFilterPlugin", cfg: `words: ["广告","代刷"], mode: "mask"`, why: "命中打码保留整条" },
    { fn: "createKeywordBlockPlugin", cfg: `words: ["竞品"]`, why: "硬屏蔽词直接删除" },
    { fn: "createLangFilterPlugin", cfg: `allow: ["cjk","latin"]`, why: "按语种放行 / 过滤" },
    { fn: "createUserMutePlugin", cfg: `users: ["bot"]`, why: "禁言指定用户" },
    { fn: "createDedupPlugin", why: "短时间重复弹幕去重" },
    { fn: "createRateLimitPlugin", why: "单用户限速防刷屏" },
    { fn: "createAuditLogPlugin", why: "旁路审计，不改流" },
  ],
  props: ["items={SAMPLE_MODERATION}", "currentTime={t}", "playing"],
  tone: "dark",
};

export default function Scenario() {
  return <LiveDanmaku plugins={PLUGINS} items={SAMPLE_MODERATION} height={340} />;
}
