import type { PluginBus } from "../types";

/**
 * 插件事件总线：发布订阅 + 跨插件数据共享。
 * 单个宿主组件实例一个 bus，随组件卸载自动 clear。
 */
export function createPluginBus(): PluginBus {
  const handlers = new Map<string, Set<(data: any) => void>>();
  const store = new Map<string, any>();

  const emit = (event: string, data?: any) => {
    const set = handlers.get(event);
    if (!set) return;
    // 拷贝一份，避免回调中增删 handler 影响本次派发
    for (const h of [...set]) {
      try {
        h(data);
      } catch (error) {
        console.warn(`[PluginBus] handler error for event "${event}"`, error);
      }
    }
  };

  const on = (event: string, handler: (data: any) => void) => {
    let set = handlers.get(event);
    if (!set) {
      set = new Set();
      handlers.set(event, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  };

  const once = (event: string, handler: (data: any) => void) => {
    const wrapper = (data: any) => {
      handler(data);
      off(event, wrapper);
    };
    return on(event, wrapper);
  };

  const off = (event: string, handler?: (data: any) => void) => {
    if (!handler) {
      handlers.delete(event);
      return;
    }
    handlers.get(event)?.delete(handler);
  };

  const getData = <T = any>(key: string): T | undefined => store.get(key);
  const setData = (key: string, value: any) => {
    store.set(key, value);
  };
  const deleteData = (key: string) => {
    store.delete(key);
  };
  const hasData = (key: string) => store.has(key);
  const getAll = () => {
    const result: Record<string, any> = {};
    store.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  };
  const clear = () => {
    handlers.clear();
    store.clear();
  };

  return { emit, on, once, off, getData, setData, deleteData, hasData, getAll, clear };
}
