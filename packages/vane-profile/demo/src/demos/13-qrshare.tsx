import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createBannerSlotPlugin, createQRSharePlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { AVATAR, SAMPLE_USER } from "../data/sample";

/**
 * 13 · 二维码分享 QRShare
 * 单看这一个插件：头图右上的「分享」按钮，点击展开二维码 + 复制链接。
 */
export const meta: DemoMeta = {
  slug: "qrshare",
  title: "二维码分享 QRShare",
  group: "plugin",
  plugin: "QRShare",
  intro: "主页二维码分享：浮于头图右上的分享按钮，点击展开二维码与复制链接。",
  why: "主页传播入口；做成插件后头图右上多了一块交互区，弹层用内部 state 控制，不污染 Core。",
  plugs: [
    {
      fn: "createBannerSlotPlugin",
      cfg: "avatar: user.avatar, overlay: user.name",
      why: "提供头图背景，让分享按钮落在它应有的右上角",
    },
    {
      fn: "createQRSharePlugin",
      cfg: "url: user.homeUrl, buttonLabel: '分享'",
      why: "负责分享按钮与弹层，与 VerifyBadge / MembershipBadge 横向并排",
    },
  ],
  props: [],
  controls: [],
  stageHeight: 240,
  note: "点击右上角「分享」按钮查看二维码占位面板（装饰性点阵，非真实可扫码）。",
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createBannerSlotPlugin({
          gradient: ["#6a11cb", "#2575fc"],
          avatar: AVATAR,
          overlay: SAMPLE_USER.name,
        }),
        createQRSharePlugin({ url: "https://vane.dev/u/frankvane" }),
      ]),
    []
  );
  return <Profile containerStyle={{ maxWidth: 420, margin: "0 auto" }} />;
}
