import { useState } from "react";
import type { DanmakuPluginContext } from "../../components/DanmakuPlugin/plugins/types";

const PANEL: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  pointerEvents: "auto",
  background: "rgba(20,20,24,0.82)",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 12px",
  font: "12px/1.5 system-ui, sans-serif",
  width: 200,
  boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
};
const ROW: React.CSSProperties = {
  marginBottom: 8,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};
const LABEL: React.CSSProperties = {
  opacity: 0.8,
  display: "flex",
  justifyContent: "space-between",
};
const btnStyle: React.CSSProperties = {
  pointerEvents: "auto",
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: 12,
};

/**
 * 弹幕设置面板组件（内部实现，仅由 create.tsx 引用）。
 * 单独成文件：create.tsx 同时导出工厂函数与组件会触发 react-refresh 告警。
 */
export function SettingsPanel({
  context,
  opacity: initialOpacity = 1,
  speed: initialSpeed = 1,
  trackHeight: initialTrackHeight = 28,
  onChange,
}: {
  context: DanmakuPluginContext;
  opacity?: number;
  speed?: number;
  trackHeight?: number;
  onChange?: (s: {
    opacity: number;
    speed: number;
    trackHeight: number;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [speed, setSpeed] = useState(initialSpeed);
  const [trackHeight, setTrackHeight] = useState(initialTrackHeight);

  const apply = (patch: Partial<{ opacity: number; speed: number; trackHeight: number }>) => {
    const next = { opacity, speed, trackHeight, ...patch };
    setOpacity(next.opacity);
    setSpeed(next.speed);
    setTrackHeight(next.trackHeight);
    context.bus.emit("danmaku:settings", next);
    onChange?.(next);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ ...PANEL, width: "auto", pointerEvents: "auto", cursor: "pointer" }}
      >
        设置 ⚙
      </button>
    );
  }

  return (
    <div style={PANEL}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <strong>弹幕设置</strong>
        <button type="button" onClick={() => setOpen(false)} style={btnStyle}>
          ✕
        </button>
      </div>
      <label style={ROW}>
        <span style={LABEL}>不透明度 <b>{opacity.toFixed(2)}</b></span>
        <input
          type="range" min={0.2} max={1} step={0.05} value={opacity}
          onChange={(e) => apply({ opacity: Number(e.target.value) })}
        />
      </label>
      <label style={ROW}>
        <span style={LABEL}>速度 <b>{speed.toFixed(2)}×</b></span>
        <input
          type="range" min={0.5} max={2} step={0.1} value={speed}
          onChange={(e) => apply({ speed: Number(e.target.value) })}
        />
      </label>
      <label style={ROW}>
        <span style={LABEL}>轨道高度 <b>{trackHeight}px</b></span>
        <input
          type="range" min={20} max={48} step={2} value={trackHeight}
          onChange={(e) => apply({ trackHeight: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
