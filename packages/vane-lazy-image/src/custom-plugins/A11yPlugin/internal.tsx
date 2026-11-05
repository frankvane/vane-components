/**
 * A11yPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import { useEffect } from "react";

import type { LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import type { A11yPluginConfig } from "./create";

export function VisuallyHiddenStatus({
  ctx,
  config,
}: {
  ctx: LazyImageContext;
  config: A11yPluginConfig;
}) {
  const { imageState } = ctx;
  const text = imageState.isError
    ? config.statusText?.error ?? "图片加载失败"
    : imageState.isLoaded
    ? config.statusText?.loaded ?? "图片加载完成"
    : imageState.isLoading
    ? config.statusText?.loading ?? "图片加载中"
    : "图片未加载";

  useEffect(() => {
    const img = ctx.imageRef?.current;
    if (!img || !config.enabled) return;
    // 根据状态设置 aria-busy
    try { img.setAttribute("aria-busy", imageState.isLoading ? "true" : "false"); } catch {}
  }, [ctx.imageRef, config.enabled, imageState.isLoading]);

  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {text}
    </span>
  );
}
