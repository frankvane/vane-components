/**
 * `vane-file-preview/custom-plugins/DocxPreviewPlugin`
 *
 * DOCX 离线预览（docx-preview）→ **还原版式**：分页、页边距、字号、表格边框都按
 * 文档里的 OOXML 来。代价是依赖比 mammoth 大，且产物是带内联样式的 DOM 树。
 *
 * ## 什么时候该用它，什么时候不该
 *
 * - 要「看起来跟 Word 里一样」→ 用它（`file.docxMode: "docx-preview"`）。
 * - 要「把内容抓出来做搜索 / 提取 / 二次排版」→ 用 `MammothDocxPlugin`（语义 HTML）。
 * - 只是想让用户看一眼 → 两个都行，默认的 mammoth 更轻。
 *
 * ## 迁移时删掉的一段「样式」
 *
 * 迁移前有一段 `<style>`，规则是
 * ```css
 * .docx-preview-container * { display: block !important; visibility: visible !important; }
 * ```
 * 两个问题：
 *   1. 这个类名从来没被加到任何元素上（`renderAsync` 生成的是 `docx-wrapper` /
 *      `docx` 结构），所以整段是死代码；
 *   2. **如果它生效了会更糟** —— 把 `table` / `tr` / `td` / `li` 全部改成 `display: block`，
 *      表格和列表会当场散架。这正是那种「为了修白屏而加的 !important」，
 *      治不了病、一旦命中就是灾难。
 * 现在删掉，改为给 `renderAsync` 传 `className` 并只调它真正支持的选项。
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
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";
import { DocxPreviewBody } from "./internal";

export interface DocxPreviewPluginConfig {
  /** 整个插件开关。默认 true（但只有 `file.docxMode === "docx-preview"` 时才会命中） */
  enabled?: boolean;
  /** 分页显示（页与页之间留白）。默认 true */
  breakPages?: boolean;
  /** 渲染页眉页脚。默认 true */
  renderHeaders?: boolean;
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** 模块级常量，引用稳定 */
const loadDocxPreview = () => import("docx-preview");

function isDocx(file: FilePreviewPluginContext["file"]): boolean {
  if (file.extension.toLowerCase().replace(/^\./, "") === "docx") return true;
  return file.type === DOCX_MIME;
}

export function createDocxPreviewPlugin(
  config: DocxPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<DocxPreviewPluginConfig> = {
    enabled: config.enabled ?? true,
    breakPages: config.breakPages ?? true,
    renderHeaders: config.renderHeaders ?? true,
  };

  return {
    name: "DocxPreviewPlugin",
    version: "1.0.0",
    description: "DOCX 版式还原预览（docx-preview）",
    supportedTypes: [DOCX_MIME],
    supportedExtensions: [".docx"],
    // 8 = 与 mammoth 同级（两者由 canHandle 互斥），但必须**高于 OfficePreviewPlugin 的 7**：
    // 平手时 resolve 走「声明顺序」，Office 写在前面就会抢走 —— 那正是迁移前
    // 「换个数组顺序就换个渲染器」的老问题。
    priority: 8,
    config: resolved,

    hooks: {
      canHandle: (file) =>
        resolved.enabled && isDocx(file) && file.docxMode === "docx-preview",

      render: (context) => (
        <DocxPreviewBody
          context={context}
          config={resolved}
          loadDocxPreview={loadDocxPreview}
        />
      ),

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="DOCX · 版式还原"
            icon="📄"
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

export default createDocxPreviewPlugin;
