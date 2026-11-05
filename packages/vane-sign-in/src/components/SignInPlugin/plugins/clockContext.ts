import { createContext, useContext } from "react";

/**
 * 进程内共享的「当前时间」上下文：由 SignInClockProvider 每秒 tick 一次下发，
 * 所有订阅者的重渲染收敛到这一个定时器。
 *
 * 上下文与读取钩子单独成文件（clock.tsx 只导出 Provider 组件），以满足
 * react-refresh 的 Fast Refresh 约束。
 */
export const ClockContext = createContext<number | null>(null);

/**
 * 业务组件读取当前时间。
 *
 * 没有 Provider 时回退到 `Date.now()`（不依赖时钟上下文，也不报错），
 * 保证这些插件在独立挂载（测试 / Storybook）下仍可用。
 */
export function useSignInNow(): number {
  return useContext(ClockContext) ?? Date.now();
}
