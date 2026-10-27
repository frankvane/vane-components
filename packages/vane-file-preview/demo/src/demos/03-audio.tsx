/**
 * 03 · 音频预览
 *
 * 原生 <audio> 外面套一层卡片。浏览器自带的音频控件在各家长得都不一样，
 * 给一个稳定的落点之后，列表里多条音频不会忽高忽低。
 *
 * 坑位：没有波形图与自定义进度条，只有原生控件。要波形需要解码整段音频（AudioContext + canvas），与「零依赖 + 首屏快」的定位冲突。
 *
 * 坑位二（2026-10-27 修）：这一页的舞台只有 232px 高，工坊卡更只有 83px。
 * 原布局「音符 / 文件名 / 控件」纵向排，纵向预算 180px 起步 —— 越界之后 flex
 * 按比例压缩子项，唯一有固有高度的 `<audio>` 被压成 2.1px（这里）和 0（工坊卡），
 * 原生控件只剩一条细线。现在改成横向布局 + `flexShrink: 0`，矮于 128px 自动收成
 * 「只留控件」，并由 `squashed` 判据在体检里守着。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createAudioPreviewPlugin } from "vane-file-preview/custom-plugins/AudioPreviewPlugin";
import { PreviewSurface } from "../lib/previews";
import type { DemoStageProps } from "./types";

// 装配一律写在模块顶层。
// 写进组件体的后果：每次渲染都新建一个组件类型，React 只能整棵重挂 ——
// 缩放归零、滚动位置丢失、PDF 的 iframe 重新加载（每次白闪一下）。
const Default = withPlugins(FilePreviewCore, [createAudioPreviewPlugin()]);
const Looping = withPlugins(FilePreviewCore, [createAudioPreviewPlugin({ loop: true })]);

/** 档位 → 已经装配好的组件。切换只是换一个引用，不会新建类型。 */
const MAP: Record<string, React.ElementType> = {
  "audio": Default,
  "audio:loop": Looping,
};

export const meta = { plugin: "audio" };
export const keys = Object.keys(MAP);

const Demo: React.FC<DemoStageProps> = ({ file, variant, onLog, onState }) => {
  const Comp = MAP[variant] ?? Default;
  return <PreviewSurface Comp={Comp} file={file} onLog={onLog} onState={onState} />;
};

export default Demo;
