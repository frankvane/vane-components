import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createStatRowPlugin } from "vane-sign-in/custom-plugins/StatRowPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 07 · 统计行 StatRow
 * 单装这一个插件：头部区横排关键指标（连签/累计/最高）。
 */
export const meta: DemoMeta = {
  slug: "stat-row",
  title: "统计行 StatRow",
  group: "plugin",
  intro: "头部三项指标横排：当前连签、累计天数、历史最高连签，一屏尽览进度。",
};

const Enhanced = withSignInPlugins(SignInCore, [createStatRowPlugin()]);

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
