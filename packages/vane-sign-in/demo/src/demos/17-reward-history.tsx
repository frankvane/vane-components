import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createRewardHistoryPlugin } from "vane-sign-in/custom-plugins/RewardHistoryPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 17 · 领取记录 RewardHistory
 * 单装这一个插件：底部区按时间倒序展示 data.history（读 data.history）。
 */
export const meta: DemoMeta = {
  slug: "reward-history",
  title: "领取记录 RewardHistory",
  group: "plugin",
  intro: "底部区领取记录：data.history 按时间倒序展示，无记录显示终态文案。",
};

const Enhanced = withSignInPlugins(SignInCore, [createRewardHistoryPlugin()]);

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
