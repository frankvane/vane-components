import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createLiveStatusPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import type { LiveStatusKind } from "vane-profile/custom-plugins/LiveStatus";

/**
 * 14 · 在线状态 LiveStatus
 * 单看这一个插件：简介区里的一行状态（在线 / 离开 / 忙碌 / 离线 / 直播中）。
 */
export const meta: DemoMeta = {
  slug: "livestatus",
  title: "在线状态 LiveStatus",
  group: "plugin",
  plugin: "LiveStatus",
  intro: "在线 / 直播状态指示：圆点 + 文案，直播态高亮。",
  why: "主播 / 客服 / 社区的实时状态；做成插件后简介区多了一块状态行，Core 不碰业务。",
  plugs: [
    {
      fn: "createLiveStatusPlugin",
      cfg: "status: '{{status}}', liveTitle: '前端架构夜聊'",
      why: "负责状态行渲染，排在简介区，与 BioSlot / SocialLinks 同区串联",
    },
  ],
  props: [],
  controls: [
    {
      key: "status",
      label: "状态",
      kind: "select",
      init: "live",
      options: [
        { label: "在线", value: "online" },
        { label: "离开", value: "away" },
        { label: "忙碌", value: "busy" },
        { label: "离线", value: "offline" },
        { label: "直播中", value: "live" },
      ],
    },
  ],
  stageHeight: 120,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createLiveStatusPlugin({
          status: cfg.status as LiveStatusKind,
          liveTitle: "前端架构夜聊",
        }),
      ]),
    [cfg.status]
  );
  return <Profile containerStyle={{ maxWidth: 420, margin: "0 auto" }} />;
}
