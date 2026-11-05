import React from "react";
import type {
  CommentPluginContext,
  SortMode,
} from "../../components/CommentPlugin/plugins/types";
import { SORT_LABELS } from "../../components/CommentPlugin/sort";

/** 排序栏：渲染模式按钮，点击切换 sortMode（写内核 state → 列表重排） */
export function SortBar<T>({
  context,
  modes,
}: {
  context: CommentPluginContext<T>;
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
              color: isActive ? "#1565c0" : "inherit",
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
