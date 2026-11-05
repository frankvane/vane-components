/**
 * CountdownTimerPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import { useEffect, useState } from "react";

function remainingMs(end: number): number {
  return Math.max(0, end - Date.now());
}

function format(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return d > 0 ? `${d}天 ${h}:${m}:${sec}` : `${h}:${m}:${sec}`;
}

/** 自走计时组件：时间态在组件内部，不占用内核状态 */
export function Countdown({
  end,
  label,
  urgentMs,
}: {
  end: number;
  label: string;
  urgentMs: number;
}) {
  // P2-16：初始不读 Date.now()，避免 SSR 与客户端首帧不一致；挂载后再计算。
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const remain = remainingMs(end);
    setLeft(remain);
    if (remain <= 0) return;
    const timer = window.setInterval(() => {
      const next = remainingMs(end);
      setLeft(next);
      // P2-6：归零即停表，不再每秒 setLeft(0)
      if (next <= 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [end]);

  const urgent = left !== null && left > 0 && left <= urgentMs;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 12 }}>
      <span style={{ color: "#5d636a" }}>{label}</span>
      <span
        role="timer"
        aria-label={left === null ? "剩余时间加载中" : `剩余 ${format(left)}`}
        style={{
          fontFamily: "var(--ff-mono, ui-monospace, monospace)",
          fontSize: 14,
          fontWeight: 700,
          color: left === 0 ? "#5d636a" : urgent ? "#cf4407" : "#1f2328",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {left === null ? "--:--:--" : left === 0 ? "已结束" : format(left)}
      </span>
    </div>
  );
}
