import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import {
  createTodayCheckInPlugin,
  createSharePlugin,
  createInvitePlugin,
  createRemindPlugin,
  createRewardClaimPlugin,
} from "vane-sign-in/custom-plugins";
import type { ScenarioMeta } from "./types";
import { buildSignInData, buildCallbacks } from "../demos/lib/sampleData";

/**
 * 04 · 社交分享裂变
 *
 * 裂变链路是「签到 → 分享 → 邀请 → 提醒」。TodayCheckIn 先完成动作，Share 晒单、
 * Invite 拉新、Remind 留存、RewardClaim 领取裂变奖励 —— 单插件无法表达流程，
 * 按顺序拼成一张裂变卡。
 */
export const meta: ScenarioMeta = {
  id: "social-viral",
  title: "社交分享裂变",
  group: "裂变",
  ref: { label: "社交裂变", url: "https://vane.dev/examples/sign-in/social-viral" },
  pain: "裂变链路是『签到→分享→邀请→提醒』，单插件无法表达流程；按顺序拼成一张裂变卡。",
  plugs: [
    { fn: "createTodayCheckInPlugin", why: "先完成今日签到这一动作" },
    { fn: "createSharePlugin", cfg: 'text: "晒今日签到"', why: "分享得额外奖励的入口" },
    { fn: "createInvitePlugin", why: "邀请好友，裂变拉新" },
    { fn: "createRemindPlugin", why: "开启每日提醒，提升留存" },
    { fn: "createRewardClaimPlugin", why: "分享 / 邀请带来的奖励领取" },
  ],
  props: ["data={data}", "callbacks={callbacks}"],
  note: "share / invite / remind 走各自 callbacks，组合后即一条裂变漏斗。",
};

const Enhanced = withSignInPlugins(SignInCore, [
  createTodayCheckInPlugin(),
  createSharePlugin({ text: "晒今日签到" }),
  createInvitePlugin(),
  createRemindPlugin(),
  createRewardClaimPlugin(),
]);

export default function Stage() {
  const [signed, setSigned] = useState(false);
  const data = buildSignInData(signed);
  const callbacks = buildCallbacks({ sign: () => setSigned(true) });
  return (
    <Enhanced
      data={data}
      callbacks={callbacks}
      containerStyle={{ maxWidth: 460, margin: "0 auto" }}
    />
  );
}
