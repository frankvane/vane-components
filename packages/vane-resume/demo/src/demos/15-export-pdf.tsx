import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "export-pdf",
  title: "导出 PDF",
  group: "plugin",
  plugin: "ExportPdfPlugin",
  intro: "打印通道（配合 PrintOptimize）或 canvas 通道（html2canvas + jsPDF 拼页，按需加载）。",
  why: "终稿交给招聘系统，PDF 比网页兼容性好；打印通道零额外依赖。",
  plugs: [
    {
      fn: "createExportPdfPlugin",
      cfg: `method: "print"`,
      why: "renderToolbar 提供导出按钮；print 通道与 PrintOptimize 协同出 A4。",
    },
  ],
  props: [],
  note: "canvas 通道需 html2canvas + jsPDF，默认按需加载，演示用 print 通道即可。",
};

export default makeStage("ExportPdfPlugin");
