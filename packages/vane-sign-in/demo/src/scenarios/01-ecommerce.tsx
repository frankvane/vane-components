import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import {
  createStreakStatePlugin,
  createCalendarStripPlugin,
  createRewardPreviewPlugin,
  createTodayCheckInPlugin,
  createMakeupSlotPlugin,
} from "vane-sign-in/custom-plugins";
import type { ScenarioMeta } from "./types";
import { buildSignInData, buildCallbacks } from "../demos/lib/sampleData";

/**
 * 01 · 电商签到运营位
 *
 * 把「连签状态 / 日历条 / 奖励预告 / 今日签到 / 补签」五个原子插件拼成一张运营位卡。
 * 单个插件都只解决一件事，但组合后就是电商 App 里最常见的「每日签到弹层」。
 */
export const meta: ScenarioMeta = {
  id: "ecommerce",
  title: "电商签到运营位",
  group: "运营位",
  ref: { label: "电商 App · 签到弹层", url: "https://vane.dev/examples/sign-in/ecommerce" },
  pain: "一个按钮的签到太单薄，用户不知道连签能拿什么；把碎插件拼成一张完整运营位卡。",
  plugs: [
    { fn: "createStreakStatePlugin", why: "头部连签天数 + 最高连签，给连续打卡的用户正反馈" },
    {
      fn: "createCalendarStripPlugin",
      cfg: "showRewardDot: true",
      why: "14 天连签条，今天/已签/漏签一眼看清，带奖励的格打点",
    },
    { fn: "createRewardPreviewPlugin", why: "逐日奖励预告，把『再签 1 天得 50 积分』前置" },
    { fn: "createTodayCheckInPlugin", why: "主 CTA：今日签到 / 已签切换" },
    { fn: "createMakeupSlotPlugin", why: "漏签用户给补签入口，挽回流失" },
  ],
  props: ["data={data}", "callbacks={callbacks}"],
  note: "五个原子插件，组合后就是一张可直接上线的大促签到卡。",
};

const Enhanced = withSignInPlugins(SignInCore, [
  createStreakStatePlugin(),
  createCalendarStripPlugin({ showRewardDot: true }),
  createRewardPreviewPlugin(),
  createTodayCheckInPlugin(),
  createMakeupSlotPlugin(),
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
