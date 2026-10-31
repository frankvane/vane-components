import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createCountdownPlugin } from "vane-sign-in/custom-plugins/CountdownPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 09 · 次签倒计时 Countdown
 * 单装这一个插件：头部区展示距下次可签到的剩余时间（读 data.nextResetAt）。
 */
export const meta: DemoMeta = {
  slug: "countdown",
  title: "次签倒计时 Countdown",
  group: "plugin",
  intro: "头部倒计时：读 data.nextResetAt 计算剩余小时/分钟，已过期则提示「现在可签到」。",
};

const Enhanced = withSignInPlugins(SignInCore, [createCountdownPlugin()]);

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
