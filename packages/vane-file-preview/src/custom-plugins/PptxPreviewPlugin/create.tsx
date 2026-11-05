/**
 * `vane-file-preview/custom-plugins/PptxPreviewPlugin`
 *
 * PPTX 预览 —— 准确说是**文本大纲预览**：用 jszip 解开 `ppt/slides/slideN.xml`，
 * 抽 `<a:p>` 段落里的 `<a:t>` 文本，按页展示。**没有版式、没有图片、没有主题色**。
 *
 * ## 为什么界面上必须写明「文本大纲」
 *
 * 迁移前这个插件在工具栏里写的是「PowerPoint 预览」，用户点开一个设计的 PPT
 * 看到一页一页纯文字，第一反应是「这个库坏了」。而实现上要复现版式，等于把
 * OOXML 的 drawingml 解析一遍（图片、形状、z-order、字体、母版），
 * 那是另一个项目的体量。所以这里：
 *   - 标题改成「PPTX 文本大纲」；
 *   - 正文顶部常驻一条说明，写明「只抽文本，版式与图片不渲染」；
 *   - `doc.json` 的 description / notes 同步这个口径。
 * 要真版式请装 `pptx-preview` 之类的完整渲染器，或走 Office 在线查看器。
 *
 * ## 迁移时改掉的其他问题
 *
 * 1. `jszip` 静态 import → 动态 import（没装依赖时给面板，不白屏）。
 * 2. 缩略图导航重写。迁移前那段 `slice(0,3) + slice(-3)` 加三处 `active` 判断，
 *    ≥4 页时会出现「当前页重复两次」和「点了不跳」的情况。现在只渲染一个窗口化的页码条。
 * 3. 段落抽取的两条分支（带命名空间 / 不带）合成一条：先用 `getElementsByTagName("a:p")`，
 *    为空再退到 `"p"`，逻辑一样但不再复制一遍 20 行。
 */

import {
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { PptxBody } from "./internal";

export interface PptxPreviewPluginConfig {
  /** 单页最多展示多少段，超出截断。默认 40 */
  maxParagraphsPerSlide?: number;
  /**
   * 超过这个字节数直接拒绝解析。默认 50MB。
   * pptx 要整包解开并逐页解析 XML，超大文件必须在 fetch 之前拦（P1-4）。
   * 设为 0 表示不限制。
   */
  maxFileSize?: number;
}

/** 模块级常量，引用稳定 */
const loadJSZip = () => import("jszip");

export function createPptxPreviewPlugin(
  config: PptxPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<PptxPreviewPluginConfig> = {
    maxParagraphsPerSlide: config.maxParagraphsPerSlide ?? 40,
    maxFileSize: config.maxFileSize ?? 50 * 1024 * 1024,
  };

  return {
    name: "PptxPreviewPlugin",
    version: "1.0.0",
    description: "PPTX 文本大纲预览（jszip，无版式）",
    supportedTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    supportedExtensions: [".pptx"],
    priority: 8,
    config: resolved,

    hooks: {
      render: (context) => (
        <PptxBody context={context} config={resolved} loadJSZip={loadJSZip} />
      ),

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="PPTX · 文本大纲"
            icon="📽️"
          />
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载原文件"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createPptxPreviewPlugin;
