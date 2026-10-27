/**
 * 16 · 代码高亮
 *
 * prism 按需加载语言包 + 两套主题（one-light / vsc-dark-plus）+ auto 跟随系统。
 * 迁移前把 41 套主题全打进包，单一个主题桶就拖出 792KB —— 现在只有两套。
 * 语言按**扩展名**精确匹配（曾经用 includes，Makefile.js 会被判成 makefile）。
 *
 * 坑位：react-syntax-highlighter 是 optional peer：不装也能 import 本插件，只是渲染时给出 npm i 提示。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createCodePreviewPlugin } from "vane-file-preview/custom-plugins/CodePreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createCodePreviewPlugin()]);
const Dark = withPlugins(FilePreviewCore, [createCodePreviewPlugin({ theme: "dark" })]);
const NoLine = withPlugins(FilePreviewCore, [createCodePreviewPlugin({ showLineNumbers: false })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "code": Default,
  "code:dark": Dark,
  "code:noline": NoLine,
};

export const meta = { plugin: "code" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
