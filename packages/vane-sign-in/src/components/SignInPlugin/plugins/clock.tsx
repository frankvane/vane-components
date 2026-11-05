/**
 * 签到时钟：解决「页面跨夜不复位」「倒计时不 tick」。
 *
 * 只做一件事：每秒向消费者提供一个 `now`（epoch 毫秒）。Provider 放在 SignInCore
 * 内层，`children` 是父级 memo 过的同一份元素，因此心跳只会让 `useSignInNow()`
 * 的消费者（Countdown / TodayCheckIn 的子组件）重渲染，不会每秒重跑五段领域槽。
 *
 * 同时监听 `visibilitychange` / `focus`：页面回到前台先立刻校正一次 now，
 * 再触发宿主的 `callbacks.refresh()`（拿到最新的 todaySigned / nextResetAt）。
 */

import React, { useEffect, useState } from "react";
import { ClockContext } from "./clockContext";

export interface SignInClockProviderProps {
  children: React.ReactNode;
  /** 回到前台时的额外动作（通常是宿主 refresh）；需由调用方用 useCallback 稳定引用 */
  onResume?: () => void;
  /** 心跳间隔，默认 1000ms */
  intervalMs?: number;
}

export function SignInClockProvider({
  children,
  onResume,
  intervalMs = 1000,
}: SignInClockProviderProps) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }
    const handleResume = () => {
      if (document.visibilityState === "hidden") return;
      setNow(Date.now());
      onResume?.();
    };
    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, [onResume]);

  return (
    <ClockContext.Provider value={now}>{children}</ClockContext.Provider>
  );
}
