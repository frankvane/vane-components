import React from "react";
import type { CommentPluginContext } from "../../components/CommentPlugin/plugins/types";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(128,128,128,0.3)",
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: 13,
  background: "transparent",
  color: "inherit",
  outline: "none",
  width: 140,
};

/** 搜索框：输入写 state.query，transformData 按关键词过滤 */
export function SearchBox<T>({ context }: { context: CommentPluginContext<T> }) {
  const raw = context.state.query;
  const query = typeof raw === "string" ? raw : "";
  return (
    <input
      data-testid="comment-search"
      value={query}
      onChange={(e) => context.setState({ query: e.target.value })}
      placeholder="搜索评论…"
      style={inputStyle}
    />
  );
}
