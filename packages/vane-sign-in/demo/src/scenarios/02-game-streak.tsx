import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import {
  createStreakStatePlugin,
  createCalendarGridPlugin,
  createMilestonePlugin,
  createLevelBadgePlugin,
  createRewardClaimPlugin,
  createCountdownPlugin,
} from "vane-sign-in/custom-plugins";
import type { ScenarioMeta } from "./types";
import { buildSignInData, buildCallbacks } from "../demos/lib/sampleData";

/**
 * 02 · 游戏连签激励
 *
 * 游戏侧要的是「成长曲线 + 紧迫感」。连签天数、月历网格、里程碑、等级徽章、
 * 奖励领取、下次刷新倒计时六个插件拼成一张「每日任务」面板。
 */
export const meta: ScenarioMeta = {
  id: "game-streak",
  title: "游戏连签激励",
  group: "激励",
  ref: { label: "游戏 · 每日任务", url: "https://vane.dev/examples/sign-in/game-streak" },
  pain: "游戏侧要的是成长曲线与紧迫感，单插件撑不起；用 6 个插件拼出『每日任务』面板。",
  plugs: [
    { fn: "createStreakStatePlugin", why: "连签天数 + 最高连签，冲榜动机" },
    { fn: "createCalendarGridPlugin", why: "月历网格，看整月进度" },
    { fn: "createMilestonePlugin", why: "里程碑节点（如 7/30 天）给阶段目标" },
    { fn: "createLevelBadgePlugin", why: "会员等级徽章，成长感" },
    { fn: "createRewardClaimPlugin", why: "达标奖励一键领取" },
    { fn: "createCountdownPlugin", why: "距下次刷新倒计时，制造紧迫" },
  ],
  props: ["data={data}", "callbacks={callbacks}"],
  note: "倒计时依赖数据里的 nextResetAt，样本数据已带该字段。",
};

const Enhanced = withSignInPlugins(SignInCore, [
  createStreakStatePlugin(),
  createCalendarGridPlugin(),
  createMilestonePlugin(),
  createLevelBadgePlugin(),
  createRewardClaimPlugin(),
  createCountdownPlugin(),
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
