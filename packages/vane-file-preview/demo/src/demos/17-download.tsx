/**
 * 17 · 兜底下载
 *
 * priority -1、canHandle 恒真 —— 它是路由的最后一道网。
 * 这一页只装它一个，所以连 .docx 也落到它手里：这正是兜底的意义。
 * 没有它，未声明支持的格式会渲染成一片空白，用户连文件名都看不到。
 *
 * 坑位：装了它之后 resolvePreview() 永远有赢家，**unsupported 面板不会再出现**。想看「没有插件认领」的提示就别装它。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createDownloadPlugin } from "vane-file-preview/custom-plugins/DownloadPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createDownloadPlugin()]);
const NoSize = withPlugins(FilePreviewCore, [createDownloadPlugin({ showFileInfo: false })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "download": Default,
  "download:nosize": NoSize,
};

export const meta = { plugin: "download" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
