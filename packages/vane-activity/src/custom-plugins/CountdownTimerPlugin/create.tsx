import React, { useEffect, useState } from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
  ActivityData,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface CountdownTimerPluginConfig extends ActivityPluginConfigBase {
  /** 截止时间（ISO 字符串或时间戳）；不传则回退读 data.endTime */
  endTime?: string | number;
  /** 前缀文案（默认「距活动结束」） */
  label?: string;
  /** 剩余不足该毫秒数时进入紧急态（文字变警示色，默认 1 小时） */
  urgentMs?: number;
}

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
function Countdown({
  end,
  label,
  urgentMs,
}: {
  end: number;
  label: string;
  urgentMs: number;
}) {
  const [left, setLeft] = useState(() => remainingMs(end));
  useEffect(() => {
    if (remainingMs(end) <= 0) return;
    const timer = window.setInterval(() => setLeft(remainingMs(end)), 1000);
    return () => window.clearInterval(timer);
  }, [end]);

  const urgent = left > 0 && left <= urgentMs;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 12 }}>
      <span style={{ color: "#5d636a" }}>{label}</span>
      <span
        role="timer"
        aria-label={`剩余 ${format(left)}`}
        style={{
          fontFamily: "var(--ff-mono, ui-monospace, monospace)",
          fontSize: 14,
          fontWeight: 700,
          color: left === 0 ? "#5d636a" : urgent ? "#cf4407" : "#1f2328",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {left === 0 ? "已结束" : format(left)}
      </span>
    </div>
  );
}

/**
 * CountdownTimerPlugin - 活动倒计时：renderProgress 槽位在进度条下方追加一行
 * 「距活动结束 x天HH:MM:SS」。截止时间优先取工厂配置，否则回退 data.endTime；
 * 都没有则不渲染。与 ProgressFx 同槽共存（互不独占）。
 */
export const createCountdownTimerPlugin: PluginCreator<CountdownTimerPluginConfig> = (
  config = {}
) => {
  const { endTime, label = "距活动结束", urgentMs = 3600_000 } = config;

  return {
    name: "CountdownTimerPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 12,
    config,
    hooks: {
      renderProgress: (context: ActivityPluginContext<any>) => {
        const raw = endTime ?? (context.data as ActivityData | undefined)?.endTime;
        if (raw === undefined) return null;
        const end = typeof raw === "number" ? raw : new Date(raw).getTime();
        if (!Number.isFinite(end)) return null;
        return <Countdown end={end} label={label} urgentMs={urgentMs} />;
      },
    },
  };
};

createCountdownTimerPlugin.meta = doc as PluginDoc;
