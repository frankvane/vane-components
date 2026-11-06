import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { TEXT_2, TEXT_3 } from "../tokens";
import { formatDayKey } from "../../utils/date";

export interface RewardHistoryConfig {
  /** 最多展示几条，默认 5 */
  limit?: number;
}

/**
 * RewardHistoryPlugin - 领取记录（底部区）。
 * 展示 data.history（领取记录），按时间倒序取前 limit 条；无记录显示终态文案。
 */
// 泛型默认值 unknown：T 不参与类型结构（data 恒为 SignInData），默认值不影响调用方。
export function createRewardHistoryPlugin<T = unknown>(
  config: RewardHistoryConfig = {}
): SignInPlugin<T> {
  const { limit = 5 } = config;
  return {
    name: "RewardHistory",
    version: "0.1.0",
    description: doc.description,
    priority: 51,
    enabled: true,
    hooks: {
      renderFooter: (ctx: SignInPluginContext<T>) => {
        const history = ctx.data.history ?? [];
        const timeZone = ctx.data.businessTimeZone;
        if (!history.length) {
          return (
            <div style={{ fontSize: 12, color: TEXT_3 }}>暂无领取记录</div>
          );
        }
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, color: TEXT_2 }}>领取记录</div>
            {history.slice(0, limit).map((h) => (
              <div
                key={h.id}
                style={{
                  display: "flex",
                  fontSize: 12,
                  color: TEXT_3,
                }}
              >
                <span>
                  第{h.day}天 · {h.label}
                </span>
                <span style={{ marginLeft: "auto" }}>
                  {/* 用业务日键而非 toLocaleDateString：SSR/浏览器时区不同也不会差一天 */}
                  {formatDayKey(h.at, timeZone)}
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
  };
}

createRewardHistoryPlugin.meta = doc as PluginDoc;
