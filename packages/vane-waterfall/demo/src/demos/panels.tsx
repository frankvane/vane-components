/**
 * 示例页的三种通用面板
 *
 *  - ControlBar：按 meta.controls 生成控件，值回传给页面（拖控件 = 改代码）
 *  - EventLog：事件日志（ref 调用、生命周期、埋点都靠它把「真的触发了」摊出来）
 *  - PerfReadout：性能读数（渲染项数 / 总高 / 布局耗时 / 滚动次数）
 */
import React from "react";
import type { DemoControl, DemoCfg, DemoLogKind } from "./types";

// ============ 控件 ============

export function ControlBar({
  controls,
  cfg,
  onChange,
}: {
  controls: DemoControl[];
  cfg: DemoCfg;
  onChange: (key: string, value: number | boolean | string) => void;
}) {
  return (
    <div className="ctl-bar">
      {controls.map((c) => {
        const value = cfg[c.key];
        return (
          <label className="ctl" key={c.key} title={c.hint}>
            <span className="ctl-label">
              {c.label}
              <b className="ctl-val">
                {c.kind === "switch" ? (value ? "开" : "关") : String(value)}
              </b>
            </span>
            {c.kind === "switch" ? (
              <button
                type="button"
                className={`ctl-switch${value ? " is-on" : ""}`}
                onClick={() => onChange(c.key, !value)}
                aria-pressed={Boolean(value)}
              >
                <i />
              </button>
            ) : c.kind === "select" ? (
              <select
                className="ctl-select"
                value={String(value)}
                onChange={(e) => onChange(c.key, e.target.value)}
              >
                {(c.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="ctl-range"
                type="range"
                min={c.min ?? 0}
                max={c.max ?? 100}
                step={c.step ?? 1}
                value={Number(value)}
                onChange={(e) => onChange(c.key, Number(e.target.value))}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

// ============ 事件日志 ============

export interface LogLine {
  id: number;
  at: string;
  text: string;
  kind: DemoLogKind;
}

export function EventLog({
  lines,
  title = "事件日志",
  empty = "还没触发 —— 试着滚动、点一张卡",
  right,
}: {
  lines: LogLine[];
  title?: string;
  empty?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="log">
      <div className="log-head">
        <span>{title}</span>
        <span className="log-right">
          {right}
          <b>{lines.length}</b>
        </span>
      </div>
      {lines.length === 0 ? (
        <p className="log-empty">{empty}</p>
      ) : (
        <ol className="log-list">
          {lines.map((l) => (
            <li key={l.id} className={`log-line is-${l.kind}`}>
              <time>{l.at}</time>
              <span>{l.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ============ 性能读数 ============

export interface Meter {
  total: number;
  rendered: number;
  totalHeight: number;
  layoutMs: number;
  scrolls: number;
  columns: number;
}

export const EMPTY_METER: Meter = {
  total: 0,
  rendered: 0,
  totalHeight: 0,
  layoutMs: 0,
  scrolls: 0,
  columns: 0,
};

export function PerfReadout({ meter }: { meter: Meter }) {
  const cells: Array<[string, string]> = [
    ["数据项", String(meter.total)],
    ["实际渲染", String(meter.rendered)],
    ["列数", String(meter.columns)],
    ["内容总高", `${Math.round(meter.totalHeight)}px`],
    ["最近布局", `${meter.layoutMs.toFixed(1)}ms`],
    ["滚动回调", String(meter.scrolls)],
  ];
  return (
    <div className="meter">
      {cells.map(([k, v]) => (
        <span className="meter-cell" key={k}>
          <em>{k}</em>
          <b>{v}</b>
        </span>
      ))}
    </div>
  );
}

// ============ 键位提示 ============

export function KeyHint({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="keyhint">
      {items.map(([k, v]) => (
        <span key={k}>
          <kbd>{k}</kbd>
          {v}
        </span>
      ))}
    </div>
  );
}
