import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createRewardPreviewPlugin } from "vane-sign-in/custom-plugins/RewardPreviewPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 03 · 奖励预告 RewardPreview
 * 单装这一个插件：只渲染奖励区，预告未来逐日奖励，已领标记置灰。
 */
export const meta: DemoMeta = {
  slug: "reward-preview",
  title: "奖励预告 RewardPreview",
  group: "plugin",
  intro: "逐日奖励预览：已领取置灰打勾，未到天数半透明，临近大额奖励高亮。",
};

const Enhanced = withSignInPlugins(SignInCore, [createRewardPreviewPlugin()]);

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
