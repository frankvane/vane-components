/**
 * LeaderboardPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import React, { useMemo } from "react";
import type {
  ActivityData,
  ActivityLeaderboardEntry,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";

/** 名次牌配色：第一名强调橙，其余深灰；两者白字均 ≥5:1 */
function medalStyle(rank: number): React.CSSProperties {
  if (rank === 1) return { background: "#cf4407", color: "#fff" };
  if (rank <= 3) return { background: "#5d636a", color: "#fff" };
  return { background: "rgba(128,128,128,0.14)", color: "#5d636a" };
}

function LeaderRow({
  entry,
  rank,
  unit,
  highlightMe,
}: {
  entry: ActivityLeaderboardEntry;
  rank: number;
  unit: string;
  highlightMe: boolean;
}) {
  const me = highlightMe && entry.isMe;
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 8px",
        borderRadius: 8,
        background: me ? "rgba(207,68,7,0.08)" : "transparent",
      }}
    >
      <span
        aria-label={`第 ${rank} 名`}
        style={{
          flex: "none",
          width: 20,
          height: 20,
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          lineHeight: "20px",
          textAlign: "center",
          ...medalStyle(rank),
        }}
      >
        {rank}
      </span>
      <span
        aria-hidden="true"
        style={{
          flex: "none",
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "rgba(207,68,7,0.1)",
          color: "#a33a06",
          fontSize: 12,
          lineHeight: "26px",
          textAlign: "center",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {entry.avatar ?? entry.name.slice(0, 1)}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          color: "#1f2328",
          fontWeight: me ? 700 : 400,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.name}
        {me && (
          <span
            style={{
              marginLeft: 6,
              padding: "0 5px",
              borderRadius: 4,
              background: "#cf4407",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              lineHeight: "16px",
              display: "inline-block",
            }}
          >
            我
          </span>
        )}
      </span>
      <span style={{ flex: "none", fontSize: 13, fontWeight: 700, color: "#1f2328" }}>
        {entry.score}
        <span style={{ marginLeft: 2, fontSize: 11, fontWeight: 400, color: "#5d636a" }}>
          {unit}
        </span>
      </span>
    </li>
  );
}

/** P2-10：脏数据兜底：非数组返回 []，缺 id / name / score 的条目补默认值。 */
function normalizeEntries(raw: unknown): ActivityLeaderboardEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
    .map((entry, i) => {
      const score = Number(entry.score);
      return {
        id: String(entry.id ?? `entry-${i}`),
        name: String(entry.name ?? "?"),
        score: Number.isFinite(score) ? score : 0,
        avatar: typeof entry.avatar === "string" ? entry.avatar : undefined,
        isMe: !!entry.isMe,
      };
    });
}

export function LeaderboardPanel({
  ctx,
  title,
  topN,
  unit,
  highlightMe,
  emptyText,
}: {
  ctx: ActivityPluginContext;
  title: string;
  topN: number;
  unit: string;
  highlightMe: boolean;
  emptyText: string;
}) {
  const raw = (ctx.data as ActivityData | undefined)?.leaderboard;
  // P2-9：排序与截取放进 useMemo，避免每次渲染全量 sort；slice 不改原数组。
  const all = useMemo(
    () => normalizeEntries(raw).sort((a, b) => b.score - a.score),
    [raw]
  );
  // P2-5：topN 夹到 1..50，避免脏配置切出空榜或渲染过长。
  const limit = Math.max(1, Math.min(50, Math.floor(Number.isFinite(topN) ? topN : 3)));

  if (all.length === 0) {
    return (
      <section
        aria-label={title}
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(128,128,128,0.18)",
          fontSize: 13,
          color: "#5d636a",
        }}
      >
        {emptyText}
      </section>
    );
  }

  const top = all.slice(0, limit);
  const myIndex = all.findIndex((e) => e.isMe);
  const meOutside = highlightMe && myIndex >= limit;

  return (
    <section
      aria-label={title}
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(128,128,128,0.18)",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1f2328" }}>{title}</span>
        <span style={{ fontSize: 12, color: "#5d636a" }}>
          共 {all.length} 人参与
        </span>
      </div>

      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {top.map((entry, i) => (
          <LeaderRow
            key={`${entry.id}-${i}`}
            entry={entry}
            rank={i + 1}
            unit={unit}
            highlightMe={highlightMe}
          />
        ))}
      </ol>

      {meOutside && (
        <>
          <div
            aria-hidden="true"
            style={{
              margin: "6px 0",
              borderTop: "1px dashed rgba(128,128,128,0.3)",
            }}
          />
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            <LeaderRow
              entry={all[myIndex]}
              rank={myIndex + 1}
              unit={unit}
              highlightMe={highlightMe}
            />
          </ol>
        </>
      )}
    </section>
  );
}
