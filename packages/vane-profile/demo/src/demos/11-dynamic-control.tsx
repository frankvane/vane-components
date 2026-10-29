import React, { useMemo, useRef, useState } from "react";
import { ProfileCore, withPlugins } from "vane-profile";
import type { ProfileCoreRef, FollowState } from "vane-profile";
import { createBannerSlotPlugin, createStatRowPlugin, createFollowEchoPlugin } from "vane-profile/custom-plugins";
import type { DemoMeta, DemoStageProps } from "./types";
import { AVATAR, SAMPLE_USER } from "../data/sample";

/**
 * 11 · 受控与事件（高级功能）
 * followState 由外部状态驱动（props 受控），点击关注触发 onFollow / onMutual；
 * 经 coreRef 可读取 activeTab、强制刷新、量取容器尺寸。
 */
export const meta: DemoMeta = {
  slug: "dynamic-control",
  title: "受控与事件",
  group: "advanced",
  capability: "controlled-state",
  intro: "followState 走 props 受控，点击关注回调 onFollow / onMutual，coreRef 读状态与强刷。",
  why: "真实业务里关注关系是服务端真相，UI 只是乐观回显；这页演示怎么把插件接到你自己的状态机。",
  plugs: [
    { fn: "createFollowEchoPlugin", cfg: "onFollow, onMutual", why: "受控三态按钮 + 回调" },
  ],
  props: ["followState={serverState}", "onFollow", "onMutual"],
  controls: [],
  stageHeight: 300,
};

const STATES: FollowState[] = ["none", "following", "mutual"];
const LABEL: Record<FollowState, string> = { none: "未关注", following: "已关注", mutual: "互相关注" };

export default function Stage({ cfg, log }: DemoStageProps) {
  const [state, setState] = useState<FollowState>("none");
  const coreRef = useRef<ProfileCoreRef>(null);

  const Profile = useMemo(
    () =>
      withPlugins(ProfileCore, [
        createBannerSlotPlugin({
          gradient: ["#1a5fd0", "#6a11cb"],
          avatar: AVATAR,
          avatarRound: true,
          height: 140,
          overlay: <strong>{SAMPLE_USER.name}</strong>,
        }),
        createStatRowPlugin({ items: SAMPLE_USER.stats }),
        createFollowEchoPlugin({
          size: "md",
          onFollow: (next) => {
            setState(next);
            log(`onFollow → ${next}`, "event");
          },
          onMutual: (next) => log(`onMutual → ${next}（关系变为互相关注）`, "info"),
        }),
      ]),
    []
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setState(s);
              log(`外部设置 followState = ${s}`);
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid rgba(125,130,140,0.4)",
              background: state === s ? "#1a5fd0" : "transparent",
              color: state === s ? "#fff" : "inherit",
              cursor: "pointer",
            }}
          >
            {LABEL[s]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            const t = coreRef.current?.getActiveTab();
            const size = coreRef.current?.getSize();
            log(`coreRef: activeTab=${t}, 容器=${size?.width}×${size?.height}`, "info");
          }}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px dashed rgba(125,130,140,0.5)",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          读 coreRef
        </button>
        <button
          type="button"
          onClick={() => coreRef.current?.forceUpdate()}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px dashed rgba(125,130,140,0.5)",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          强制刷新
        </button>
      </div>

      <Profile
        ref={coreRef}
        containerStyle={{ maxWidth: 420, margin: "0 auto" }}
        stats={SAMPLE_USER.stats}
        followState={state}
        banner={<span>@{SAMPLE_USER.handle}</span>}
      />
    </div>
  );
}
