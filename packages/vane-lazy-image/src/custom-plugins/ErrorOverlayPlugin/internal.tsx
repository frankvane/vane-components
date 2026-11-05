/**
 * ErrorOverlayPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import React, { useMemo } from "react";

import type { LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import type { ErrorOverlayConfig } from "./create";

export function ErrorOverlayView({ context, cfg }: { context: LazyImageContext; cfg: ErrorOverlayConfig }) {
  const {
    imageState,
    imageRef,
    src,
  } = context;

  // 发生过错误则打标，允许在回退成功后继续显示覆盖层
  const hadError = Boolean(context.sharedData?.get("had-error"));
  const shouldShow = imageState.isError || ((cfg.persistAfterFallback ?? true) && hadError);
  // 先取出 message 再进 useMemo：依赖项与原写法等价（都是 cfg.message 的身份），
  // 同时满足 exhaustive-deps —— 避免把整个 cfg 对象塞进依赖导致重算时机变化。
  const messageSource = cfg.message;
  const message = useMemo(() => {
    const base = typeof messageSource === "function" ? messageSource(context) : messageSource;
    return base ?? "加载失败";
  }, [messageSource, context]);

  if (!shouldShow) return null;

  const retry = () => {
    const img = imageRef?.current;
    if (!img) return;
    try {
      const bust = `${src}${src.includes("?") ? "&" : "?"}retry=${Date.now()}`;
      img.src = bust;
    } catch {}
  };

  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: cfg.background ?? "rgba(220, 53, 69, 0.18)",
    color: cfg.color ?? "#b00020",
    zIndex: cfg.zIndex ?? 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto",
    gap: 8,
    fontSize: 13,
    fontWeight: 500,
  };

  return (
    <div style={base}>
      <span>{message}</span>
      {cfg.showRetry !== false && (
        <button onClick={retry} style={{ padding: "4px 8px", fontSize: 12 }}> {cfg.retryText ?? "重试"} </button>
      )}
    </div>
  );
}
