import React, { useEffect, useRef, useState } from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface ClaimToastPluginConfig extends ActivityPluginConfigBase {
  /** 单条 toast 停留时长（ms，默认 2400） */
  durationMs?: number;
  /** 同屏最多几条（默认 3），超出丢弃最早的 */
  max?: number;
  /** 出现位置（默认 bottom-right） */
  position?: "bottom-right" | "top-center";
  /** 自定义文案，默认「已领取：{title}」 */
  message?: (title: string) => string;
}

interface ToastItem {
  key: string;
  text: string;
}

/** 单条 toast：挂载后下一帧切到 show 态，让 transition 真正跑一次入场动画 */
function ToastCard({ text }: { text: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        maxWidth: 260,
        padding: "9px 12px",
        borderRadius: 10,
        /* 深底白字（ADR-13）：#fff on #1f2328 ≈ 14.6:1 */
        background: "#1f2328",
        color: "#fff",
        fontSize: 13,
        lineHeight: 1.5,
        boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(8px)",
        transition: "opacity .22s ease, transform .22s ease",
        pointerEvents: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: "none",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#15803d",
          color: "#fff",
          fontSize: 11,
          lineHeight: "16px",
          textAlign: "center",
        }}
      >
        ✓
      </span>
      <span>{text}</span>
    </div>
  );
}

function ClaimToastLayer({
  ctx,
  durationMs,
  max,
  position,
  message,
}: {
  ctx: ActivityPluginContext;
  durationMs: number;
  max: number;
  position: "bottom-right" | "top-center";
  message?: (title: string) => string;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  // 已处理过的领取 id（首屏已有的领取记录不弹，只弹「本次会话新增」）
  const seenRef = useRef<string[]>([...(ctx.claimedIds ?? [])]);
  const idsKey = (ctx.claimedIds ?? []).join("|");
  // 每条 toast 独立计时：连续领取时不会被下一批的 effect cleanup 取消。
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // 仅卸载时统一清理所有计时器。
  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
    },
    []
  );

  useEffect(() => {
    const prev = seenRef.current;
    const ids = ctx.claimedIds ?? [];
    const added = ids.filter((id) => !prev.includes(id));
    seenRef.current = ids;
    if (added.length === 0) return;

    const rewards = ctx.rewards ?? [];
    const fresh = added.map((id, i) => ({
      key: `${id}-${Date.now()}-${i}`,
      text:
        message?.(rewards.find((r) => r.id === id)?.title ?? "奖励") ??
        `已领取：${rewards.find((r) => r.id === id)?.title ?? "奖励"}`,
    }));

    setItems((cur) => {
      const next = [...cur, ...fresh];
      // 超出 max 被挤掉的条目，连带取消它自己的计时器。
      const evicted = next.slice(0, Math.max(0, next.length - max));
      for (const it of evicted) {
        const timer = timersRef.current.get(it.key);
        if (timer !== undefined) {
          clearTimeout(timer);
          timersRef.current.delete(it.key);
        }
      }
      return next.slice(-max);
    });

    for (const item of fresh) {
      const timer = setTimeout(() => {
        timersRef.current.delete(item.key);
        setItems((cur) => cur.filter((it) => it.key !== item.key));
      }, durationMs);
      timersRef.current.set(item.key, timer);
    }
    // idsKey 是 claimedIds 的稳定内容指纹；ctx 每次渲染都是新对象，不能进依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, durationMs, max]);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
        ...(position === "top-center"
          ? { top: 12, left: "50%", transform: "translateX(-50%)", alignItems: "center" }
          : { bottom: 12, right: 12, alignItems: "flex-end" }),
      }}
    >
      {items.map((it) => (
        <ToastCard key={it.key} text={it.text} />
      ))}
    </div>
  );
}

/**
 * ClaimToastPlugin - 领取成功轻提示：监听 ctx.claimedIds 新增项，在右下角浮出
 * 「已领取：xx」并自动消失。与 ConfettiPlugin（全屏庆祝）正交互补：一个重度仪式感，
 * 一个轻量确认。
 *
 * 首屏已存在的领取记录不会补弹（seenRef 初始化为挂载时的 claimedIds）。
 */
export const createClaimToastPlugin: PluginCreator<ClaimToastPluginConfig> = (
  config = {}
) => {
  const {
    durationMs = 2400,
    max = 3,
    position = "bottom-right",
    message,
  } = config;

  return {
    name: "ClaimToastPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 55,
    config,
    hooks: {
      renderOverlay: (context: ActivityPluginContext) => (
        <ClaimToastLayer
          ctx={context}
          durationMs={durationMs}
          max={max}
          position={position}
          message={message}
        />
      ),
    },
  };
};

createClaimToastPlugin.meta = doc as PluginDoc;
