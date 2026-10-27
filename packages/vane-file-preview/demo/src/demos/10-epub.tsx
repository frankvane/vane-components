/**
 * 10 · EPUB 电子书
 *
 * react-reader + epub.js。**内容以 ArrayBuffer 直接交给阅读器**，
 * 不是 blob: URL —— epub.js 只按扩展名猜类型，没有扩展名的 blob URL 会被它
 * 当成「已解压成目录的书」，然后去请求 META-INF/container.xml，必然失败。
 *
 * 坑位：react-reader + epubjs 合起来 200KB+，是本包最重的可选依赖。所以它不在根入口也不在 ./plugins，只能显式子路径引入。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createEpubPreviewPlugin } from "vane-file-preview/custom-plugins/EpubPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createEpubPreviewPlugin()]);
const Swipe = withPlugins(FilePreviewCore, [createEpubPreviewPlugin({ swipeable: true })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "epub": Default,
  "epub:swipe": Swipe,
};

export const meta = { plugin: "epub" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
