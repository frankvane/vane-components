import { useState } from "react";
import type { DanmakuPluginContext } from "../../components/DanmakuPlugin/plugins/types";

const FILTERS: { key: string; label: string }[] = [
  { key: "sensitive", label: "敏感词" },
  { key: "mute", label: "静音用户" },
  { key: "keyword", label: "关键词屏" },
  { key: "lang", label: "语种" },
  { key: "dedup", label: "去重" },
];

const WRAP: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  pointerEvents: "auto",
};
const CHIP = (on: boolean): React.CSSProperties => ({
  pointerEvents: "auto",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 999,
  padding: "3px 10px",
  font: "12px system-ui, sans-serif",
  color: "#fff",
  background: on ? "rgba(255,122,41,0.9)" : "rgba(255,255,255,0.12)",
  userSelect: "none",
});

/**
 * 过滤开关条组件（内部实现，仅由 create.tsx 引用）。
 * 单独成文件：create.tsx 同时导出工厂函数与组件会触发 react-refresh 告警。
 */
export function FilterToggle({
  context,
  defaults,
  onToggle,
}: {
  context: DanmakuPluginContext;
  defaults?: string[];
  onToggle?: (key: string, enabled: boolean) => void;
}) {
  const [on, setOn] = useState<Record<string, boolean>>(() => {
    const enabled = new Set(defaults ?? FILTERS.map((f) => f.key));
    return Object.fromEntries(FILTERS.map((f) => [f.key, enabled.has(f.key)]));
  });

  const toggle = (key: string) => {
    setOn((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      context.bus.emit("danmaku:filter", { key, enabled: next[key] });
      onToggle?.(key, next[key]);
      return next;
    });
  };

  return (
    <div style={WRAP}>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          aria-pressed={!!on[f.key]}
          style={CHIP(on[f.key])}
          onClick={() => toggle(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
