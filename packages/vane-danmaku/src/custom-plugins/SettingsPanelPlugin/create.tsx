import { useState } from "react";
import type {
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface SettingsPanelConfig {
  /** 初始不透明度，默认 1 */
  opacity?: number;
  /** 初始速度系数，默认 1 */
  speed?: number;
  /** 初始轨道高度（px），默认 28 */
  trackHeight?: number;
  /** 变更回调（消费方可据此更新 DanmakuCore props）；与 bus 广播并存 */
  onChange?: (s: { opacity: number; speed: number; trackHeight: number }) => void;
}

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
const ROW: React.CSSProperties = { marginBottom: 8, display: "flex", flexDirection: "column", gap: 2 };
const LABEL: React.CSSProperties = { opacity: 0.8, display: "flex", justifyContent: "space-between" };

function SettingsPanel({
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
  onChange?: SettingsPanelConfig["onChange"];
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

const btnStyle: React.CSSProperties = {
  pointerEvents: "auto",
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: 12,
};

/**
 * SettingsPanelPlugin —— 弹幕设置面板（UI 面，renderOverlay）。
 * 浮层提供不透明度/速度/轨道高度滑块，变更经 bus 广播 "danmaku:settings"，
 * 由消费方（demo）监听并更新 DanmakuCore 的 props。面板本身不参与 canvas 渲染。
 */
export function createSettingsPanelPlugin(
  config: SettingsPanelConfig = {}
): DanmakuPlugin {
  return {
    name: "settings-panel",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    enabled: true,
    hooks: {
      renderOverlay: (context: DanmakuPluginContext) => (
        <SettingsPanel
          context={context}
          opacity={config.opacity}
          speed={config.speed}
          trackHeight={config.trackHeight}
          onChange={config.onChange}
        />
      ),
    },
  };
}

createSettingsPanelPlugin.meta = doc as PluginDoc;
