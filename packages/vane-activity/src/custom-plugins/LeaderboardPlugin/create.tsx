import React from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityData,
  ActivityLeaderboardEntry,
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface LeaderboardPluginConfig extends ActivityPluginConfigBase {
  /** 标题（默认「好友榜」） */
  title?: string;
  /** 展示前几名（默认 3） */
  topN?: number;
  /** 分数单位（默认「分」） */
  unit?: string;
  /** 是否高亮 isMe 行（默认 true） */
  highlightMe?: boolean;
  /** 无数据时的文案（默认「暂无排行数据」） */
  emptyText?: string;
}

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

/**
 * LeaderboardPlugin - 好友榜：按 score 降序取前 topN，第一名强调橙名次牌，
 * isMe 行浅橙底高亮并带「我」标签；自己不在前 topN 时在底部单独补一行真实名次。
 */
export const createLeaderboardPlugin: PluginCreator<LeaderboardPluginConfig> = (
  config = {}
) => {
  const { title = "好友榜", topN = 3, unit = "分", highlightMe = true, emptyText = "暂无排行数据" } =
    config;

  return {
    name: "LeaderboardPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 25,
    config,
    hooks: {
      renderFooter: (context: ActivityPluginContext<any>) => {
        const all = [...(((context.data as ActivityData | undefined)?.leaderboard ?? []) as
          ActivityLeaderboardEntry[])].sort((a, b) => b.score - a.score);
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

        const top = all.slice(0, topN);
        const myIndex = all.findIndex((e) => e.isMe);
        const meOutside = highlightMe && myIndex >= topN;

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
                  key={entry.id}
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
      },
    },
  };
};

createLeaderboardPlugin.meta = doc as PluginDoc;
