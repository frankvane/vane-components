import React from "react";
import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * DetailLinkPlugin — 完整规则链接（after 槽，规则区下方）。
 *
 * config.href → 渲染 <a>；否则 config.onDetail → 渲染 <button>；都没有 → null。
 * meta 在同目录 index.ts 挂载。
 */
export interface DetailLinkConfig {
  /** 详情页链接（有 href 渲染 <a>） */
  href?: string;
  /** 链接文案，默认「查看完整规则」 */
  text?: string;
  /** 点击回调（无 href 时渲染 <button>） */
  onDetail?: () => void;
}

export function createDetailLinkPlugin(
  config: DetailLinkConfig = {}
): CouponPlugin {
  const text = config.text ?? "查看完整规则";
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  return {
    name: "detail-link",
    version: "0.1.0",
    description:
      "完整规则链接：href 渲染 <a>、onDetail 渲染 <button>，落在规则区下方",
    priority: 16,
    config: mergedConfig,
    hooks: {
      renderHeader: (_context: CouponPluginContext) => {
        if (!config.href && !config.onDetail) return null;

        const style: React.CSSProperties = {
          marginTop: 6,
          padding: 0,
          border: 0,
          background: "none",
          fontSize: 12,
          color: T.rulesToggleStyle.color,
          cursor: "pointer",
          fontFamily: "inherit",
          textDecoration: "underline",
          textUnderlineOffset: 2,
        };

        if (config.href) {
          return (
            <div style={{ marginTop: 6 }}>
              <a
                href={config.href}
                target="_blank"
                rel="noreferrer"
                style={style}
                data-testid="coupon-detail-link"
              >
                {text} ›
              </a>
            </div>
          );
        }

        return (
          <div style={{ marginTop: 6 }}>
            <button
              type="button"
              style={style}
              data-testid="coupon-detail-link"
              onClick={() => config.onDetail?.()}
            >
              {text} ›
            </button>
          </div>
        );
      },
    },
  };
}
