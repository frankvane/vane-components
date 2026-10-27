/**
 * 统一插件配置默认值应用的工具方法
 */
export function applyDefaults<T extends Record<string, any>>(config: Partial<T> | undefined, defaults: T): T {
  return { ...defaults, ...(config || {}) } as T;
}