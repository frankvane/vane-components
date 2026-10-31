import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createPointsBalancePlugin } from "vane-sign-in/custom-plugins/PointsBalancePlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 06 · 积分余额 PointsBalance
 * 单装这一个插件：头部区展示当前积分，点按可跳积分明细（演示 callbacks 之外的纯展示）。
 */
export const meta: DemoMeta = {
  slug: "points-balance",
  title: "积分余额 PointsBalance",
  group: "plugin",
  intro: "头部积分余额：大字号展示当前积分 + 累计天数，承接积分商城的入口视觉。",
};

const Enhanced = withSignInPlugins(SignInCore, [createPointsBalancePlugin()]);

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
