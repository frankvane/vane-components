/**
 * StatePlugin - 状态管理插件
 * 负责购物车和心愿单状态的管理
 */

import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";

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

      // onCartChange / onWishlistChange 是旧版死钩子（无人触发）；
      // 改为订阅 onStateChange 的状态差分，状态变化时回调外部配置。
      onStateChange: (context, prev, next) => {
        if (prev.cart !== next.cart) {
          onCartChange?.(context.cardId, Boolean(next.cart));
        }
        if (prev.wishlist !== next.wishlist) {
          onWishlistChange?.(context.cardId, Boolean(next.wishlist));
        }
      },
    },

    config,
  };

  return plugin;
};
