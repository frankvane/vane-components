/**
 * ImagePlugin - 商品主图（D1-A：降级为占位实现）
 *
 * 只做「一张封面图」：固定 1:1、可占位、加载失败可兜底。
 * 懒加载/模糊占位/响应式 srcset 属于 vane-lazy-image 的职责，这里不重复实现
 * （旧版的 lazyLoad 只是给 <img loading> 传个属性，容易让人误以为有完整懒加载）。
 *
 * 迁移要点（C3.3）：
 *  - 旧版的 errorFallback 是死代码：<img> 出错时把自己 display:none，而 fallback
 *    那层写死了 display:none，永远不会显示 —— 结果是一块空白灰底。改为组件内
 *    failed 状态互斥渲染。
 *  - placeholder 以前声明了但没人用，现在真正实现为「加载完成前可见」。
 */

import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";
import { BusKeys } from "../../components/CardPlugin/plugins/BusKeys";
import { setupForceUpdateOnBusKeys } from "../../components/CardPlugin/plugins/utils/busHelpers";

import React from "react";

import { CardImage } from "./internal";

export interface ImagePluginConfig {
  src?: string;
  alt?: string;
  /** @deprecated 只透传给 <img loading>，不做真正的懒加载；要懒加载请用 vane-lazy-image */
  lazyLoad?: boolean;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

// 工厂返回 T 收敛为 unknown：T 仅经 data 透传，自定义 data 形态的调用方请显式写泛型参数。
export const createImagePlugin: PluginCreator<unknown, ImagePluginConfig> = (
  config = {}
) => {
  const plugin: CardPlugin = {
    name: "ImagePlugin",
    version: "1.1.0",
    description: "商品主图（占位实现：固定 1:1、可占位、失败兜底）",
    priority: 10,

    hooks: {
      // 选中变体带图时，主图要跟着换 —— 订阅 skuVariant 触发重渲染
      onMount: (context) =>
        setupForceUpdateOnBusKeys(context, [BusKeys.skuVariant]),

      renderHeader: (context) => {
        // 优先 config，其次变体图，最后 data.image
        const data = context.data as { image?: string; name?: string } | undefined;
        const variantImage = (
          context.bus?.getData?.(BusKeys.skuVariant) as
            | { image?: string }
            | undefined
        )?.image;
        const src = config.src || variantImage || data?.image;
        const alt = config.alt || data?.name || "商品图片";

        if (!src) return null;

        return (
          <CardImage
            src={src}
            alt={alt}
            lazyLoad={Boolean(config.lazyLoad)}
            placeholder={config.placeholder}
            errorFallback={config.errorFallback}
          />
        );
      },
    },

    config,
  };

  return plugin;
};
