import React from "react";
import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * HistoryPlugin — 领取记录（after 槽）。
 *
 * config.records（默认读 coupon.history）按时间倒序渲染最近 max 条记录。
 * 空记录渲染 null。meta 在同目录 index.ts 挂载。
 */
export interface HistoryConfig {
  /** 记录列表（默认读 coupon.history），at 为 epoch ms */
  records?: { at: number; action: string }[];
  /** 最多展示条数，默认 3 */
  max?: number;
  /** 时间格式化，默认「YYYY.MM.DD」 */
  format?: (at: number) => string;
}

const fmtDate = (ts: number): string => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

export function createHistoryPlugin(config: HistoryConfig = {}): CouponPlugin {
  const max = config.max ?? 3;
  const format = config.format ?? fmtDate;
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  return {
    name: "history",
    version: "0.1.0",
    description:
      "领取记录：按 coupon.history / config.records 倒序渲染最近 N 条领取/使用记录",
    priority: 17,
    config: mergedConfig,
    hooks: {
      renderHeader: (context: CouponPluginContext) => {
        const records = config.records ?? context.coupon.history;
        if (!records || records.length === 0) return null;

        const shown = [...records]
          .sort((a, b) => b.at - a.at)
          .slice(0, max);

        return (
          <div style={{ marginTop: 10, fontSize: 12 }} data-testid="coupon-history">
            <div style={T.rulesTitleStyle}>领取记录</div>
            <ul style={T.rulesListStyle}>
              {shown.map((r, i) => (
                <li key={`${r.at}-${i}`} style={T.rulesItemStyle} data-testid={`coupon-history-item-${i}`}>
                  <span style={{ color: "#57606a" }}>{format(r.at)}</span>
                  {" · "}
                  {r.action}
                </li>
              ))}
            </ul>
          </div>
        );
      },
    },
  };
}
