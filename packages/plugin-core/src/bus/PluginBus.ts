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

  /**
   * 写入数据并**通知该键的订阅方**。
   *
   * 通知是必须的：插件的消费侧统一用 `bus.on(key, ...)` 订阅数据键
   * （vane-card 的 setupForceUpdateOnBusKeys、曝光/价格联动都靠它）。
   * 早期实现只 store.set 不 emit，导致「写进去了但订阅方永远收不到」——
   * 表现为选了规格主图不换、套了券合计不掉，而且不会有任何报错。
   */
  const setData = (key: string, value: any) => {
    const prev = store.get(key);
    store.set(key, value);
    if (prev !== value) emit(key, value);
  };

  /** 删除数据并通知订阅方（载荷为 undefined，便于区分「删掉」与「改成 falsy」） */
  const deleteData = (key: string) => {
    const existed = store.has(key);
    store.delete(key);
    if (existed) emit(key, undefined);
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
