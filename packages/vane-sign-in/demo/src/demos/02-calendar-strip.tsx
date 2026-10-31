import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createCalendarStripPlugin } from "vane-sign-in/custom-plugins/CalendarStripPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 02 · 日历条 CalendarStrip
 * 单装这一个插件：只渲染日历区，横向日期条 + 今日/漏签/补签标记。
 */
export const meta: DemoMeta = {
  slug: "calendar-strip",
  title: "日历条 CalendarStrip",
  group: "plugin",
  intro: "横向日期条；已签/今日/漏签/补签/未来五态由 DayStatus 着色，各平台运营位通用。",
};

const Enhanced = withSignInPlugins(SignInCore, [createCalendarStripPlugin()]);

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
