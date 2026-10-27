import type { CardPlugin, PluginCreator } from "../../plugins/types";

import React from "react";

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

function format(h: number, m: number, s: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
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

export const createCountdownPlugin: PluginCreator<
  any,
  CountdownPluginConfig
> = (config = {}) => {
  const {
    endTimestamp,
    durationMs,
    position = "top-left",
    style = {},
    prefix = "⏰",
  } = config;

  const plugin: CardPlugin = {
    name: "CountdownPlugin",
    version: "1.0.0",
    description: "倒计时徽章插件",
    priority: 40,

    hooks: {
      renderOverlay: () => {
        // 将覆盖层组件定义为稳定的组件，避免父组件每次渲染造成卸载/重挂载引起的闪烁
        const CountdownOverlay: React.FC = React.useMemo(() => {
          const Comp: React.FC = () => {
            const endRef = React.useRef<number>(
              typeof endTimestamp === "number" && endTimestamp > 0
                ? endTimestamp
                : Date.now() +
                    (typeof durationMs === "number"
                      ? durationMs
                      : 60 * 60 * 1000)
            );
            const [text, setText] = React.useState<string>("");

            React.useEffect(() => {
              let rafId: number | null = null;
              const tick = () => {
                const dist = endRef.current - Date.now();
                if (dist <= 0) {
                  setText("已结束");
                  return; // stop
                }
                const h = Math.floor(dist / 3600000);
                const m = Math.floor((dist % 3600000) / 60000);
                const s = Math.floor((dist % 60000) / 1000);
                setText(`${prefix} ${format(h, m, s)}`);
              };

              // 立即渲染一次
              tick();
              const interval = setInterval(tick, 1000);
              return () => {
                if (rafId) cancelAnimationFrame(rafId);
                clearInterval(interval);
              };
            }, []);

            return (
              <div
                style={{
                  position: "absolute",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  zIndex: 10,
                  pointerEvents: "none",
                  ...positionsStyle[position],
                  ...style,
                }}
              >
                {text}
              </div>
            );
          };
          return Comp;
        }, []);

        return <CountdownOverlay />;
      },
    },

    config,
  };

  return plugin;
};
