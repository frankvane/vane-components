/**
 * JackpotPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { JackpotDrawResult, JackpotPrize } from "./create";

const DEFAULT_PRIZES: JackpotPrize[] = [
  { id: "p1", label: "5 元券", icon: "🎟️" },
  { id: "p2", label: "谢谢参与", icon: "🍬" },
  { id: "p3", label: "20 积分", icon: "⭐" },
  { id: "p4", label: "会员 7 天", icon: "💎" },
  { id: "p5", label: "1 元红包", icon: "🧧" },
  { id: "p6", label: "谢谢参与", icon: "🍬" },
  { id: "p7", label: "免邮券", icon: "📦" },
  { id: "p8", label: "100 积分", icon: "🌟" },
];

/** 九宫格布局：中心是按钮，其余 8 格按环形排布（0-3 在按钮前，5-8 依次在后） */
const CELL_SLOTS = [0, 1, 2, 3, -1, 4, 5, 6, 7];

// 静态样式提到模块级：既压缩产物，也避免每帧 new 一堆同内容对象。
const CARD_STYLE: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(128,128,128,0.18)",
  background: "#fff",
};
const HEAD_STYLE: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const TITLE_STYLE: React.CSSProperties = {
  flex: 1,
  fontSize: 14,
  fontWeight: 600,
  color: "#1f2328",
};
const META_STYLE: React.CSSProperties = { fontSize: 12, color: "#5d636a" };
const STRONG_STYLE: React.CSSProperties = { color: "#1f2328" };
const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  marginTop: 10,
};
const BUTTON_STYLE: React.CSSProperties = {
  gridColumn: "auto",
  border: "none",
  borderRadius: 10,
  minHeight: 56,
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.4,
  color: "#fff",
};
const CELL_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  minHeight: 56,
  borderRadius: 10,
  transition: "background .12s ease, color .12s ease",
  border: "1px solid rgba(207,68,7,0.16)",
};
const ICON_STYLE: React.CSSProperties = { fontSize: 17, lineHeight: 1 };
const LABEL_STYLE: React.CSSProperties = { fontSize: 11, lineHeight: 1.4, textAlign: "center" };
const MSG_STYLE: React.CSSProperties = {
  margin: "10px 0 0",
  minHeight: 20,
  fontSize: 12,
  lineHeight: 1.7,
};

export function JackpotCard({
  title,
  prizes,
  times,
  remainingTimes,
  drawResult,
  onDraw,
}: {
  title: string;
  prizes: JackpotPrize[];
  times: number;
  remainingTimes?: number;
  drawResult?: () => JackpotDrawResult | Promise<JackpotDrawResult>;
  onDraw?: (prize: JackpotPrize, index: number) => void;
}) {
  const cells = useMemo(() => {
    const list = prizes.length > 0 ? prizes.slice(0, 8) : DEFAULT_PRIZES;
    const filled = [...list];
    while (filled.length < 8) {
      filled.push({ id: `pad-${filled.length}`, label: "谢谢参与", icon: "🍬" });
    }
    return filled;
  }, [prizes]);

  const [localRemaining, setLocalRemaining] = useState(times);
  const [active, setActive] = useState(-1);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  // 受控优先：remainingTimes 传入时以宿主/服务端为准，组件不自行递减。
  // P2-5：次数夹到 0..999，脏数据（NaN / 负数 / 超大值）不参与按钮状态判断。
  const rawRemaining = remainingTimes ?? localRemaining;
  const remaining = Number.isFinite(rawRemaining)
    ? Math.max(0, Math.min(999, Math.floor(rawRemaining)))
    : 0;

  // 抽奖过程是一串 setTimeout；卸载必须清干净，否则会对着已卸载组件 setState
  const timers = useRef<number[]>([]);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      timers.current.forEach((id) => clearTimeout(id));
      timers.current = [];
    };
  }, []);

  const draw = async () => {
    if (drawing || remaining <= 0) return;
    setDrawing(true);
    setResult(null);

    let winner: number;
    let nextRemaining: number | undefined;
    try {
      if (drawResult) {
        // 服务端权威：中奖格与剩余次数都由业务侧决定。
        const res = await drawResult();
        if (!alive.current) return;
        if (!Number.isFinite(res.index)) {
          throw new Error("drawResult 返回的 index 不是有效数字");
        }
        winner = Math.max(
          0,
          Math.min(cells.length - 1, Math.floor(res.index))
        );
        nextRemaining = res.remaining;
      } else {
        winner = Math.floor(Math.random() * cells.length);
      }
    } catch (err) {
      if (!alive.current) return;
      setDrawing(false);
      setResult("抽奖请求失败，请稍后重试");
      console.warn("[vane-activity] Jackpot drawResult 执行失败", err);
      return;
    }
    if (!alive.current) return;

    // 非受控：优先采用服务端返回的剩余次数，否则本地自减。
    if (remainingTimes === undefined) {
      setLocalRemaining((prev) =>
        typeof nextRemaining === "number" && Number.isFinite(nextRemaining)
          ? Math.max(0, Math.floor(nextRemaining))
          : Math.max(0, prev - 1)
      );
    }

    // 至少转两圈再停，停的位置一定是 winner：steps-1 ≡ winner (mod 8)
    const steps = cells.length * 2 + winner + 1;
    let step = 0;

    const tick = () => {
      if (!alive.current) return;
      step += 1;
      setActive((step - 1) % cells.length);
      if (step < steps) {
        // 逐渐减速，观感更像转盘
        timers.current.push(window.setTimeout(tick, 60 + step * 5));
      } else {
        timers.current = [];
        setDrawing(false);
        const prize = cells[winner];
        setResult(`恭喜获得「${prize.label}」`);
        onDraw?.(prize, winner);
      }
    };
    tick();
  };

  const exhausted = remaining <= 0;

  return (
    <section aria-label={title} style={CARD_STYLE}>
      <div style={HEAD_STYLE}>
        <span style={TITLE_STYLE}>{title}</span>
        <span style={META_STYLE}>
          剩余 <strong style={STRONG_STYLE}>{remaining}</strong> 次
        </span>
      </div>

      <div role="group" aria-label="抽奖九宫格" style={GRID_STYLE}>
        {CELL_SLOTS.map((slot) => {
          if (slot === -1) {
            return (
              <button
                key="btn"
                type="button"
                disabled={drawing || exhausted}
                onClick={draw}
                style={{
                  ...BUTTON_STYLE,
                  /* 可点 #cf4407 4.69:1；抽取中 #a33a06 6.6:1；抽完 #5d636a 6.0:1 */
                  background: drawing ? "#a33a06" : exhausted ? "#5d636a" : "#cf4407",
                  cursor: drawing || exhausted ? "default" : "pointer",
                }}
              >
                {drawing ? "抽取中" : exhausted ? "已抽完" : "抽一次"}
              </button>
            );
          }
          const cell = cells[slot];
          const isActive = active === slot;
          return (
            <div
              key={cell.id}
              data-testid="jackpot-cell"
              data-active={isActive ? "1" : undefined}
              style={{
                ...CELL_STYLE,
                background: isActive ? "#cf4407" : "#fff7ef",
                color: isActive ? "#fff" : "#1f2328",
              }}
            >
              <span aria-hidden="true" style={ICON_STYLE}>
                {cell.icon ?? "🎁"}
              </span>
              <span style={LABEL_STYLE}>{cell.label}</span>
            </div>
          );
        })}
      </div>

      <p
        aria-live="polite"
        style={{
          ...MSG_STYLE,
          /* 中奖 #a33a06 压白底 6.6:1；未抽时用 muted */
          color: result ? "#a33a06" : "#5d636a",
          fontWeight: result ? 600 : 400,
        }}
      >
        {drawing
          ? "转动中，祝你好运…"
          : (result ??
            (exhausted
              ? "今日次数已用完，明天再来"
              : `共 ${cells.length} 个奖励格，点击中间按钮开抽`))}
      </p>
    </section>
  );
}
