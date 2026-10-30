import React from "react";
import type { CouponData, CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * SharePlugin — 分享按钮（footer 槽，priority 31 在领取按钮下方）。
 *
 * 渲染次按钮（muted 样式），点击触发 config.onShare；未配置 onShare 时按钮隐藏
 * （分享能力完全由宿主提供，插件只负责 UI 位）。
 * meta 在同目录 index.ts 挂载。
 */
export interface ShareConfig {
  /** 按钮文案，默认「分享好友」 */
  text?: string;
  /** 分享回调（入参为当前券数据）；未配置时不渲染按钮 */
  onShare?: (coupon: CouponData) => void | Promise<void>;
}

export function createSharePlugin(config: ShareConfig = {}): CouponPlugin {
  const text = config.text ?? "分享好友";
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  return {
    name: "share",
    version: "0.1.0",
    description: "分享按钮：footer 槽渲染次按钮，分享能力由 onShare 回调提供",
    priority: 31,
    config: mergedConfig,
    hooks: {
      renderFooter: (context: CouponPluginContext) => {
        if (!config.onShare) return null;

        const handleClick = async () => {
          await config.onShare?.(context.coupon);
          // onShare 内部若改了闭包状态，需要显式刷新
          context.forceUpdate();
        };

        return (
          <div style={T.actionsStyle}>
            <button
              type="button"
              style={T.claimMutedStyle}
              data-testid="coupon-share-btn"
              onClick={() => void handleClick()}
            >
              {text}
            </button>
          </div>
        );
      },
    },
  };
}
