/**
 * PluginBus - 插件事件总线
 * 用于插件间的通信和数据共享
 */

import type { PluginBus } from "./types";

export function createPluginBus(): PluginBus {
  const handlers = new Map<string, Set<(data: any) => void>>();
  const store = new Map<string, any>();

  // 发布事件
  const emit = (event: string, data?: any) => {
    const set = handlers.get(event);
    if (!set) return;
    for (const h of set) {
      try {
        h(data);
      } catch (e) {
        // 忽略单个处理器错误，避免中断事件传播
        console.warn(`[PluginBus] handler error for event "${event}"`, e);
      }
    }
  };

  // 订阅事件
  const on = (event: string, handler: (data: any) => void) => {
    let set = handlers.get(event);
    if (!set) {
      set = new Set();
      handlers.set(event, set);
    }
    set.add(handler);
    // 返回取消订阅函数
    return () => {
      set?.delete(handler);
    };
  };

  // 订阅事件（只触发一次）
  const once = (event: string, handler: (data: any) => void) => {
    const wrapper = (data: any) => {
      handler(data);
      off(event, wrapper);
    };
    return on(event, wrapper);
  };

  // 取消订阅
  const off = (event: string, handler?: (data: any) => void) => {
    if (!handler) {
      // 如果没有指定 handler，则清空该事件的所有订阅
      handlers.delete(event);
      return;
    }
    const set = handlers.get(event);
    if (set) {
      set.delete(handler);
    }
  };

  // 获取数据
  const getData = <T = any>(key: string): T | undefined => {
    return store.get(key);
  };

  // 设置数据
  const setData = <T = any>(key: string, value: T) => {
    store.set(key, value);
  };

  // 删除数据
  const deleteData = (key: string) => {
    store.delete(key);
  };

  // 检查是否存在数据
  const hasData = (key: string): boolean => {
    return store.has(key);
  };

  // 获取所有数据
  const getAll = (): Record<string, any> => {
    const result: Record<string, any> = {};
    store.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  };

  // 清空所有数据和事件订阅
  const clear = () => {
    handlers.clear();
    store.clear();
  };

  return {
    emit,
    on,
    once,
    off,
    getData,
    setData,
    deleteData,
    hasData,
    getAll,
    clear,
  };
}
