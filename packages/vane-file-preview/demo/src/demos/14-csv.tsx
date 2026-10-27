/**
 * 14 · CSV / TSV 表格
 *
 * papaparse 解析 + 自研 decodeText：BOM → UTF-8(fatal) → GB18030 → 宽容解码。
 * 分隔符用 papaparse 猜出来的 meta.delimiter，所以分号 / 竖线 / Tab 都不用配。
 * 这里**不接 .txt**：接了会把纯文本日志全抢走（迁移前的实际 bug）。
 *
 * 坑位：papaparse 是 optional peer。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createCsvPreviewPlugin } from "vane-file-preview/custom-plugins/CsvPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createCsvPreviewPlugin()]);
const Page10 = withPlugins(FilePreviewCore, [createCsvPreviewPlugin({ pageSize: 10 })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "csv": Default,
  "csv:page10": Page10,
};

export const meta = { plugin: "csv" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
