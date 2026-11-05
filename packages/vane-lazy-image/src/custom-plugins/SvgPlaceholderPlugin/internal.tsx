/**
 * SvgPlaceholderPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import type React from "react";

import type { LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import type { SvgPlaceholderConfig } from "./create";

export function SvgOverlay({
  context,
  config,
  sanitizeSvg,
}: {
  context: LazyImageContext;
  config: SvgPlaceholderConfig;
  /** 由 create 注入的清洗函数（同时供测试直接调用，故实现仍留在 create） */
  sanitizeSvg: (content: string) => string;
}) {
  const { imageState } = context;
  const {
    background = "transparent",
    opacity = 1,
    zIndex = 3,
    showWhen = "loading",
    fadeOutOnLoaded = true,
  } = config;

  const shouldShow = (() => {
    switch (showWhen) {
      case "always":
        return true;
      case "idle":
        return imageState.isIdle;
      case "loading":
        return imageState.isLoading;
      case "loaded":
        return imageState.isLoaded;
      case "error":
        return imageState.isError;
      default:
        return imageState.isLoading;
    }
  })();

  if (!shouldShow) return null;

  const rawContent = typeof config.svgContent === "function"
    ? config.svgContent(context)
    : config.svgContent;

  // P0-4：字符串一律先清洗再转 data URL；ReactNode 按受信任节点渲染。
  let content: React.ReactNode = null;
  if (typeof rawContent === "string") {
    const safe = sanitizeSvg(rawContent);
    if (safe) {
      content = (
        <img
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(safe)}`}
          alt=""
          style={{ width: "60%", height: "60%", objectFit: "contain" }}
        />
      );
    }
  } else if (rawContent !== undefined && rawContent !== null) {
    content = rawContent as React.ReactNode;
  }

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background,
    zIndex,
    pointerEvents: "none",
    opacity: fadeOutOnLoaded && imageState.isLoaded ? 0 : opacity,
    transition: fadeOutOnLoaded ? "opacity 240ms ease" : undefined,
    padding: "min(40px, 10%)",
  };

  return (
    <div style={baseStyle} aria-hidden>
      {content}
    </div>
  );
}
