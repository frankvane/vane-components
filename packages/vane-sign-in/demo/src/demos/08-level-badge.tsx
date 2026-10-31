import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createLevelBadgePlugin } from "vane-sign-in/custom-plugins/LevelBadgePlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 08 · 等级徽章 LevelBadge
 * 单装这一个插件：头部区会员等级 + 升级进度条（读 data.level）。
 */
export const meta: DemoMeta = {
  slug: "level-badge",
  title: "等级徽章 LevelBadge",
  group: "plugin",
  intro: "头部会员徽章：等级名 + 距下一级进度条，读 data.level 渲染。",
};

const Enhanced = withSignInPlugins(SignInCore, [createLevelBadgePlugin()]);

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
