import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createMakeupSlotPlugin } from "vane-sign-in/custom-plugins/MakeupSlotPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 04 · 补签位 MakeupSlot
 * 单装这一个插件：只渲染操作区补签入口，展示剩余补签卡与一键补签。
 */
export const meta: DemoMeta = {
  slug: "makeup-slot",
  title: "补签位 MakeupSlot",
  group: "plugin",
  intro: "断签缺口处的高亮补签入口：剩余补签卡数 + 一键补回当日奖励，走 callbacks.makeup。",
};

const Enhanced = withSignInPlugins(SignInCore, [createMakeupSlotPlugin()]);

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
