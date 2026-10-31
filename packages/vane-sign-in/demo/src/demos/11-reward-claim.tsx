import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createRewardClaimPlugin } from "vane-sign-in/custom-plugins/RewardClaimPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 11 · 奖励领取 RewardClaim
 * 单装这一个插件：奖励区对「已达天数且未领」的奖励给出领取按钮（走 callbacks.claim）。
 */
export const meta: DemoMeta = {
  slug: "reward-claim",
  title: "奖励领取 RewardClaim",
  group: "plugin",
  intro: "奖励区领取：扫描 rewards，对 day<=streak 且未领的奖励给出「领取」按钮，走 callbacks.claim。",
};

const Enhanced = withSignInPlugins(SignInCore, [createRewardClaimPlugin()]);

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
