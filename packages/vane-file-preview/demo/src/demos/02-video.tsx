/**
 * 02 · 视频预览
 *
 * 原生 <video>，不转码。能播什么完全取决于浏览器内核，所以失败文案必须区分
 * 「这个容器根本没有解码器」与「文件本身坏了」—— 前者再重试也没用。
 *
 * 坑位：能播什么完全取决于浏览器：Chrome 不支持 H.265/HEVC，MKV 容器普遍不支持，AVI 基本不支持。插件不做转码。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createVideoPreviewPlugin } from "vane-file-preview/custom-plugins/VideoPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createVideoPreviewPlugin()]);
const AutoPlay = withPlugins(FilePreviewCore, [createVideoPreviewPlugin({ autoplay: true, muted: true, loop: true })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "video": Default,
  "video:auto": AutoPlay,
};

export const meta = { plugin: "video" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
