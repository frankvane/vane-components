import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createMilestonePlugin } from "vane-sign-in/custom-plugins/MilestonePlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 12 · 里程碑 Milestone
 * 单装这一个插件：奖励区展示距下一未达奖励的进度，与 RewardPreview 互补。
 */
export const meta: DemoMeta = {
  slug: "milestone",
  title: "里程碑 Milestone",
  group: "plugin",
  intro: "奖励区里程碑：找到下一未达奖励，展示「再连签 N 天」+ 进度条；全达成显示庆祝终态。",
};

const Enhanced = withSignInPlugins(SignInCore, [createMilestonePlugin()]);

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
