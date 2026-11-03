import React, { useEffect, useState } from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityData,
  ActivityPluginConfigBase,
  ActivityPluginContext,
  ActivityShareState,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface ShareBoostPluginConfig extends ActivityPluginConfigBase {
  /** 标题（默认「邀请好友助力」） */
  title?: string;
  /** 未传 data.share 时的默认总次数（默认 3） */
  total?: number;
  /** 未传 data.share 时的默认已用次数（默认 0） */
  used?: number;
  /** 点「邀请助力」回调；传了则由业务侧回写 data.share.used，不传则组件内乐观自增 */
  onInvite?: () => void;
  /** 头像最多显示几个（默认 5），超出折叠为 +N */
  maxAvatars?: number;
}

/** P2-5：总量/已用/头像数量都做上限夹取，避免接口脏数据渲染上百段。 */
function clampInt(value: number, min: number, max: number, fallback: number): number {
  const n = Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function ShareBoostBar({
  ctx,
  title,
  total: totalProp,
  used: usedProp,
  onInvite,
  maxAvatars,
}: {
  ctx: ActivityPluginContext;
  title: string;
  total: number;
  used: number;
  onInvite?: () => void;
  maxAvatars: number;
}) {
  const share = (ctx.data as ActivityData | undefined)?.share as ActivityShareState | undefined;
  const total = clampInt(share?.total ?? totalProp, 0, 20, 3);
  const baseUsed = clampInt(share?.used ?? usedProp, 0, total, 0);
  const [used, setUsed] = useState(baseUsed);

  // 业务侧回写 data.share.used 后同步本地乐观态
  useEffect(() => setUsed(baseUsed), [baseUsed]);

  const rawHelpers = share?.helpers;
  const helpers = Array.isArray(rawHelpers)
    ? rawHelpers.filter((h) => h && typeof h === "object")
    : [];
  const capped = Math.min(used, total);
  const full = capped >= total;
  const avatarLimit = clampInt(maxAvatars, 0, 10, 5);
  const shown = helpers.slice(0, avatarLimit);
  const overflow = Math.max(0, helpers.length - shown.length);

  const handleInvite = () => {
    if (full) return;
    if (onInvite) {
      onInvite();
      return;
    }
    setUsed((u) => Math.min(total, u + 1));
  };

  return (
    <section
      aria-label={title}
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(128,128,128,0.18)",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1f2328" }}>
          {title}
        </span>
        <span style={{ fontSize: 12, color: "#5d636a" }}>
          今日助力 <strong style={{ color: "#1f2328" }}>{capped}</strong>/{total}
        </span>
      </div>

      {/* 分段进度：每段代表一次助力名额 */}
      <div
        role="img"
        aria-label={`助力进度 ${capped}/${total}`}
        style={{ display: "flex", gap: 4, marginTop: 10 }}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: i < capped ? "#cf4407" : "rgba(128,128,128,0.18)",
              transition: "background .25s ease",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <div style={{ display: "flex", flex: 1, alignItems: "center", minWidth: 0 }}>
          {shown.map((h, i) => (
            <span
              key={h.id ?? `helper-${i}`}
              title={h.name ?? ""}
              style={{
                width: 26,
                height: 26,
                marginLeft: i === 0 ? 0 : -8,
                borderRadius: "50%",
                border: "2px solid #fff",
                background: "rgba(207,68,7,0.12)",
                color: "#a33a06",
                fontSize: 12,
                lineHeight: "22px",
                textAlign: "center",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {h.avatar ?? (h.name ? String(h.name).slice(0, 1) : "?")}
            </span>
          ))}
          {overflow > 0 && (
            <span style={{ marginLeft: 6, fontSize: 12, color: "#5d636a" }}>
              +{overflow}
            </span>
          )}
          <span
            style={{
              marginLeft: shown.length === 0 ? 0 : 8,
              fontSize: 12,
              lineHeight: 1.6,
              color: "#5d636a",
            }}
          >
            {full ? "今日助力已满，明天再来" : `还差 ${total - capped} 人解锁下一档奖励`}
          </span>
        </div>

        <button
          type="button"
          disabled={full}
          onClick={handleInvite}
          style={{
            flex: "none",
            border: "none",
            borderRadius: 999,
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 600,
            /* 可点 #cf4407 + 白字 5.0:1；满额 #5d636a 深灰底 + 白字 5.4:1 */
            background: full ? "#5d636a" : "#cf4407",
            color: "#fff",
            cursor: full ? "default" : "pointer",
          }}
        >
          {full ? "今日已满" : "邀请助力"}
        </button>
      </div>
    </section>
  );
}

/**
 * ShareBoostPlugin - 好友助力：分段名额 + 助力头像堆 + 「还差 N 人」+ 邀请按钮。
 *
 * 数据来自 data.share（total / used / helpers）；不传时回退 config 的 total / used，
 * 便于单独演示。传入 onInvite 时由业务侧回写 data.share.used 驱动，不传则组件内
 * 乐观自增（无后端场景）。
 */
export const createShareBoostPlugin: PluginCreator<ShareBoostPluginConfig> = (
  config = {}
) => {
  const {
    title = "邀请好友助力",
    total = 3,
    used = 0,
    onInvite,
    maxAvatars = 5,
  } = config;

  return {
    name: "ShareBoostPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    config,
    hooks: {
      renderFooter: (context: ActivityPluginContext) => (
        <ShareBoostBar
          ctx={context}
          title={title}
          total={total}
          used={used}
          onInvite={onInvite}
          maxAvatars={maxAvatars}
        />
      ),
    },
  };
};

createShareBoostPlugin.meta = doc as PluginDoc;
