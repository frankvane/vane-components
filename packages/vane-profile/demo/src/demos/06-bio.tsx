import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createBioSlotPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_USER } from "../data/sample";

/**
 * 06 · 简介区 BioSlot
 * 单装这一个插件：只渲染头像下方的简介区（昵称 / 签名 / 地点·时间）。
 */
export const meta: DemoMeta = {
  slug: "bio",
  title: "简介区 BioSlot",
  group: "plugin",
  plugin: "BioSlot",
  intro: "昵称 + 签名 + 所在地 / 加入时间，走领域槽 renderBioArea。",
  why: "主页「我是谁」的签名档；做成插件后头图与数据行之间多了一段结构化简介，Core 永远不碰文案。",
  plugs: [
    {
      fn: "createBioSlotPlugin",
      cfg: "name: user.name, bio: user.bio, location: '上海', joinDate: '2021 加入'",
      why: "负责简介区渲染，排在头图与数据行之间；全部为空时不占空间",
    },
  ],
  props: [],
  controls: [
    { key: "showName", label: "显示昵称", kind: "switch", init: true },
    { key: "showBio", label: "显示签名", kind: "switch", init: true },
    { key: "showMeta", label: "显示地点/时间", kind: "switch", init: true },
  ],
  stageHeight: 220,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createBioSlotPlugin({
          name: cfg.showName ? SAMPLE_USER.name : undefined,
          bio: cfg.showBio ? SAMPLE_USER.bio : undefined,
          location: cfg.showMeta ? "上海" : undefined,
          joinDate: cfg.showMeta ? "2021 加入" : undefined,
        }),
      ]),
    [cfg.showName, cfg.showBio, cfg.showMeta]
  );
  return <Profile containerStyle={{ maxWidth: 420, margin: "0 auto" }} />;
}
