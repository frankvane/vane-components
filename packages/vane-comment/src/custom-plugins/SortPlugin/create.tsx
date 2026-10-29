import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  SortMode,
} from "../../components/CommentPlugin/plugins/types";
import { SORT_LABELS } from "../../components/CommentPlugin/sort";
import doc from "./doc.json";

export interface SortPluginConfig {
  /** 排序栏展示的模式，默认 ["newest","hottest","mostLiked"] */
  modes?: SortMode[];
  /** 默认排序模式（仅在消费方未传 defaultSortMode 时播种），默认 "newest" */
  defaultMode?: SortMode;
}

/** 排序栏：渲染模式按钮，点击切换 sortMode（写内核 state → 列表重排） */
function SortBar({
  context,
  modes,
}: {
  context: CommentPluginContext<any>;
  modes: SortMode[];
}) {
  const active = context.sortMode;
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {modes.map((mode) => {
        const isActive = active === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => {
              context.setSortMode(mode);
              (context.props.onSortChange as ((m: SortMode) => void) | undefined)?.(
                mode
              );
            }}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 13,
              cursor: "pointer",
              background: isActive ? "rgba(29,161,242,0.16)" : "transparent",
              color: isActive ? "#1da1f2" : "inherit",
              opacity: isActive ? 1 : 0.7,
            }}
          >
            {SORT_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * SortPlugin - 排序：顶栏渲染排序栏，切换经内核 state 驱动 CommentCore 列表重排。
 * 实际重排由 withCommentPlugins 的 extendContext（sortComments）完成，本插件仅提供控制面。
 */
export function createSortPlugin<T = any>(
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
