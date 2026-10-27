/**
 * 11 · JSON 树
 *
 * @uiw/react-json-view 的树视图：折叠、关键字搜索、复制字段路径、导出格式化结果。
 * 纯文本预览要人肉对齐括号，字段一多就没人愿意看了。
 *
 * 坑位：5MB 上限不是随便定的：JSON.parse 出来的对象树通常是原文件的 5~10 倍内存，再交给树视图渲染，标签页会直接卡死。需要看大文件请调 maxFileSize 并自己承担风险。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createJsonPreviewPlugin } from "vane-file-preview/custom-plugins/JsonPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createJsonPreviewPlugin()]);
const Dark = withPlugins(FilePreviewCore, [createJsonPreviewPlugin({ theme: "dark" })]);
const Expand = withPlugins(FilePreviewCore, [createJsonPreviewPlugin({ collapsed: 2 })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "json": Default,
  "json:dark": Dark,
  "json:expand": Expand,
};

export const meta = { plugin: "json" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
