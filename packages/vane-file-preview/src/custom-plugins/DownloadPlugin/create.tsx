/**
 * `vane-file-preview/custom-plugins/DownloadPlugin`
 *
 * 兜底插件：认领**所有**文件，`priority: -1` 排最后，只在没有别的插件接手时生效，
 * 给一个「这个格式预览不了，但你可以下载」的卡片。
 *
 * ## 装了它就不会再有 unsupported 面板
 *
 * `canHandle: () => true` 意味着 `resolvePreview()` 永远能选出赢家。
 * 这是兜底的**设计后果**，不是 bug：想让用户看到「没有插件认领」的提示，
 * 就别把这个插件装进装配列表。
 *
 * ## 迁移时修掉的 hooks 违规
 *
 * 迁移前的 `render` 钩子里直接写 `React.useEffect(...)` 来做 autoDownload。
 * `render` 是普通函数不是组件，那样写等于把 hook 注册到 `withPlugins` 的 hook 链上：
 * 换文件 / 装配变化时调用次数一变，React 就抛 “Rendered fewer hooks than expected”。
 * 现在 autoDownload 挪进 `DownloadBody` 组件里。
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
import { DownloadBody } from "./internal";

export interface DownloadPluginConfig {
  /** 打开后自动触发一次下载。默认 false */
  autoDownload?: boolean;
  /** 卡片里显示文件名 / 类型 / 大小。默认 true */
  showFileInfo?: boolean;
}

export function createDownloadPlugin(
  config: DownloadPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<DownloadPluginConfig> = {
    autoDownload: config.autoDownload ?? false,
    showFileInfo: config.showFileInfo ?? true,
  };

  return {
    name: "DownloadPlugin",
    version: "1.0.0",
    description: "兜底：任何文件都能下载",
    // 声明成星号通配只是为了让「能力」在文档里可见；实际生效靠下面的 canHandle
    supportedTypes: ["*/*"],
    // 负数优先级必须写成字面量 -1（文档生成器按 `priority: N` 抓数字，见 P6）
    priority: -1,
    config: resolved,

    hooks: {
      // 声明了 canHandle 就完全由它决定认不认文件（resolve.ts 的互斥规则）
      canHandle: () => true,
      render: (context) => (
        <DownloadBody context={context} config={resolved} />
      ),

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="Unknown"
            icon="📄"
          />
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载文件"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createDownloadPlugin;
