import { useState } from "react";
import type {
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface FilterToggleConfig {
  /** 默认开启的过滤项 key（其余默认关） */
  defaults?: string[];
}

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

function FilterToggle({ context }: { context: DanmakuPluginContext }) {
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FILTERS.map((f) => [f.key, true]))
  );

  const toggle = (key: string) => {
    setOn((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      context.bus.emit("danmaku:filter", { key, enabled: next[key] });
      return next;
    });
  };

  return (
    <div style={WRAP}>
      {FILTERS.map((f) => (
        <span key={f.key} style={CHIP(on[f.key])} onClick={() => toggle(f.key)}>
          {f.label}
        </span>
      ))}
    </div>
  );
}

/**
 * FilterTogglePlugin —— 过滤开关条（UI 面，renderHeader）。
 * 渲染一排过滤项 chip，点击经 bus 广播 "danmaku:filter" {key,enabled}，
 * 由消费方（demo）据此重建对应数据面插件（传 enabled）。纯控制层，不碰弹幕流。
 */
export function createFilterTogglePlugin(
  _config: FilterToggleConfig = {}
): DanmakuPlugin {
  return {
    name: "filter-toggle",
    version: "0.1.0",
    description: doc.description,
    priority: 31,
    enabled: true,
    hooks: {
      renderHeader: (context: DanmakuPluginContext) => (
        <FilterToggle context={context} />
      ),
    },
  };
}

createFilterTogglePlugin.meta = doc as PluginDoc;
