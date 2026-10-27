import type React from "react";
import type { PluginContext, PluginHooks } from "vane-plugin-core";

/**
 * 领域类型：核心组件 props / ref + 领域钩子。
 * 这是每个组件包里唯一需要"自己写"的类型层，其余全部来自 vane-plugin-core。
 */

export interface __NAME__Item {
  id: string;
  /** 任意业务数据 */
  [key: string]: any;
}

export interface __NAME__CoreProps {
  items: __NAME__Item[];
  renderItem: (item: __NAME__Item, index: number) => React.ReactNode;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  onMount?: () => void;
  onUnmount?: () => void;
  debug?: boolean;
  /** 由 withPlugins 注入，插件通过 ctx.refs.container 拿到同一个引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
}

export interface __NAME__CoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
}

/** 领域钩子：在这里扩展通用 PluginHooks */
export interface __NAME__PluginHooks
  extends PluginHooks<__NAME__CoreProps> {
  /** 每个 item 渲染前调用，返回 false 跳过该项 */
  filterItem?: (
    context: __NAME__PluginContext,
    item: __NAME__Item,
    index: number
  ) => boolean;
}

export type __NAME__PluginContext = PluginContext<__NAME__CoreProps>;
