import React from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface ProgressFxPluginConfig extends ActivityPluginConfigBase {
  /** 进度条高度（px，默认 8） */
  height?: number;
}

/**
 * ProgressFxPlugin - 进度特效：顶部进度条 fill + 百分比数字；进度达成 100% 时
 * 在浮层叠加「🎉 进度达成」庆祝条（renderOverlay，绝对定位、pointerEvents:none）。
 */
export const createProgressFxPlugin: PluginCreator<ProgressFxPluginConfig> = (
  config = {}
) => {
  const { height = 8 } = config;

  return {
    name: "ProgressFxPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    config,
    hooks: {
      renderProgress: (context: ActivityPluginContext) => {
        const pct = Math.round(
          Math.max(0, Math.min(1, context.progress ?? 0)) * 100
        );
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                flex: 1,
                height,
                borderRadius: height / 2,
                background: "rgba(128,128,128,0.18)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: height / 2,
                  background: "#ff7a29",
                  transition: "width .4s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#1f2328",
                minWidth: 40,
                textAlign: "right",
              }}
            >
              {pct}%
            </span>
          </div>
        );
      },
      renderOverlay: (context: ActivityPluginContext) => {
        const reached = (context.progress ?? 0) >= 1;
        if (!reached) return null;
        return (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "4px 12px",
              borderRadius: 999,
              background: "#1f2328",
              color: "#fff",
              fontSize: 12,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            🎉 进度达成 100%
          </div>
        );
      },
    },
  };
};

createProgressFxPlugin.meta = doc as PluginDoc;
