/**
 * 09 · Markdown 预览
 *
 * react-markdown + GFM（表格/任务列表/删除线）。**rehype-raw 默认关**：
 * 输入是用户上传的文件，开了它等于把存储型 XSS 的入口打开。
 * 拿 xss-demo.md 切两档就能看到差别：关着是纯文本，开了图片真被插进 DOM。
 *
 * 坑位：react-markdown / remark-gfm / remark-breaks / rehype-highlight 都是 optional peer。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createMarkdownPreviewPlugin } from "vane-file-preview/custom-plugins/MarkdownPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createMarkdownPreviewPlugin()]);
const AllowHtml = withPlugins(FilePreviewCore, [createMarkdownPreviewPlugin({ allowHtml: true })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "markdown": Default,
  "markdown:raw": AllowHtml,
};

export const meta = { plugin: "markdown" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
