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

// 工厂返回 T 收敛为 unknown：T 仅经 data 透传，自定义 data 形态的调用方请显式写泛型参数。
export const createStatePlugin: PluginCreator<unknown, StatePluginConfig> = (
  config = {}
) => {
  // enableCart / enableWishlist 是历史配置项，从未参与状态逻辑；
  // 保留在 config 里原样透传，但不再解构，避免「声明了却不使用」。
  const { onCartChange, onWishlistChange } = config;

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
