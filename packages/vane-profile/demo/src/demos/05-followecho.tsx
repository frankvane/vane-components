import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createFollowEchoPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";

/**
 * 05 · 关注回显 FollowEcho
 * 只装 FollowEcho：关注/已关注/互相关注三态按钮，受控于 props.followState。
 */
export const meta: DemoMeta = {
  slug: "followecho",
  title: "关注回显 FollowEcho",
  group: "plugin",
  plugin: "FollowEcho",
  intro: "关注 / 已关注 / 互相关注三态按钮，受控于 props.followState。",
  why: "关注关系是服务端真相；做成受控插件，点击只作乐观 UI，真相回写 props，不把状态塞进 Core。",
  plugs: [
    {
      fn: "createFollowEchoPlugin",
      cfg: "size: 'md', onFollow: (next) => api.toggleFollow(uid, next)",
      why: "负责关注按钮渲染 + 乐观切换；关系变 mutual 时触发 onMutual",
    },
  ],
  props: ["followState={serverState}"],
  controls: [
    {
      key: "state",
      label: "初始关注态",
      kind: "select",
      init: "none",
      options: [
        { label: "未关注 none", value: "none" },
        { label: "已关注 following", value: "following" },
        { label: "互相关注 mutual", value: "mutual" },
      ],
    },
    {
      key: "size",
      label: "按钮尺寸",
      kind: "select",
      init: "md",
      options: [
        { label: "中 md", value: "md" },
        { label: "小 sm", value: "sm" },
      ],
    },
  ],
  stageHeight: 200,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createFollowEchoPlugin({
          size: cfg.size as "sm" | "md",
          onFollow: (next) => log(`点击 → ${next}`),
          onMutual: () => log("关系变为 mutual", "info"),
        }),
      ]),
    [cfg.size]
  );

  return (
    <Profile
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
      followState={cfg.state as "none" | "following" | "mutual"}
    />
  );
}
