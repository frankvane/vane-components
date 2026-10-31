import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createStreakStatePlugin } from "vane-sign-in/custom-plugins/StreakStatePlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 01 · 连签状态 StreakState
 * 单装这一个插件：只渲染头部连签信息，演示「领域槽」如何把连签数封装成可替换的视觉块。
 */
export const meta: DemoMeta = {
  slug: "streak-state",
  title: "连签状态 StreakState",
  group: "plugin",
  intro: "头部连签天数 + 最高连签；断签清零、累计保留的领域逻辑由内核数据驱动。",
};

const Enhanced = withSignInPlugins(SignInCore, [createStreakStatePlugin()]);

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
