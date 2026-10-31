import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createTodayCheckInPlugin } from "vane-sign-in/custom-plugins/TodayCheckInPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 05 · 今日签到 TodayCheckIn
 * 单装这一个插件：只渲染操作区主 CTA，点击置今日已签。
 * 用开关演示「未签 → 已签」两态切换（真实项目里由 callbacks.sign 落库后回灌数据）。
 */
export const meta: DemoMeta = {
  slug: "today-check-in",
  title: "今日签到 TodayCheckIn",
  group: "plugin",
  intro: "操作区主按钮：未签时高亮的「立即签到」，已签后变为连签天数 + 明日预告。",
};

const Enhanced = withSignInPlugins(SignInCore, [createTodayCheckInPlugin()]);

export default function Stage() {
  const [signed, setSigned] = useState(false);
  const data = buildSignInData(signed);
  const callbacks = buildCallbacks({ sign: () => setSigned(true) });
  return (
    <Enhanced
      data={data}
      callbacks={callbacks}
      containerStyle={{ maxWidth: 480, margin: "0 auto" }}
    />
  );
}
