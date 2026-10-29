import React from "react";
import type { CommentNode } from "./plugins/types";

/**
 * 把结构化富内容（CommentNode[]）渲染为 React 节点。
 * 覆盖四种节点：text / emoji / image / mention。空内容回退到 text 兜底由调用方处理。
 */
export function renderCommentContent(nodes: CommentNode[]): React.ReactNode {
  if (!nodes || nodes.length === 0) return null;
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return (
          <span key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {node.value}
          </span>
        );
      case "emoji":
        return (
          <span key={i} style={{ fontSize: "1.1em", verticalAlign: "middle" }}>
            {node.value}
          </span>
        );
      case "image":
        return (
          <img
            key={i}
            src={node.url}
            alt={node.alt ?? ""}
            style={{
              maxWidth: 120,
              maxHeight: 120,
              borderRadius: 6,
              margin: "2px 4px 2px 0",
              verticalAlign: "middle",
              objectFit: "cover",
            }}
          />
        );
      case "mention":
        return (
          <span
            key={i}
            style={{ color: "#1565c0", fontWeight: 500 }}
          >{`@${node.name}`}</span>
        );
      default:
        return null;
    }
  });
}

/** 相对时间格式化（秒/分/时/天/月/年） */
export function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "刚刚";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} 个月前`;
  return `${Math.floor(month / 12)} 年前`;
}
