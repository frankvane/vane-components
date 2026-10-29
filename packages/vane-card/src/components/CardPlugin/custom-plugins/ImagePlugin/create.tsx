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

import type { CardPlugin, PluginCreator } from "../../plugins/types";
import { BusKeys } from "../../plugins/BusKeys";
import { setupForceUpdateOnBusKeys } from "../../plugins/utils/busHelpers";

import React from "react";

export interface ImagePluginConfig {
  src?: string;
  alt?: string;
  /** @deprecated 只透传给 <img loading>，不做真正的懒加载；要懒加载请用 vane-lazy-image */
  lazyLoad?: boolean;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

interface CardImageProps {
  src: string;
  alt: string;
  lazyLoad: boolean;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

/** 模块级组件：状态与组件身份都稳定，不在渲染函数里造组件 */
const CardImage: React.FC<CardImageProps> = ({
  src,
  alt,
  lazyLoad,
  placeholder,
  errorFallback,
}) => {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "failed">(
    "loading"
  );

  if (status === "failed") {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          overflow: "hidden",
          borderRadius: "8px 8px 0 0",
          background: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        data-image-state="failed"
      >
        {errorFallback ?? null}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        overflow: "hidden",
        borderRadius: "8px 8px 0 0",
        background: "#f5f5f5",
      }}
      data-image-state={status}
    >
      {status === "loading" && placeholder ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {placeholder}
        </div>
      ) : null}
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: status === "loaded" ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
        loading={lazyLoad ? "lazy" : "eager"}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("failed")}
      />
    </div>
  );
};

export const createImagePlugin: PluginCreator<any, ImagePluginConfig> = (
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
        const variantImage = (
          context.bus?.getData?.(BusKeys.skuVariant) as
            | { image?: string }
            | undefined
        )?.image;
        const src = config.src || variantImage || context.data?.image;
        const alt = config.alt || context.data?.name || "商品图片";

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
