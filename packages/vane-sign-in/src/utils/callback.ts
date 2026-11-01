/**
 * 业务回调调用的统一入口。
 *
 * 旧实现直接 `ctx.callbacks.sign?.()`：同步抛错会炸掉整个插件渲染段，
 * Promise reject 无人接管（静默失败），UI 停在「可点」状态。
 * 这里把所有结果归一成 Promise，让调用方用一个 try/catch 同时接住同步与异步失败。
 */

import type { SignInCallbackResult } from "../components/SignInPlugin/plugins/types";

/**
 * 调用业务回调并归一为 Promise：
 *  - 未提供回调 → 直接 resolve（当作成功，不阻塞 UI）；
 *  - 同步返回 → resolve；
 *  - 同步抛错 / Promise reject → reject，交调用方展示反馈。
 */
export function invokeCallback<Args extends unknown[]>(
  callback: ((...args: Args) => SignInCallbackResult) | undefined,
  ...args: Args
): Promise<void> {
  if (!callback) return Promise.resolve();
  try {
    const result = callback(...args);
    if (result && typeof (result as Promise<void>).then === "function") {
      return Promise.resolve(result as Promise<void>);
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

/** 从任意错误值里取出可展示文案，取不到时用 fallback。 */
export function resolveErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}
