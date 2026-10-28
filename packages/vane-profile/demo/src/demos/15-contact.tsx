import React, { useMemo } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import { createContactCardPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_CONTACT } from "../data/sample";

/**
 * 15 · 联系信息 ContactCard
 * 单看这一个插件：简介区里的联系信息行（邮箱 / 电话 / 官网 / 地址，安全链接）。
 */
export const meta: DemoMeta = {
  slug: "contact",
  title: "联系信息 ContactCard",
  group: "plugin",
  plugin: "ContactCard",
  intro: "联系信息卡：邮箱 / 电话 / 官网 / 地址，安全链接。",
  why: "商家 / 创作者公开联系方式；做成插件后简介区多了一块联系入口，外链带 rel 防钓鱼。",
  plugs: [
    {
      fn: "createContactCardPlugin",
      cfg: "email: user.email, site: user.site, address: user.address",
      why: "负责联系信息渲染，排在简介区，与 BioSlot / SocialLinks 同区串联",
    },
  ],
  props: [],
  controls: [],
  stageHeight: 120,
};

export default function Stage({ cfg }: DemoStageProps) {
  const Profile = useMemo(
    () => withPlugins(ProfileCore, [createContactCardPlugin(SAMPLE_CONTACT)]),
    []
  );
  return <Profile containerStyle={{ maxWidth: 460, margin: "0 auto" }} />;
}
