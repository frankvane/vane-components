import React from "react";
import type {
  CouponPlugin,
  CouponPluginContext,
} from "../../components/CouponPlugin/plugins/types";

/**
 * RuleExpandPlugin — 规则展开/收起（after 槽，priority 21 < Validity 的 23，渲染在有效期下方）。
 *
 * 折叠态显示前 collapsedCount 条 + 「展开 (N 项)」；展开后全量 + 「收起」。
 * 展开态写内核 state.rulesExpanded（toggleRules 即 setState）。
 *
 * 截断按条数、不用 line-clamp —— 几何体检（tasks/28）已证明 line-clamp 是
 * 纵向裁切的重灾区，且 sticky 容器里放开即可滚。
 * rules 为空渲染 null。meta 在同目录 index.ts 挂载。
 */
export interface RuleExpandConfig {
  /** 折叠态显示的规则条数，默认 1 */
  collapsedCount?: number;
  /** 展开按钮文案前缀，默认「展开」 */
  expandText?: string;
  /** 收起按钮文案，默认「收起」 */
  collapseText?: string;
  /** 按钮是否带条数（「展开 (3 项)」），默认 true */
  showCount?: boolean;
  /** 区域标题，默认「使用规则」；传空字符串隐藏标题 */
  title?: string;
}

export function createRuleExpandPlugin(
  config: RuleExpandConfig = {}
): CouponPlugin {
  const collapsedCount = config.collapsedCount ?? 1;
  const expandText = config.expandText ?? "展开";
  const collapseText = config.collapseText ?? "收起";
  const showCount = config.showCount ?? true;
  const title = config.title ?? "使用规则";
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  return {
    name: "rule-expand",
    version: "0.1.0",
    description:
      "规则展开/收起：使用规则按条数折叠（默认 1 条），展开态写内核 state，可被宿主/其他插件复位",
    priority: 21,
    config: mergedConfig,
    hooks: {
      renderHeader: (context: CouponPluginContext) => {
        const rules = context.coupon.rules ?? [];
        if (rules.length === 0) return null;

        const expanded = context.rulesExpanded;
        const visible = expanded ? rules : rules.slice(0, collapsedCount);
        const hiddenCount = rules.length - visible.length;

        return (
          <div
            className="vc-coupon__rules"
            data-testid="coupon-rules"
            data-expanded={expanded ? "true" : "false"}
          >
            {title ? (
              <div className="vc-coupon__rules-title">{title}</div>
            ) : null}
            <ul className="vc-coupon__rules-list">
              {visible.map((rule, i) => (
                <li
                  key={i}
                  className="vc-coupon__rules-item"
                  data-testid={`coupon-rule-${i}`}
                >
                  {rule}
                </li>
              ))}
            </ul>
            {rules.length > collapsedCount ? (
              <button
                type="button"
                className="vc-coupon__rules-toggle"
                data-testid="coupon-rules-toggle"
                aria-expanded={expanded}
                onClick={() => context.toggleRules()}
              >
                {expanded
                  ? collapseText
                  : showCount
                    ? `${expandText} (${hiddenCount} 项)`
                    : expandText}
                <span aria-hidden="true" className="vc-coupon__rules-caret">
                  {expanded ? "▲" : "▼"}
                </span>
              </button>
            ) : null}
          </div>
        );
      },
    },
  };
}
