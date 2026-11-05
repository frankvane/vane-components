import type { PluginBus } from "../types";

/**
 * 插件事件总线：发布订阅 + 跨插件数据共享。
 * 单个宿主组件实例一个 bus，随组件卸载自动 clear。
 */
export function createPluginBus(): PluginBus {
  /** 存储侧事件载荷已擦除为 unknown；对外的泛型签名由 PluginBus 接口保证 */
  type Handler = (data: unknown) => void;
  const handlers = new Map<string, Set<Handler>>();
  const store = new Map<string, unknown>();
  /** 联动写入深度：A→B→A 这类互相触发的事件不能无限递归 */
  let depth = 0;

  const emit = (event: string, data?: unknown) => {
    const set = handlers.get(event);
    if (!set) return;
    if (depth >= 50) {
      console.warn(`[PluginBus] emit depth exceeded: "${event}"`);
      return;
    }
    depth += 1;
    // 拷贝一份，避免回调中增删 handler 影响本次派发
    for (const h of [...set]) {
      try {
        h(data);
      } catch (error) {
        console.warn(`[PluginBus] handler error for event "${event}"`, error);
      }
    }
    depth -= 1;
  };

  const on = <T = unknown>(event: string, handler: (data: T) => void) => {
    let set = handlers.get(event);
    if (!set) {
      set = new Set();
      handlers.set(event, set);
    }
    // 载荷类型在存储侧擦除，只保留「可接收任意值」的调用形态
    const entry = handler as Handler;
    set.add(entry);
    return () => {
      set?.delete(entry);
    };
  };

  const once = <T = unknown>(event: string, handler: (data: T) => void) => {
    const wrapper: Handler = (data) => {
      // handler 抛错也要注销，否则下一次 emit 还会再调一次
      try {
        handler(data as T);
      } finally {
        off(event, wrapper);
      }
    };
    return on(event, wrapper);
  };

  const off = (event: string, handler?: Handler) => {
    if (!handler) {
      handlers.delete(event);
      return;
    }
    handlers.get(event)?.delete(handler);
  };

  const getData = <T = unknown>(key: string): T | undefined =>
    store.get(key) as T | undefined;

  /**
   * 写入数据并**通知该键的订阅方**。
   *
   * 通知是必须的：插件的消费侧统一用 `bus.on(key, ...)` 订阅数据键
   * （vane-card 的 setupForceUpdateOnBusKeys、曝光/价格联动都靠它）。
   * 早期实现只 store.set 不 emit，导致「写进去了但订阅方永远收不到」——
   * 表现为选了规格主图不换、套了券合计不掉，而且不会有任何报错。
   */
  const setData = <T = unknown>(key: string, value: T) => {
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
    // 无原型对象：即使键名是 __proto__ / constructor，也只当普通数据，不污染原型
    const result: Record<string, unknown> = Object.create(null);
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
