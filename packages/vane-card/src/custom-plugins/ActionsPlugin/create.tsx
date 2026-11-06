/**
 * ActionsPlugin - 操作按钮插件
 * 负责渲染购物车、心愿单等操作按钮
 */

import type { CardPlugin, CardPluginContext, PluginCreator } from "../../components/CardPlugin/plugins/types";

import React from "react";

export interface ActionsPluginConfig {
  showCartButton?: boolean;
  showWishlistButton?: boolean;
  cartButtonText?: { add: string; remove: string };
  wishlistButtonText?: { add: string; remove: string };
  // 自定义操作渲染函数由宿主实现，上下文为完整插件上下文（T=unknown，读取 data 时自行断言）。
  renderCustomActions?: (context: CardPluginContext) => React.ReactNode;
}

// 工厂返回 T 收敛为 unknown：T 仅经 data 透传，自定义 data 形态的调用方请显式写泛型参数。
export const createActionsPlugin: PluginCreator<unknown, ActionsPluginConfig> = (
  config = {}
) => {
  const {
    showCartButton = true,
    showWishlistButton = true,
    cartButtonText = { add: "加入购物车", remove: "移出购物车" },
    wishlistButtonText = { add: "加入心愿单", remove: "移出心愿单" },
    renderCustomActions,
  } = config;

  const plugin: CardPlugin = {
    name: "ActionsPlugin",
    version: "1.0.0",
    description: "操作按钮插件",
    priority: 20,

    hooks: {
      renderFooter: (context) => {
        const { state, bus } = context;

        // 同一次点击批次里多次触发时，闭包里的 state 还是旧值；sharedData（每个
        // runtime 一个 Map）是跨点击的同步真源，state 只负责触发重渲染（P2-5）。
        const readFlag = (key: string, fallback: boolean | undefined) => {
          const stored = context.sharedData?.get?.(key);
          return typeof stored === "boolean" ? stored : Boolean(fallback);
        };

        const handleCartClick = () => {
          const newState = !readFlag("actions:cart", state.cart);
          context.sharedData?.set?.("actions:cart", newState);
          bus?.emit("cart:change", {
            cardId: context.cardId,
            isAdded: newState,
          });
          context.setState({ cart: newState });
        };

        const handleWishlistClick = () => {
          const newState = !readFlag("actions:wishlist", state.wishlist);
          context.sharedData?.set?.("actions:wishlist", newState);
          bus?.emit("wishlist:change", {
            cardId: context.cardId,
            isWishlisted: newState,
          });
          context.setState({ wishlist: newState });
        };

        if (renderCustomActions) {
          return renderCustomActions(context);
        }

        return (
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "12px",
              borderTop: "1px solid #eee",
            }}
          >
            {showCartButton && (
              <button
                onClick={handleCartClick}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  background: state.cart ? "#2e7d32" : "#fff",
                  color: state.cart ? "#fff" : "#333",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
              >
                {state.cart ? cartButtonText.remove : cartButtonText.add}
              </button>
            )}
            {showWishlistButton && (
              <button
                onClick={handleWishlistClick}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  background: state.wishlist ? "#c4390f" : "#fff",
                  color: state.wishlist ? "#fff" : "#333",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
              >
                {state.wishlist
                  ? wishlistButtonText.remove
                  : wishlistButtonText.add}
              </button>
            )}
          </div>
        );
      },
    },

    // order 给 20：footer 里「按钮永远排最后」应该是结构性的，而不是靠 priority 撞运气。
    // 价格区默认 order 10、券条 0，于是顺序稳定为 券 → 价格 → 按钮。
    config: { order: 20, ...config },
  };

  return plugin;
};
