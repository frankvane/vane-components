/**
 * 15 · ZIP 目录
 *
 * jszip 读中央目录，目录在前、文件在后，显示未压缩大小。
 * 几 GB 的交付包先看目录再决定要不要下，比下载完再解压省事得多。
 *
 * 坑位：只列条目、不解压内容。要预览压缩包里的某个文件，用户得先下载解开 —— 递归预览意味着把内层文件再走一遍整个预览管线，复杂度不成比例。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createZipPreviewPlugin } from "vane-file-preview/custom-plugins/ZipPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createZipPreviewPlugin()]);
const Slim = withPlugins(FilePreviewCore, [createZipPreviewPlugin({ showFileSize: false })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "zip": Default,
  "zip:slim": Slim,
};

export const meta = { plugin: "zip" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
