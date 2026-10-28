import React, { useMemo } from "react";
import { ProfileCore, withPlugins, useProfileContext } from "vane-profile";
import { createTabSyncPlugin, createWorksGridPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { SAMPLE_WORKS } from "../data/sample";

/** 内容兜底：切到非作品页签时显示文本（演示「内容区由插件接管 / children 兜底」） */
function ProfileContent() {
  const ctx = useProfileContext();
  const tab = ctx?.activeTab ?? "works";
  return (
    <div style={{ minHeight: 120, fontSize: 14, lineHeight: 1.8, opacity: 0.8 }}>
      <b>{tab}</b> 页：这里放该页签的自定义内容（children 兜底）。
    </div>
  );
}

/**
 * 09 · 作品网格 WorksGrid
 * 单装这一个插件：内容区渲染作品网格，可随 activeTab 联动显示。
 */
export const meta: DemoMeta = {
  slug: "worksgrid",
  title: "作品网格 WorksGrid",
  group: "plugin",
  plugin: "WorksGrid",
  intro: "内容区作品网格（CSS grid），走领域槽 renderContentArea，可随页签联动。",
  why: "主页「内容」通常是网格；做成内容区插件后，Core 有内容插件时以它替代 children，且能与 TabSync 的 activeTab 联动。",
  plugs: [
    {
      fn: "createWorksGridPlugin",
      cfg: "items: user.works, columns: 3, tab: 'works'",
      why: "负责内容区网格渲染；tab 与 context.activeTab 联动，切到作品页才出网格",
    },
  ],
  props: ["（有 WorksGrid 时内容区由它接管，不再用 children）"],
  controls: [
    {
      key: "columns",
      label: "列数",
      kind: "number",
      init: 3,
      min: 2,
      max: 4,
      step: 1,
    },
    { key: "showTitle", label: "显示分组标题", kind: "switch", init: true },
    {
      key: "withTab",
      label: "随页签联动（含 TabSync）",
      kind: "switch",
      init: true,
    },
  ],
  stageHeight: 360,
};

const TABS = [
  { id: "works", label: "作品" },
  { id: "about", label: "关于" },
];

export default function Stage({ cfg, log }: DemoStageProps) {
  const columns = Number(cfg.columns);
  const withTab = Boolean(cfg.withTab);
  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        ...(withTab
          ? [
              createTabSyncPlugin({
                tabs: TABS,
                onChange: (id) => log(`切到 ${id}`),
              }),
            ]
          : []),
        createWorksGridPlugin({
          items: SAMPLE_WORKS,
          columns,
          title: cfg.showTitle ? "精选作品" : undefined,
          // 勾选「随页签联动」时只在 works 页显示，配合 TabSync；
          // 否则始终显示（适合没有页签、以作品为主页内容的主页）
          tab: withTab ? "works" : undefined,
        }),
      ]),
    [withTab, columns, cfg.showTitle]
  );

  return (
    <Profile
      containerStyle={{ maxWidth: 460, margin: "0 auto" }}
      defaultActiveTab={withTab ? "works" : undefined}
    >
      {withTab ? <ProfileContent /> : null}
    </Profile>
  );
}
