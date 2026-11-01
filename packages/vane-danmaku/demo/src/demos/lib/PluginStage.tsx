/**
 * 单插件示例舞台（逐项示例共用）
 *
 * 每个 `[NN]-<slug>.tsx` 只装「一个插件」看它的独立行为，本组件只是 LiveDanmaku 的薄封装：
 * 统一背景与高度，让示例页保持一致的舞台观感。插件实例与样本由调用方在模块级定义，
 * 保证引用稳定（避免每帧重建 Core 组件类型）。
 */
import React from "react";
import { LiveDanmaku } from "./LiveDanmaku";
import type { DanmakuItem, DanmakuPlugin } from "vane-danmaku";

export interface PluginStageProps {
  /** 稳定引用的插件实例（模块级常量） */
  plugins: DanmakuPlugin[];
  items: DanmakuItem[];
  loop?: number;
  height?: number;
  background?: React.CSSProperties["background"];
  opacity?: number;
  trackHeight?: number;
  showGrid?: boolean;
}

export function PluginStage({
  plugins,
  items,
  loop = 12,
  height = 300,
  background,
  opacity = 1,
  trackHeight = 30,
  showGrid,
}: PluginStageProps) {
  return (
    <LiveDanmaku
      plugins={plugins}
      items={items}
      loop={loop}
      height={height}
      background={background}
      opacity={opacity}
      trackHeight={trackHeight}
      showGrid={showGrid}
    />
  );
}
