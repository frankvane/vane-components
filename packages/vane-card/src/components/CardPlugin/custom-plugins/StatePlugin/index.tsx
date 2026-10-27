/**
 * StatePlugin - 状态管理插件
 * 负责购物车和心愿单状态的管理
 */

import type { CardPlugin, PluginCreator } from "../../plugins/types";

export interface StatePluginConfig {
  enableCart?: boolean;
  enableWishlist?: boolean;
  onCartChange?: (cardId: string, isAdded: boolean) => void;
  onWishlistChange?: (cardId: string, isWishlisted: boolean) => void;
}

export const createStatePlugin: PluginCreator<any, StatePluginConfig> = (
  config = {}
) => {
  const {
    enableCart = true,
    enableWishlist = true,
    onCartChange,
    onWishlistChange,
  } = config;

  const plugin: CardPlugin = {
    name: "StatePlugin",
    version: "1.0.0",
    description: "状态管理插件",
    priority: 100,

    hooks: {
      onMount: (context) => {
        // 初始化状态
        context.setState({
          cart: false,
          wishlist: false,
        });
      },

      onCartChange: (context, isAdded) => {
        context.setState({ cart: isAdded });
        onCartChange?.(context.cardId, isAdded);
      },

      onWishlistChange: (context, isWishlisted) => {
        context.setState({ wishlist: isWishlisted });
        onWishlistChange?.(context.cardId, isWishlisted);
      },
    },

    config,
  };

  return plugin;
};
