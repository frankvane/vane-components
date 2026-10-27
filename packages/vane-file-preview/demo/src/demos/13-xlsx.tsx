/**
 * 13 · XLSX 表格
 *
 * SheetJS 在浏览器里直接解 OOXML，多 Sheet 页签切换。文件不出内网 ——
 * 这一点比「上传到在线预览服务」重要得多，也是它存在的理由。
 *
 * 坑位：**License**：xlsx（SheetJS Community Edition）是 Apache-2.0，商用可以。但它从 0.19 起不在 npm 更新了，官方改在自己的 CDN（https://cdn.sheetjs.com/）分发；npm 上的 0.18.5 是最后一版，需要新特性得换源安装。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createXlsxPreviewPlugin } from "vane-file-preview/custom-plugins/XlsxPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createXlsxPreviewPlugin()]);
const FewRows = withPlugins(FilePreviewCore, [createXlsxPreviewPlugin({ maxRows: 20 })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "xlsx": Default,
  "xlsx:rows": FewRows,
};

export const meta = { plugin: "xlsx" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
