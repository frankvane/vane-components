/**
 * 全量桶入口 —— `vane-file-preview/custom-plugins`
 *
 * **常规用法不推荐走这里**：它把 17 个插件全部拉进依赖图，消费方打包时
 * 一个都 tree-shake 不掉（每个插件都要 `export const xxx = …`，无法静态判定未使用）。
 * 需要哪几个就按子路径引：
 *
 * ```ts
 * import { createImagePreviewPlugin } from "vane-file-preview/custom-plugins/ImagePreviewPlugin";
 * ```
 *
 * 这个桶存在的理由是「想全都装上」和「做插件工坊 / 文档站」两种场景 ——
 * 手写 17 行 import 容易漏，而漏掉的插件在某类文件上会静默落到兜底下载。
 *
 * 分组按**文件大类**，与 demo 的页签、docs 的表格顺序一致。
 * 重依赖（jszip / xlsx / mammoth / docx-preview / react-markdown /
 * react-syntax-highlighter / papaparse / react-reader …）全部是动态 import，
 * 所以引了这个桶**不等于**装了那些 peer —— 渲染到具体文件时才会去 import，
 * 缺了就渲染 MissingDependency 面板。
 */

// ============ media · 图片与音视频 ============
export {
  createImagePreviewPlugin,
  type ImagePreviewPluginConfig,
} from "./ImagePreviewPlugin";
export {
  createVideoPreviewPlugin,
  type VideoPreviewPluginConfig,
} from "./VideoPreviewPlugin";
export {
  createAudioPreviewPlugin,
  type AudioPreviewPluginConfig,
} from "./AudioPreviewPlugin";

// ============ document · 文档 ============
export {
  createPdfPreviewPlugin,
  type PdfPreviewPluginConfig,
} from "./PdfPreviewPlugin";
export {
  createOfficePreviewPlugin,
  type OfficePreviewPluginConfig,
} from "./OfficePreviewPlugin";
export {
  createDocxPreviewPlugin,
  type DocxPreviewPluginConfig,
} from "./DocxPreviewPlugin";
export {
  createMammothDocxPlugin,
  type MammothDocxPluginConfig,
} from "./MammothDocxPlugin";
export {
  createPptxPreviewPlugin,
  type PptxPreviewPluginConfig,
} from "./PptxPreviewPlugin";
export {
  createMarkdownPreviewPlugin,
  type MarkdownPreviewPluginConfig,
} from "./MarkdownPreviewPlugin";
export {
  createEpubPreviewPlugin,
  createSimpleReactReaderEpubPlugin,
  type EpubPreviewPluginConfig,
} from "./EpubPreviewPlugin";

// ============ data · 结构化数据 ============
export {
  createJsonPreviewPlugin,
  type JsonPreviewPluginConfig,
} from "./JsonPreviewPlugin";
export {
  createXmlPreviewPlugin,
  type XmlPreviewPluginConfig,
} from "./XmlPreviewPlugin";
export {
  createXlsxPreviewPlugin,
  type XlsxPreviewPluginConfig,
} from "./XlsxPreviewPlugin";
export {
  createCsvPreviewPlugin,
  type CsvPreviewPluginConfig,
} from "./CsvPreviewPlugin";

// ============ archive · 压缩包 ============
export {
  createZipPreviewPlugin,
  type ZipPreviewPluginConfig,
} from "./ZipPreviewPlugin";

// ============ other · 其余 ============
export {
  createCodePreviewPlugin,
  type CodePreviewPluginConfig,
} from "./CodePreviewPlugin";
export {
  createDownloadPlugin,
  type DownloadPluginConfig,
} from "./DownloadPlugin";

// ============ 汇总表 ============

import { createImagePreviewPlugin as image } from "./ImagePreviewPlugin";
import { createVideoPreviewPlugin as video } from "./VideoPreviewPlugin";
import { createAudioPreviewPlugin as audio } from "./AudioPreviewPlugin";
import { createPdfPreviewPlugin as pdf } from "./PdfPreviewPlugin";
import { createOfficePreviewPlugin as office } from "./OfficePreviewPlugin";
import { createDocxPreviewPlugin as docx } from "./DocxPreviewPlugin";
import { createMammothDocxPlugin as mammoth } from "./MammothDocxPlugin";
import { createPptxPreviewPlugin as pptx } from "./PptxPreviewPlugin";
import { createMarkdownPreviewPlugin as markdown } from "./MarkdownPreviewPlugin";
import { createEpubPreviewPlugin as epub } from "./EpubPreviewPlugin";
import { createJsonPreviewPlugin as json } from "./JsonPreviewPlugin";
import { createXmlPreviewPlugin as xml } from "./XmlPreviewPlugin";
import { createXlsxPreviewPlugin as xlsx } from "./XlsxPreviewPlugin";
import { createCsvPreviewPlugin as csv } from "./CsvPreviewPlugin";
import { createZipPreviewPlugin as zip } from "./ZipPreviewPlugin";
import { createCodePreviewPlugin as code } from "./CodePreviewPlugin";
import { createDownloadPlugin as download } from "./DownloadPlugin";

/**
 * 插件名 → 工厂。给「插件工坊」这类需要逐个开关的界面用；
 * 也方便测试断言「17 个插件名不重复」。
 *
 * 顺序 = 优先级从高到低的直觉顺序（同 priority 时 `resolvePreview` 保持声明顺序，
 * 所以这个顺序也会影响平手结果）。
 */
export const PLUGIN_FACTORIES = {
  ImagePreviewPlugin: image,
  VideoPreviewPlugin: video,
  AudioPreviewPlugin: audio,
  PdfPreviewPlugin: pdf,
  OfficePreviewPlugin: office,
  MarkdownPreviewPlugin: markdown,
  CsvPreviewPlugin: csv,
  ZipPreviewPlugin: zip,
  DocxPreviewPlugin: docx,
  MammothDocxPlugin: mammoth,
  PptxPreviewPlugin: pptx,
  XlsxPreviewPlugin: xlsx,
  JsonPreviewPlugin: json,
  XmlPreviewPlugin: xml,
  CodePreviewPlugin: code,
  EpubPreviewPlugin: epub,
  DownloadPlugin: download,
} as const;

export type PluginName = keyof typeof PLUGIN_FACTORIES;

/** 17 个插件的默认实例（全部默认配置） */
export function createAllPlugins() {
  return Object.values(PLUGIN_FACTORIES).map((factory) => factory());
}
