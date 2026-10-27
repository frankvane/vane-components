/**
 * 12 · XML / RSS 树
 *
 * react-xml-viewer：XML / RSS / Atom / KML 共用一套树视图，带行号与折叠。
 * 对接老系统和调订阅源时，比在记事本里数尖括号快得多。
 *
 * 坑位：迁移时删掉了四个从来没生效的配置：enableValidation / showAttributes / showComments / showProcessingInstructions。react-xml-viewer 的 props 里根本没有这些开关，文档写着能关、实际关不掉，比不提供更糟。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createXmlPreviewPlugin } from "vane-file-preview/custom-plugins/XmlPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createXmlPreviewPlugin()]);
const Flat = withPlugins(FilePreviewCore, [createXmlPreviewPlugin({ collapsedLevels: 0 })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "xml": Default,
  "xml:flat": Flat,
};

export const meta = { plugin: "xml" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
