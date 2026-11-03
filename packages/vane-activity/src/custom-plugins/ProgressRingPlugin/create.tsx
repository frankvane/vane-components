import React from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface ProgressRingPluginConfig extends ActivityPluginConfigBase {
  /** 圆环直径（px，默认 104） */
  size?: number;
  /** 环宽（px，默认 10） */
  strokeWidth?: number;
  /** 右侧标题（默认「总进度」） */
  label?: string;
  /** 是否显示「已完成 x/y 项」明细（默认 true） */
  showCaption?: boolean;
  /** 进度色（默认 #cf4407，白字按钮同款强调橙，环本身无对比度要求但需与轨道拉开） */
  color?: string;
}

/**
 * ProgressRingPlugin - 环形进度：SVG 双环 + 中心百分比 + 右侧文案（完成项数 / 距下一档）。
 *
 * 与 ProgressFxPlugin（数字进度条）、MilestoneBarPlugin（节点轨道）同属 renderProgress
 * 槽，可三段共存：环给「一眼的比例」，条给「精确的刻度」，节点给「空间距离」。
 */
export const createProgressRingPlugin: PluginCreator<ProgressRingPluginConfig> = (
  config = {}
) => {
  const {
    size = 104,
    strokeWidth = 10,
    label = "总进度",
    showCaption = true,
    color = "#cf4407",
  } = config;

  return {
    name: "ProgressRingPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 15,
    config,
    hooks: {
      renderProgress: (context: ActivityPluginContext) => {
        const progress = Math.min(1, Math.max(0, context.progress ?? 0));
        const tasks = context.tasks ?? [];
        const rewards = context.rewards ?? [];
        const pct = Math.round(progress * 100);

        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const dash = circumference * progress;
        const center = size / 2;

        const doneCount = tasks.filter((t) => t.status === "completed").length;
        // 距下一档：取第一个「阈值高于当前进度且未领取」的奖励
        const next = rewards
          .filter((r) => r.status !== "claimed" && r.threshold > progress)
          .sort((a, b) => a.threshold - b.threshold)[0];
        const gap = next ? Math.max(1, Math.ceil((next.threshold - progress) * 100)) : 0;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              role="img"
              aria-label={`${label} ${pct}%`}
              style={{ position: "relative", width: size, height: size, flex: "none" }}
            >
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="rgba(128,128,128,0.18)"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  /* 从 12 点方向顺时针起画 */
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{ transition: "stroke-dasharray .4s ease" }}
                />
              </svg>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: "#1f2328" }}
                >
                  {pct}
                  <span style={{ fontSize: 12, fontWeight: 600 }}>%</span>
                </span>
                <span style={{ marginTop: 2, fontSize: 11, color: "#5d636a" }}>完成</span>
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2328" }}>{label}</div>
              {showCaption && (
                <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.7, color: "#5d636a" }}>
                  已完成 {doneCount}/{tasks.length} 项
                  {rewards.length > 0 && (
                    <>
                      <br />
                      {next ? `距「${next.title}」还差 ${gap}%` : "全部奖励已解锁"}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
  };
};

createProgressRingPlugin.meta = doc as PluginDoc;
