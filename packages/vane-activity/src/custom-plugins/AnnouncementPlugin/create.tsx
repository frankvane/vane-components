import React from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityData,
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface AnnouncementPluginConfig extends ActivityPluginConfigBase {
  /** 公告条目（未传则读 data.announcements） */
  items?: string[];
  /** 左侧标签文案（默认「公告」） */
  label?: string;
  /** 标签前的图标（默认 📢） */
  icon?: string;
  /** 滚动一轮的秒数（默认 16，越大越慢） */
  speedSec?: number;
}

const KEYFRAMES = `@keyframes va-announce-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion: reduce){.va-announce-track{animation:none!important;transform:none!important}}
.va-announce-track:hover{animation-play-state:paused}`;

/**
 * AnnouncementPlugin - 活动公告条（renderHeader 槽，位于头部横幅之上）。
 *
 * 纯 CSS 跑马灯：条目复制一份首尾相接，`translateX(-50%)` 即为无缝循环，不持有任何
 * 定时器（比 setInterval 省一次重渲染，也不会在后台标签页里积压）。悬停暂停，
 * `prefers-reduced-motion` 下自动静止。
 */
export const createAnnouncementPlugin: PluginCreator<AnnouncementPluginConfig> = (
  config = {}
) => {
  const { items = [], label = "公告", icon = "📢", speedSec = 16 } = config;

  return {
    name: "AnnouncementPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 8,
    config,
    hooks: {
      renderHeader: (context: ActivityPluginContext<any>) => {
        const fromData = (context.data as ActivityData | undefined)?.announcements;
        const list = (fromData && fromData.length > 0 ? fromData : items).filter(
          (text) => !!text
        );
        if (list.length === 0) return null;

        // 复制一份实现无缝循环（-50% 正好是一份的宽度）
        const loop = [...list, ...list];

        return (
          <section
            aria-label="活动公告"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflow: "hidden",
              padding: "6px 10px",
              borderRadius: 999,
              /* 浅橙底 + 深字：#1f2328 对 #fff6ef 约 15:1 */
              background: "#fff6ef",
              border: "1px solid rgba(207,68,7,0.14)",
            }}
          >
            <style>{KEYFRAMES}</style>
            <span
              style={{
                flex: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#cf4407",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.7,
              }}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </span>

            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <div
                className="va-announce-track"
                style={{
                  display: "inline-flex",
                  gap: 28,
                  whiteSpace: "nowrap",
                  willChange: "transform",
                  animation: `va-announce-scroll ${speedSec}s linear infinite`,
                }}
              >
                {loop.map((text, i) => (
                  <span
                    key={`${text}-${i}`}
                    aria-hidden={i >= list.length ? true : undefined}
                    style={{ fontSize: 12, lineHeight: 1.7, color: "#1f2328" }}
                  >
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </section>
        );
      },
    },
  };
};

createAnnouncementPlugin.meta = doc as PluginDoc;
