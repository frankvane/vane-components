import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createSharePlugin } from "vane-sign-in/custom-plugins/SharePlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 13 · 分享成就 Share
 * 单装这一个插件：操作区分享按钮，触发 callbacks.share（消费方决定分享渠道）。
 */
export const meta: DemoMeta = {
  slug: "share",
  title: "分享成就 Share",
  group: "plugin",
  intro: "操作区社交扩散位：点击触发 callbacks.share，海报/链接/卡片由消费方实现。",
};

const Enhanced = withSignInPlugins(SignInCore, [createSharePlugin()]);

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
