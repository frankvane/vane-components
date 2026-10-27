/**
 * `sharedData` 的读写钩子 —— 工具栏与正文共享状态的**唯一**写法。
 *
 * ## 为什么需要它
 *
 * `sharedData` 是普通 `Map`，**不是响应式的**。接线方式只有一条：
 * 写进去、然后 `context.forceUpdate()` 让装配层重渲染一次。
 * 迁移前没人这么干，于是出现了「工具栏百分比不跟手」：Image 插件把缩放值存了三份
 * （组件 state / sharedData / bus 事件互追），工具栏读 sharedData 拿到的是上次快照。
 * Code 插件更夸张，五份状态各存两份 + 4 条 bus 事件同步 + 一个 100ms 的
 * `setTimeout` 补丁 —— 全都为了让工具栏能看见正文的状态。
 *
 * ## 用法
 *
 * ```tsx
 * const [theme, setTheme] = useSharedValue(context, "code:theme", "auto");
 * ```
 *
 * 读的是**本次渲染时**的值，不做本地副本 —— 本地副本就是迁移前三份状态互相追的起点。
 * key 全部带插件前缀（`code:` / `csv:` / `md:`）：`sharedData` 是一张跨插件的表，
 * 裸 key（`theme`、`scale`）在安装多个插件时会互相踩。
 */

import { useCallback } from "react";

import type { FilePreviewPluginContext } from "../plugins/types";

export function useSharedValue<T>(
  context: FilePreviewPluginContext,
  key: string,
  fallback: T
): [T, (next: T) => void] {
  const value = (context.sharedData.get(key) as T | undefined) ?? fallback;
  const setValue = useCallback(
    (next: T) => {
      context.sharedData.set(key, next);
      context.forceUpdate();
    },
    [context, key]
  );
  return [value, setValue];
}
