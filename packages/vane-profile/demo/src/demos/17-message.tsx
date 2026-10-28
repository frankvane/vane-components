import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import {
  createFollowEchoPlugin,
  createMessageButtonPlugin,
} from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";

/**
 * 17 · 私信按钮 MessageButton
 * 单看这一个插件：关注区里与 FollowEcho 并排的「私信」按钮。
 */
export const meta: DemoMeta = {
  slug: "message",
  title: "私信按钮 MessageButton",
  group: "plugin",
  plugin: "MessageButton",
  intro: "私信按钮：与关注回显同区并排，点击拉起会话。",
  why: "主页一对一沟通入口；做成插件后关注区多了一块描边按钮，与关注形成主次。",
  plugs: [
    {
      fn: "createFollowEchoPlugin",
      cfg: "size: 'md'",
      why: "提供关注态，让私信按钮落在它应有的并排位置",
    },
    {
      fn: "createMessageButtonPlugin",
      cfg: "label: '私信', onMessage: () => openChat(uid)",
      why: "负责私信按钮渲染，与 FollowEcho 横向并排",
    },
  ],
  props: [],
  controls: [
    { key: "showMsg", label: "显示私信按钮", kind: "switch", init: true },
  ],
  stageHeight: 120,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createFollowEchoPlugin({ size: "md", followState: "following" }),
        ...(cfg.showMsg
          ? [createMessageButtonPlugin({ label: "私信", onMessage: () => {} })]
          : []),
      ]),
    [cfg.showMsg]
  );
  return <Profile containerStyle={{ maxWidth: 420, margin: "0 auto" }} />;
}
