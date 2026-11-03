import React, { useEffect, useState } from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityCheckinState,
  ActivityData,
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface CheckinCalendarPluginConfig extends ActivityPluginConfigBase {
  /** 标题（默认「连续签到」） */
  title?: string;
  /** 共几天（默认 data.checkin.days ?? 7） */
  days?: number;
  /** 已完成天数（默认 data.checkin.done ?? 0） */
  done?: number;
  /** 今天格子下标 0-based（默认 data.checkin.todayIndex ?? done） */
  todayIndex?: number;
  /** 签到回调；不传则组件内乐观 +1（无后端场景） */
  onCheckin?: () => void;
  /** 是否显示签到按钮（默认 true） */
  showButton?: boolean;
}

/** P2-5：把接口传入的 days / done / todayIndex 夹到合法范围，避免超大渲染或越界。 */
function clampInt(value: number, min: number, max: number, fallback: number): number {
  const n = Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function CheckinCalendar({
  ctx,
  title,
  days: daysProp,
  done: doneProp,
  todayIndex: todayProp,
  onCheckin,
  showButton,
}: {
  ctx: ActivityPluginContext;
  title: string;
  days: number;
  done: number;
  todayIndex?: number;
  onCheckin?: () => void;
  showButton: boolean;
}) {
  const state = (ctx.data as ActivityData | undefined)?.checkin as
    | ActivityCheckinState
    | undefined;
  const days = clampInt(state?.days ?? daysProp, 1, 31, 7);
  const baseDone = clampInt(state?.done ?? doneProp, 0, days, 0);
  const todayIndex = clampInt(
    state?.todayIndex ?? todayProp ?? baseDone,
    0,
    Math.max(0, days - 1),
    0
  );

  const [done, setDone] = useState(baseDone);
  // 业务侧回写 data.checkin.done 后同步本地乐观态
  useEffect(() => setDone(baseDone), [baseDone]);

  const finished = done >= days;
  const signedToday = done > todayIndex || finished;

  const handleCheckin = () => {
    if (signedToday) return;
    if (onCheckin) {
      onCheckin();
      return;
    }
    setDone((d) => Math.min(days, d + 1));
  };

  return (
    <section
      aria-label={title}
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(128,128,128,0.18)",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1f2328" }}>
          {title}
        </span>
        <span style={{ fontSize: 12, color: "#5d636a" }}>
          已连续 <strong style={{ color: "#1f2328" }}>{done}</strong>/{days} 天
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {Array.from({ length: days }, (_, i) => {
          const isDone = i < done;
          const isToday = i === todayIndex && !isDone && !finished;
          const bg = isDone ? "#cf4407" : "#fff";
          const border = isDone
            ? "1px solid #cf4407"
            : isToday
              ? "1px dashed #cf4407"
              : "1px solid rgba(128,128,128,0.22)";
          const color = isDone ? "#fff" : isToday ? "#cf4407" : "#5d636a";
          return (
            <div
              key={i}
              data-testid="checkin-cell"
              aria-label={`第 ${i + 1} 天${isDone ? "已签到" : isToday ? "待签到" : "未开始"}`}
              style={{
                flex: 1,
                minWidth: 0,
                height: 46,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                borderRadius: 8,
                background: bg,
                border,
                color,
                transition: "background .2s ease",
              }}
            >
              {/* 白字压 #cf4407 必须 full opacity：0.9 会跌到 4.06:1（ADR-13 禁 opacity 压字） */}
              <span style={{ fontSize: 11, lineHeight: 1.3 }}>
                {i + 1}天
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>
                {isDone ? "✓" : isToday ? "今" : "·"}
              </span>
            </div>
          );
        })}
      </div>

      {showButton && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ flex: 1, fontSize: 12, lineHeight: 1.6, color: "#5d636a" }}>
            {finished
              ? "本轮签到已完成，奖励已全部发放"
              : signedToday
                ? "今天已签到，明天再来"
                : `签满 ${days} 天可得终极大礼包`}
          </span>
          <button
            type="button"
            disabled={signedToday}
            onClick={handleCheckin}
            style={{
              flex: "none",
              border: "none",
              borderRadius: 999,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              /* 可点 #cf4407 白字 4.69:1；已完成 #5d636a 白字 6.0:1 */
              background: signedToday ? "#5d636a" : "#cf4407",
              color: "#fff",
              cursor: signedToday ? "default" : "pointer",
            }}
          >
            {finished ? "已完成" : signedToday ? "已签到" : "今日签到"}
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * CheckinCalendarPlugin - 签到日历：N 格进度（已签 / 今日 / 未开始三态）+ 连续天数 + 签到按钮。
 *
 * 落在 renderProgress 槽，与进度条 / 环 / 里程碑同槽共存（靠 order 定上下）。
 * 数据来自 data.checkin（days / done / todayIndex）；不传时回退 config 的 days / done。
 */
export const createCheckinCalendarPlugin: PluginCreator<
  CheckinCalendarPluginConfig
> = (config = {}) => {
  const {
    title = "连续签到",
    days = 7,
    done = 0,
    todayIndex,
    onCheckin,
    showButton = true,
  } = config;

  return {
    name: "CheckinCalendarPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    config,
    hooks: {
      renderProgress: (context: ActivityPluginContext) => (
        <CheckinCalendar
          ctx={context}
          title={title}
          days={days}
          done={done}
          todayIndex={todayIndex}
          onCheckin={onCheckin}
          showButton={showButton}
        />
      ),
    },
  };
};

createCheckinCalendarPlugin.meta = doc as PluginDoc;
