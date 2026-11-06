import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";

import React from "react";

import { CountdownOverlay } from "./internal";

export interface CountdownPluginConfig {
  /** 结束时间戳，毫秒。与 durationMs 二选一，优先使用 endTimestamp */
  endTimestamp?: number;
  /** 从 now 开始的持续时长（毫秒） */
  durationMs?: number;
  /** 徽章位置 */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 前缀字符，例如 ⏰ */
  prefix?: string;
}

const positionsStyle: Record<
  NonNullable<CountdownPluginConfig["position"]>,
  React.CSSProperties
> = {
  "top-left": { top: "8px", left: "8px" },
  "top-right": { top: "8px", right: "8px" },
  "bottom-left": { bottom: "8px", left: "8px" },
  "bottom-right": { bottom: "8px", right: "8px" },
};

// 工厂返回 T 收敛为 unknown：T 仅经 data 透传，自定义 data 形态的调用方请显式写泛型参数。
export const createCountdownPlugin: PluginCreator<
  unknown,
  CountdownPluginConfig
> = (config = {}) => {
  const {
    endTimestamp,
    durationMs,
    position = "top-left",
    style = {},
    prefix = "⏰",
  } = config;

  const resolveEnd = () =>
    typeof endTimestamp === "number" && endTimestamp > 0
      ? endTimestamp
      : Date.now() + (typeof durationMs === "number" ? durationMs : 60 * 60 * 1000);

  const plugin: CardPlugin = {
    name: "CountdownPlugin",
    version: "1.0.0",
    description: "倒计时徽章插件",
    priority: 40,

    hooks: {
      renderOverlay: () => (
        <CountdownOverlay
          resolveEnd={resolveEnd}
          prefix={prefix}
          positionStyle={positionsStyle[position]}
          style={style}
        />
      ),
    },

    config,
  };

  return plugin;
};
