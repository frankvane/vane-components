/**
 * 06 · DOCX · 版式还原
 *
 * docx-preview 按 OOXML 还原分页、页边距、字号、表格边框。
 * 看合同/公文/简历这类「排版本身有信息量」的文档时，这是唯一像样的选择。
 *
 * 坑位：**只在 `file.docxMode === "docx-preview"` 时命中。** 默认的 docx 实现是 MammothDocxPlugin（语义 HTML、更轻）；要版式就得显式声明，否则用户会同时装两个却永远只看到 mammoth 的结果。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createDocxPreviewPlugin } from "vane-file-preview/custom-plugins/DocxPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createDocxPreviewPlugin()]);
const NoBreak = withPlugins(FilePreviewCore, [createDocxPreviewPlugin({ breakPages: false })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "docx": Default,
  "docx:stream": NoBreak,
};

export const meta = { plugin: "docx" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
