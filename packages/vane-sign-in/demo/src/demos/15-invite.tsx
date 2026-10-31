import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createInvitePlugin } from "vane-sign-in/custom-plugins/InvitePlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 15 · 邀请助力 Invite
 * 单装这一个插件：操作区邀请按钮，触发 callbacks.invite（拉新/游戏运营位常用）。
 */
export const meta: DemoMeta = {
  slug: "invite",
  title: "邀请助力 Invite",
  group: "plugin",
  intro: "操作区邀请位：点击触发 callbacks.invite，常用于拉新/游戏运营位解锁额外奖励。",
};

const Enhanced = withSignInPlugins(SignInCore, [createInvitePlugin()]);

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
