/**
 * 05 · Office 在线预览
 *
 * 只做 URL 转发，零解析：把地址拼进 Office Online / Google Docs 的查看器链接。
 * 代价是文件必须公网可达 —— 本页三个样本都在本地，所以会稳定落到说明面板。
 *
 * 坑位：它的原理是「查看器的服务器去拉你的 URL」，所以本地开发（localhost）与内网地址一律不可用，这不是 bug。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createOfficePreviewPlugin } from "vane-file-preview/custom-plugins/OfficePreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createOfficePreviewPlugin()]);
const Google = withPlugins(FilePreviewCore, [createOfficePreviewPlugin({ viewer: "google" })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "office": Default,
  "office:google": Google,
};

export const meta = { plugin: "office" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
