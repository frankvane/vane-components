/**
 * 04 · PDF 预览
 *
 * 把 PDF 交给浏览器内置查看器：缩放、翻页、搜索、打印全都是现成的，
 * 而且不用为此往包里塞 pdfjs（连同 worker 与字体包）。
 *
 * 坑位：#toolbar=0 只对 Chromium 系（Chrome / Edge）有效，Firefox 部分支持，Safari 基本忽略 —— 想完全掌控 UI 只能上 pdf.js 自绘，那会把包撑到几百 KB。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createPdfPreviewPlugin } from "vane-file-preview/custom-plugins/PdfPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createPdfPreviewPlugin()]);
const Embed = withPlugins(FilePreviewCore, [createPdfPreviewPlugin({ useIframe: false })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "pdf": Default,
  "pdf:embed": Embed,
};

export const meta = { plugin: "pdf" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
