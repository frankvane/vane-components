/**
 * `vane-file-preview/custom-plugins/ZipPreviewPlugin`
 *
 * 压缩包预览：解出条目列表（目录在前、文件在后），显示未压缩大小。
 *
 * ## 迁移时改掉的三件事
 *
 * 1. **`jszip` 从静态 import 改成动态 import** —— 没装依赖时渲染
 *    `MissingDependency` 面板，而不是让整个页面在模块加载阶段崩掉（见 panels.tsx）。
 * 2. **`maxFiles` / `showFileSize` 从「声明了但没用」变成真的生效**。
 *    迁移前两个配置项都写在 `config` 里、也进了 doc，但渲染时既没截断也没隐藏：
 *    一个 5000 文件的压缩包会一次性铺 5000 个 div，而且大小列永远显示。
 * 3. **`name` 保持 `ZipPreviewPlugin`，`priority` 从 `hooks.getPriority()` 改成声明式 8。**
 *
 * ## 只读列表，不解压内容
 *
 * 解压内层文件意味着要把内容渲成新文件再走一遍预览管线（递归装配），
 * 复杂度远大于「看一眼里面有什么」的需求。压缩包里最常见的需求就是「有没有这个文件」，
 * 所以这里停在列表层，并在底部写明这个边界。
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
import { ZipBody } from "./internal";

export interface ZipPreviewPluginConfig {
  /** 显示每一项的未压缩大小。默认 true */
  showFileSize?: boolean;
  /** 最多列出多少项，超出只提示总数。默认 200 */
  maxFiles?: number;
  /**
   * 超过这个字节数直接拒绝解析。默认 50MB。
   * 压缩包要整份读进内存再解中央目录，超大文件必须在 fetch 之前拦（P1-4）。
   * 设为 0 表示不限制。
   */
  maxFileSize?: number;
}

/** 模块级常量：引用稳定，`useDynamicModule` 的 effect 只跑一次 */
const loadJSZip = () => import("jszip");

export function createZipPreviewPlugin(
  config: ZipPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<ZipPreviewPluginConfig> = {
    showFileSize: config.showFileSize ?? true,
    maxFiles: config.maxFiles ?? 200,
    maxFileSize: config.maxFileSize ?? 50 * 1024 * 1024,
  };

  return {
    name: "ZipPreviewPlugin",
    version: "1.0.0",
    description: "压缩包条目列表（jszip）",
    supportedTypes: ["application/zip", "application/x-zip-compressed"],
    // 只声明 .zip：.rar / .7z 的**容器格式不同**，jszip 一律解不开，
    // 迁移前把它们写在这里等于「认领了再报错」。它们应当落到兜底下载。
    supportedExtensions: [".zip"],
    priority: 9,
    config: resolved,

    hooks: {
      render: (context) => (
        <ZipBody context={context} config={resolved} loadJSZip={loadJSZip} />
      ),

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="ZIP"
            icon="📦"
          />
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载压缩包"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createZipPreviewPlugin;
