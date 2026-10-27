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

interface CountdownOverlayProps {
  /** 首次挂载时求值一次，之后不再变（避免父级每次渲染都把倒计时重置） */
  resolveEnd: () => number;
  prefix: string;
  positionStyle: React.CSSProperties;
  style: React.CSSProperties;
}

/**
 * 倒计时覆盖层。
 *
 * 必须定义在模块级：旧版在 renderOverlay 里调用 React.useMemo 生成组件，
 * 而 renderOverlay 是「父组件渲染期间调用的普通函数」，在那里调 hook 会
 * 把 hook 挂到父组件的 hook 链上 —— 启用/停用本插件就会让 hook 数量变化，
 * 直接触发 "Rendered more hooks than during the previous render"。
 * 提到模块级后组件身份天然稳定，也不再有 hook 违规。
 */
const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  resolveEnd,
  prefix,
  positionStyle,
  style,
}) => {
  const endRef = React.useRef<number | null>(null);
  const end = endRef.current ?? (endRef.current = resolveEnd());
  const [text, setText] = React.useState<string>("");

  React.useEffect(() => {
    const tick = () => {
      const dist = end - Date.now();
      if (dist <= 0) {
        setText("已结束");
        return;
      }
      const h = Math.floor(dist / 3600000);
      const m = Math.floor((dist % 3600000) / 60000);
      const s = Math.floor((dist % 60000) / 1000);
      setText(`${prefix} ${format(h, m, s)}`);
    };

    // 立即渲染一次
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [end, prefix]);

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
        ...positionStyle,
        ...style,
      }}
    >
      {text}
    </div>
  );
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
