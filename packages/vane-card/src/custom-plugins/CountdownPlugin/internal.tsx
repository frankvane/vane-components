import React from "react";

function format(h: number, m: number, s: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export interface CountdownOverlayProps {
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
export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  resolveEnd,
  prefix,
  positionStyle,
  style,
}) => {
  const endRef = React.useRef<number | null>(null);
  const end = endRef.current ?? (endRef.current = resolveEnd());
  const [text, setText] = React.useState<string>("");

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    /** 走一格；返回 false 表示已结束（调用方据此停止计时） */
    const tick = (): boolean => {
      const dist = end - Date.now();
      if (dist <= 0) {
        setText("已结束");
        if (timer !== undefined) {
          clearInterval(timer);
          timer = undefined;
        }
        return false;
      }
      const h = Math.floor(dist / 3600000);
      const m = Math.floor((dist % 3600000) / 60000);
      const s = Math.floor((dist % 60000) / 1000);
      setText(`${prefix} ${format(h, m, s)}`);
      return true;
    };

    // 立即渲染一次；已经过期就不必再起定时器（旧版会一直每秒空转）
    if (tick()) {
      timer = setInterval(tick, 1000);
    }

    return () => {
      if (timer !== undefined) clearInterval(timer);
    };
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
