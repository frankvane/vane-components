/**
 * 01 · 图片预览
 *
 * 原生 <img> 承载，缩放/旋转都走 CSS transform —— 不改宽高，所以图片变大时周围布局不会重排。
 * 工具栏与图片之间没有 props 传递：状态存在 sharedData 里，写入后 forceUpdate 驱动重画。
 *
 * 坑位：用 transform: scale() 而非 width/height 缩放：不改布局，避免容器在被预览图片尺寸抖动时重排。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createImagePreviewPlugin } from "vane-file-preview/custom-plugins/ImagePreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createImagePreviewPlugin()]);
const MaxZoom = withPlugins(FilePreviewCore, [createImagePreviewPlugin({ maxZoom: 12 })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "image": Default,
  "image:max": MaxZoom,
};

export const meta = { plugin: "image" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
