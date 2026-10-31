import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createCalendarGridPlugin } from "vane-sign-in/custom-plugins/CalendarGridPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 10 · 月历网格 CalendarGrid
 * 单装这一个插件：日历区 7 列网格，完整呈现当月签到全景。
 */
export const meta: DemoMeta = {
  slug: "calendar-grid",
  title: "月历网格 CalendarGrid",
  group: "plugin",
  intro: "七列月历网格：已签/今日/漏签/补签/奖励日五态着色，适合大运营位全景展示。",
};

const Enhanced = withSignInPlugins(SignInCore, [createCalendarGridPlugin()]);

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
