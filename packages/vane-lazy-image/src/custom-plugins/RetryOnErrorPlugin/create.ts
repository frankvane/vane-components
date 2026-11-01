import React from "react";
import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface RetryOnErrorConfig {
  maxRetries?: number;
  baseDelayMs?: number; // 退避基准毫秒
  jitter?: boolean;
}

function scheduleRetry(
  context: LazyImageContext,
  cfg: RetryOnErrorConfig,
  count: number,
  timers: Map<string, ReturnType<typeof setTimeout>>
) {
  const src = context.src;
  const existing = timers.get(src);
  if (existing) clearTimeout(existing);

  const delay = (cfg.baseDelayMs ?? 500) * Math.pow(2, Math.max(0, count - 1));
  const jitter = cfg.jitter ? Math.random() * 0.25 * delay : 0;
  const finalDelay = delay + jitter;
  const timer = setTimeout(() => {
    timers.delete(src);
    const img = context.imageRef?.current;
    if (!img) return;
    try {
      const bust = `${src}${src.includes("?") ? "&" : "?"}retry=${Date.now()}&n=${count}`;
      img.src = bust;
    } catch {}
  }, finalDelay);
  timers.set(src, timer);
}

export function createRetryOnErrorPlugin(config: RetryOnErrorConfig = {}): LazyImagePlugin {
  const { maxRetries = 2 } = config;
  // P2-5：定时器按 src 保存，onUnmount / onSrcChange 时可取消
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const countKey = (src: string) => `retry-count:${src}`;

  return {
    name: "retry-on-error",
    version: "1.1.0",
    description: "图片加载失败后退避重试；计数按 src 隔离、定时器可取消（P2-5）",
    config,
    hooks: {
      onLoadError: (context: LazyImageContext, _error: Error | Event) => {
        // 标记曾出现错误，便于错误徽标在回退或后续成功后仍显示
        try { context.sharedData?.set("had-error", true); } catch {}
        const key = countKey(context.src);
        const prev = Number(context.sharedData?.get(key) ?? 0);
        const next = prev + 1;
        if (next <= maxRetries) {
          context.sharedData?.set(key, next);
          scheduleRetry(context, config, next, timers);
          return true; // 错误已处理，正在重试
        }
        // 重试用尽：记录用尽次数，供 renderOverlay 显示「重试失败」
        try { context.sharedData?.set(key, next); } catch {}
        // 返回 false 让错误继续传播到其他插件
        return false;
      },
      onSrcChange: (_context: LazyImageContext, oldSrc: string) => {
        // P2-5：旧图的定时器必须取消，否则会对已切换的 <img> 发起旧请求
        const timer = timers.get(oldSrc);
        if (timer) {
          clearTimeout(timer);
          timers.delete(oldSrc);
        }
      },
      onUnmount: () => {
        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();
      },
      renderOverlay: (context: LazyImageContext) => {
        const count = Number(context.sharedData?.get(countKey(context.src)) ?? 0);
        if (count <= 0) return null;
        const exhausted = count > maxRetries;
        const base: React.CSSProperties = {
          position: "absolute",
          top: 6,
          right: 6,
          zIndex: 10,
          fontSize: 12,
          fontWeight: 600,
          color: "#fff",
          background: exhausted ? "rgba(108,117,125,0.9)" : "rgba(255,149,0,0.92)",
          padding: "2px 8px",
          borderRadius: 4,
        };
        return React.createElement(
          "div",
          { style: base },
          exhausted ? `重试失败 (${maxRetries})` : `重试中 ${count}/${maxRetries}`
        );
      },
    },
  };
}