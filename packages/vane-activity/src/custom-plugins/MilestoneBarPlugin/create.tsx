import React from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface MilestoneBarPluginConfig extends ActivityPluginConfigBase {
  /** 轨道高度（px，默认 6） */
  height?: number;
  /** 里程碑圆点直径（px，默认 18） */
  dotSize?: number;
}

/**
 * MilestoneBarPlugin - 里程碑进度：把每个奖励的 threshold 映射为轨道上的节点，
 * 已领取=实心绿 / 已达标可领=警示橙 / 未达标=灰。纯形状表达（无文字），与
 * ProgressFx 同槽共存时可在进度条下方形成「离下一档还差多少」的空间感。
 */
export const createMilestoneBarPlugin: PluginCreator<MilestoneBarPluginConfig> = (
  config = {}
) => {
  const { height = 6, dotSize = 18 } = config;

  return {
    name: "MilestoneBarPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 13,
    config,
    hooks: {
      renderProgress: (context: ActivityPluginContext) => {
        const progress = Math.max(0, Math.min(1, context.progress ?? 0));
        const rewards = context.rewards ?? [];
        if (rewards.length === 0) return null;
        const pct = Math.round(progress * 100);

        return (
          <div
            role="img"
            aria-label={`总体进度 ${pct}%，共 ${rewards.length} 档里程碑`}
            style={{ position: "relative", paddingTop: dotSize / 2 + 2, paddingBottom: dotSize / 2 + 2 }}
          >
            {/* 底轨 */}
            <div
              style={{
                height,
                borderRadius: height / 2,
                background: "rgba(128,128,128,0.18)",
              }}
            />
            {/* 进度填充 */}
            <div
              style={{
                position: "absolute",
                top: dotSize / 2 + 2,
                left: 0,
                height,
                borderRadius: height / 2,
                width: `${pct}%`,
                background: "#ff7a29",
                transition: "width .4s ease",
              }}
            />
            {/* 里程碑节点 */}
            {rewards.map((r) => {
              // P2-1：阈值夹到 [0,1]，非有限值按 1，避免节点跑出轨道
              const threshold = Number.isFinite(r.threshold)
                ? Math.max(0, Math.min(1, r.threshold))
                : 1;
              const reached = progress >= threshold;
              const claimed = r.status === "claimed";
              const color = claimed ? "#15803d" : reached ? "#cf4407" : "#c9cdd2";
              return (
                <div
                  key={r.id}
                  title={`${r.title}（阈值 ${Math.round(threshold * 100)}%）`}
                  style={{
                    position: "absolute",
                    top: 2,
                    left: `${Math.round(threshold * 100)}%`,
                    transform: "translateX(-50%)",
                    width: dotSize,
                    height: dotSize,
                    borderRadius: "50%",
                    background: claimed ? color : "#fff",
                    border: `2px solid ${color}`,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {claimed || reached ? (
                    <span
                      style={{
                        width: dotSize / 3,
                        height: dotSize / 3,
                        borderRadius: "50%",
                        background: color,
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      },
    },
  };
};

createMilestoneBarPlugin.meta = doc as PluginDoc;
