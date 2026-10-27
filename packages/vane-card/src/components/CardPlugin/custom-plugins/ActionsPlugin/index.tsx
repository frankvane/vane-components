/**
 * ActionsPlugin - 操作按钮插件
 * 负责渲染购物车、心愿单等操作按钮
 */

import type { CardPlugin, PluginCreator } from "../../plugins/types";

import React from "react";

export interface ActionsPluginConfig {
  showCartButton?: boolean;
  showWishlistButton?: boolean;
  cartButtonText?: { add: string; remove: string };
  wishlistButtonText?: { add: string; remove: string };
  renderCustomActions?: (context: any) => React.ReactNode;
}

export const createActionsPlugin: PluginCreator<any, ActionsPluginConfig> = (
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

        const handleCartClick = () => {
          const newState = !state.cart;
          bus?.emit("cart:change", {
            cardId: context.cardId,
            isAdded: newState,
          });
          context.setState({ cart: newState });
        };

        const handleWishlistClick = () => {
          const newState = !state.wishlist;
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
                  background: state.cart ? "#4CAF50" : "#fff",
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
                  background: state.wishlist ? "#FF5722" : "#fff",
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

    config,
  };

  return plugin;
};
