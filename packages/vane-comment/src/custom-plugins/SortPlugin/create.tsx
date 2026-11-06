import React from "react";
import type {
  CommentData,
  CommentPlugin,
  CommentPluginContext,
  SortMode,
} from "../../components/CommentPlugin/plugins/types";
import { SortBar } from "./SortBar";
import doc from "./doc.json";

export interface SortPluginConfig {
  /** 排序栏展示的模式，默认 ["newest","hottest","mostLiked"] */
  modes?: SortMode[];
  /** 默认排序模式（仅在消费方未传 defaultSortMode 时播种），默认 "newest" */
  defaultMode?: SortMode;
}

/**
 * SortPlugin - 排序：顶栏渲染排序栏，切换经内核 state 驱动 CommentCore 列表重排。
 * 实际重排由 withCommentPlugins 的 extendContext（sortComments）完成，本插件仅提供控制面。
 *
 * 泛型默认值收敛为 CommentData（真实领域数据类型）；自定义 data 形态的调用方请显式写泛型参数。
 */
export function createSortPlugin<T = CommentData>(
  config: SortPluginConfig = {}
): CommentPlugin<T> {
  const modes = config.modes ?? ["newest", "hottest", "mostLiked"];
  const defaultMode = config.defaultMode ?? "newest";
  return {
    name: "SortPlugin",
    version: "0.1.0",
    description: "排序：顶栏渲染排序栏，切换 sortMode 驱动列表重排。",
    priority: 20,
    enabled: true,
    hooks: {
      // 仅在消费方未指定 defaultSortMode 时播种默认排序模式
      onMount: (context: CommentPluginContext<T>) => {
        if (
          context.state.sortMode === undefined &&
          (context.props as { defaultSortMode?: SortMode }).defaultSortMode ===
            undefined
        ) {
          context.setState({ sortMode: defaultMode });
        }
      },
      renderToolbar: (context: CommentPluginContext<T>) => (
        <SortBar context={context} modes={modes} />
      ),
    },
  };
}

export { doc };
