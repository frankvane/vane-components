/**
 * 插件通信总线
 * 用于插件间通信和数据共享
 */

import type { PluginBus } from "./types";

export function createPluginBus(): PluginBus {
  const listeners = new Map<string, Array<(data: any) => void>>();
  const dataStore = new Map<string, any>();

  const emit = (event: string, data: any) => {
    const handlers = listeners.get(event);
    if (!handlers) return;
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.warn(
          `[PluginBus] Error in event handler for "${event}"`,
          error
        );
      }
    });
  };

  const on = (event: string, handler: (data: any) => void): (() => void) => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event)!.push(handler);

    // 返回取消订阅函数
    return () => {
      const handlers = listeners.get(event);
      if (!handlers) return;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  };

  const getData = (key: string): any => {
    return dataStore.get(key);
  };

  const setData = (key: string, value: any): void => {
    dataStore.set(key, value);
  };

  return { emit, on, getData, setData };
}
