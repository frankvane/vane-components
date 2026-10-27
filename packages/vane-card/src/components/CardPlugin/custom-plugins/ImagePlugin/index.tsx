/**
 * ImagePlugin - 图片处理插件
 * 负责商品图片的渲染、懒加载等功能
 */

import type { CardPlugin, PluginCreator } from "../../plugins/types";

import React from "react";

export interface ImagePluginConfig {
  src?: string;
  alt?: string;
  lazyLoad?: boolean;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export const createImagePlugin: PluginCreator<any, ImagePluginConfig> = (
  config = {}
) => {
  const plugin: CardPlugin = {
    name: "ImagePlugin",
    version: "1.0.0",
    description: "图片处理插件",
    priority: 10,

    hooks: {
      renderHeader: (context) => {
        // 优先使用 config 中的配置，其次从 context.data 读取
        const src = config.src || context.data?.image;
        const alt = config.alt || context.data?.name || "商品图片";
        const { placeholder, errorFallback } = config;

        if (!src) return null;

        return (
          <div
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              overflow: "hidden",
              borderRadius: "8px 8px 0 0",
              background: "#f5f5f5",
            }}
          >
            <img
              src={src}
              alt={alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              loading={config.lazyLoad ? "lazy" : "eager"}
              onError={(e) => {
                if (errorFallback) {
                  (e.target as HTMLImageElement).style.display = "none";
                }
              }}
            />
            {errorFallback && (
              <div
                style={{
                  display: "none",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {errorFallback}
              </div>
            )}
          </div>
        );
      },
    },

    config,
  };

  return plugin;
};
