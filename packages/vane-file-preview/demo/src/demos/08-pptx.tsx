/**
 * 08 · PPTX 大纲
 *
 * 解 ppt/slides/*.xml 抽每页文字，按页翻。不渲染图片与形状 ——
 * 真要做版式还原得引完整的 OOXML 渲染器，体积不现实。
 *
 * 坑位：**它不是 PPT 渲染器**。要还原版式（图片、形状、母版、字体、动画）需要解析 drawingml，那是另一个项目的体量；本插件只承诺「把文字按页抽出来」。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createPptxPreviewPlugin } from "vane-file-preview/custom-plugins/PptxPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createPptxPreviewPlugin()]);

/** 该插件只有一套装配，档位表只为了和 catalog 的声明对齐 */
const MAP: Record<string, React.ElementType> = {
  "pptx": Default,
};

export const meta = { plugin: "pptx" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
