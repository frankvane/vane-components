import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createRemindPlugin } from "vane-sign-in/custom-plugins/RemindPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 14 · 签到提醒 Remind
 * 单装这一个插件：操作区开关，本地维护开/关态并下发 callbacks.remind。
 */
export const meta: DemoMeta = {
  slug: "remind",
  title: "签到提醒 Remind",
  group: "plugin",
  intro: "操作区提醒开关：插件自身管理开关态，切换即经 callbacks.remind 下发给消费方持久化。",
};

const Enhanced = withSignInPlugins(SignInCore, [createRemindPlugin()]);

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
