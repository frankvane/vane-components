/**
 * 07 · DOCX · 语义 HTML
 *
 * mammoth 把 docx 转成干净的语义标签（h2/ul/table），丢掉版式换可编排性。
 * 同一个 sample.docx，这一页和上一页长得完全不同 —— 这是分工，不是谁错了。
 *
 * 坑位：**默认实现**：`file.docxMode` 未设置或为 "mammoth" 时由它命中。要还原版式请显式设 `file.docxMode = "docx-preview"` 并装 docx-preview。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createMammothDocxPlugin } from "vane-file-preview/custom-plugins/MammothDocxPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createMammothDocxPlugin()]);
const NoStyle = withPlugins(FilePreviewCore, [createMammothDocxPlugin({ withDefaultStyle: false })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "mammoth": Default,
  "mammoth:plain": NoStyle,
};

export const meta = { plugin: "mammoth-docx" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
