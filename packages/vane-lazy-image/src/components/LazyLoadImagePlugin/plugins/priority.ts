/**
 * 领域 priority → 内核 priority 适配。
 *
 * 领域语义（lazy-image 历史约定）：数字越小越优先，默认 100。
 * 内核语义（@vane/plugin-core）：数字越大越优先，默认 0。
 * 本模块是两者唯一的转换点，插件源码只写领域语义。
 */

import type { LazyImagePlugin } from "./types";
import type { Plugin } from "@vane/plugin-core";

/** 领域 priority 基准值：kernelPriority = BASE - domainPriority */
export const DOMAIN_PRIORITY_BASE = 1000;
/** 领域默认优先级（未声明时的值） */
export const DOMAIN_PRIORITY_DEFAULT = 100;

/** 领域插件 → 内核插件（priority 语义转换，不改动传入对象） */
export function toKernelPlugin(plugin: LazyImagePlugin): Plugin<any, any> {
  const domainPriority = plugin.priority ?? DOMAIN_PRIORITY_DEFAULT;
  return {
    ...plugin,
    priority: DOMAIN_PRIORITY_BASE - domainPriority,
  } as Plugin<any, any>;
}

/** 批量转换（保持顺序） */
export function toKernelPlugins(plugins: LazyImagePlugin[]): Plugin<any, any>[] {
  return plugins.map(toKernelPlugin);
}
