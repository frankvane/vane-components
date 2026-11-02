import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "print-optimize",
  title: "打印优化",
  group: "plugin",
  plugin: "PrintOptimizePlugin",
  intro: "注入 @media print 样式：分页不断行、隐藏工具条与遮罩、按 A4 出页。与 ExportPdf 协同。",
  why: "Ctrl/Cmd+P 直接能打印出干净版，不用临时删按钮。",
  plugs: [
    {
      fn: "createPrintOptimizePlugin",
      cfg: `pageSize: "A4"`,
      why: "onMount 注入打印样式；通常和 ExportPdf（print 通道）成对出现。",
    },
  ],
  props: [],
  note: "本插件只改打印输出（Ctrl/Cmd+P 或导出 PDF 的打印通道），屏幕上的渲染与裸 Core 一致是预期行为 —— 按 P 预览即可看到 A4 分页与工具条隐藏。",
};

export default makeStage("PrintOptimizePlugin");
