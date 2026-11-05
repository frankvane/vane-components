/**
 * `vane-file-preview/custom-plugins/MammothDocxPlugin`
 *
 * DOCX 离线预览（mammoth）→ 干净的语义化 HTML。**默认的 docx 实现**。
 *
 * ## 两个 docx 插件怎么分工
 *
 * | | MammothDocxPlugin | DocxPreviewPlugin |
 * |---|---|---|
 * | 产物 | 语义 HTML（h1/p/table） | 还原版式（分页、页边距、字体） |
 * | 依赖 | `mammoth` | `docx-preview` |
 * | 默认 | ✅ | 需显式 `file.docxMode: "docx-preview"` |
 *
 * 由 `file.docxMode` 决定，**两个插件的 `canHandle` 互斥**，所以不存在「谁 priority 高」
 * 的隐式规则 —— 迁移前两个都声明 `.docx` + 都算 priority，赢家取决于注册顺序，
 * demo 里调换一下数组顺序就换个渲染器，没人知道为什么。
 *
 * ## 迁移时改掉的三件事
 *
 * 1. `mammoth/mammoth.browser` 静态 import → 动态 import。子路径尤其要小心：
 *    `external: ["mammoth"]` **匹配不到** `mammoth/mammoth.browser`，
 *    整库会被内联（见 vite.config 的注释）。
 * 2. `canHandle` 加 `file.docxMode` 判断（上面那张表）。
 * 3. 删掉 `styleMap: []` 空数组和「Mammoth 模式」这条纯粹的调试横幅 ——
 *    用户不需要知道渲染器内部名字；要看渲染差异请对比两个插件。
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
import { MammothBody } from "./internal";

export interface MammothDocxPluginConfig {
  /** 是否附带 mammoth 的默认样式映射（标题 / 列表 / 表格）。默认 true */
  withDefaultStyle?: boolean;
  /** 整个插件开关：关掉后 `.docx` 交给别的插件。默认 true */
  enabled?: boolean;
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** 模块级常量，引用稳定；子路径 import 也必须写在这里（静态可分析才能拆 chunk） */
const loadMammoth = () => import("mammoth/mammoth.browser");

function isDocx(file: FilePreviewPluginContext["file"]): boolean {
  if (file.extension.toLowerCase().replace(/^\./, "") === "docx") return true;
  return file.type === DOCX_MIME;
}

export function createMammothDocxPlugin(
  config: MammothDocxPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<MammothDocxPluginConfig> = {
    withDefaultStyle: config.withDefaultStyle ?? true,
    enabled: config.enabled ?? true,
  };

  return {
    name: "MammothDocxPlugin",
    version: "1.0.0",
    description: "DOCX 离线预览（mammoth，语义 HTML，默认实现）",
    supportedTypes: [DOCX_MIME],
    supportedExtensions: [".docx"],
    priority: 8,
    config: resolved,

    hooks: {
      // 与 DocxPreviewPlugin 互斥：默认走 mammoth，只有显式要版式时才让位
      canHandle: (file) =>
        resolved.enabled && isDocx(file) && file.docxMode !== "docx-preview",

      render: (context) => (
        <MammothBody
          context={context}
          config={resolved}
          loadMammoth={loadMammoth}
        />
      ),

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="DOCX"
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

export default createMammothDocxPlugin;
