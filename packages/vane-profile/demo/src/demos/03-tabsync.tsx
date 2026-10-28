import React, { useMemo } from "react";
import { ProfileCore, withPlugins, useProfileContext } from "vane-profile";
import { createTabSyncPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { TAB_CONTENT } from "../data/sample";

/** 内容区：订阅 activeTab，随页签切换重渲染（TabSync 只负责切 tab，不渲染内容） */
function ProfileContent() {
  const ctx = useProfileContext();
  const tab = ctx?.activeTab ?? "works";
  return (
    <div style={{ minHeight: 120, fontSize: 14, lineHeight: 1.8, color: "#cfd3c4" }}>
      <b style={{ color: "#e9ecdf" }}>{tab}</b> —— {TAB_CONTENT[tab] ?? "（空）"}
      <p style={{ marginTop: 12, color: "#8b9080", fontSize: 12 }}>
        当前 activeTab 经 <code>useProfileContext()</code> 读取：{String(tab)}
      </p>
    </div>
  );
}

/**
 * 03 · 页签系统 TabSync
 * 交互中枢：点击切 tab → 内容区经 context.activeTab 自动重渲染。
 */
export const meta: DemoMeta = {
  slug: "tabsync",
  title: "页签系统 TabSync",
  group: "plugin",
  plugin: "TabSync",
  intro: "渲染页签栏（underline / pill / segmented）+ 切换联动内容区。",
  why: "多内容区主页的核心交互；内容怎么渲染交给消费方子节点，TabSync 只管「切」。",
  plugs: [
    {
      fn: "createTabSyncPlugin",
      cfg: "tabs: [{id:'works',label:'作品'},{id:'feeds',label:'动态'},{id:'about',label:'关于'}], variant: 'underline'",
      why: "渲染页签栏 + 点击调 context.setActiveTab，内容区订阅后自动重渲染",
    },
  ],
  props: ["defaultActiveTab=\"works\""],
  controls: [
    {
      key: "variant",
      label: "样式变体",
      kind: "select",
      init: "underline",
      options: [
        { label: "下划线 underline", value: "underline" },
        { label: "胶囊 pill", value: "pill" },
        { label: "分段 segmented", value: "segmented" },
      ],
    },
    { key: "sticky", label: "吸顶", kind: "switch", init: false },
    { key: "scrollTop", label: "切换滚到顶部", kind: "switch", init: true },
  ],
  stageHeight: 300,
};

const TABS = [
  { id: "works", label: "作品" },
  { id: "feeds", label: "动态" },
  { id: "about", label: "关于" },
];

export default function Stage({ cfg, log }: DemoStageProps) {
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createTabSyncPlugin({
          tabs: TABS,
          variant: cfg.variant as "underline" | "pill" | "segmented",
          sticky: Boolean(cfg.sticky),
          scrollTopOnChange: Boolean(cfg.scrollTop),
          onChange: (id) => log(`切换到 ${id}`),
        }),
      ]),
    [cfg.variant, cfg.sticky, cfg.scrollTop]
  );

  return (
    <Profile
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
      defaultActiveTab="works"
    >
      <ProfileContent />
    </Profile>
  );
}
