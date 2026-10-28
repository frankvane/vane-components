/**
 * FavoritePlugin —— 收藏切换（gallery 增强插件）。
 *
 * 在 galleryToolbarArea 渲染心形按钮，绑定 context.favorited（useState 协调态）。
 * 点击切换 setFavorited，并回调 config.onChange 通知调用方（用于持久化/上报）。
 */
import React from "react";
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface FavoriteConfig {
  /** 切换时回调 */
  onChange?: (favorited: boolean) => void;
  /** 激活色 */
  activeColor?: string;
}

export function createFavoritePlugin(config: FavoriteConfig = {}): GalleryPlugin {
  const { onChange, activeColor = "#ff5a5f" } = config;

  return {
    name: "gallery-favorite",
    version: "1.0.0",
    config,
    hooks: {
      galleryToolbarArea: (context: GalleryContext) => {
        const { favorited, setFavorited } = context;
        return (
          <button
            type="button"
            aria-label={favorited ? "取消收藏" : "收藏"}
            aria-pressed={favorited}
            onClick={() => {
              const next = !favorited;
              setFavorited(next);
              onChange?.(next);
            }}
            style={{
              border: "1px solid #ddd",
              background: "#fff",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: 15,
              color: favorited ? activeColor : "#333",
              userSelect: "none",
            }}
          >
            {favorited ? "♥" : "♡"}
          </button>
        );
      },
    },
  };
}

export default createFavoritePlugin;
