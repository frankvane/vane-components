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

import React, { useEffect } from "react";

import {
  formatBytes,
  normalizeExtension,
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

export interface DownloadPluginConfig {
  /** 打开后自动触发一次下载。默认 false */
  autoDownload?: boolean;
  /** 卡片里显示文件名 / 类型 / 大小。默认 true */
  showFileInfo?: boolean;
}

const FILE_ICONS: Record<string, string> = {
  zip: "📦",
  rar: "📦",
  "7z": "📦",
  gz: "📦",
  tar: "📦",
  exe: "⚙️",
  dmg: "💿",
  iso: "💿",
  apk: "📱",
  db: "🗄️",
  sqlite: "🗄️",
  sql: "🗄️",
};

function fileIcon(extension: string): string {
  return FILE_ICONS[normalizeExtension(extension)] ?? "📄";
}

function DownloadBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: Required<DownloadPluginConfig>;
}) {
  const { file } = context;

  // autoDownload 只跑一次（以 URL 为界）：换文件才重来，
  // 否则 forceUpdate / 重渲染会反复弹下载。
  useEffect(() => {
    if (!config.autoDownload) return;
    triggerDownload(file.url, file.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.url, config.autoDownload]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        boxSizing: "border-box",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
      }}
    >
      <div style={{ fontSize: 80, lineHeight: 1, opacity: 0.9 }}>
        {fileIcon(file.extension)}
      </div>

      {config.showFileInfo && (
        <div style={{ textAlign: "center", maxWidth: "80%" }}>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 20,
              fontWeight: 500,
              overflowWrap: "anywhere",
            }}
          >
            {file.name}
          </h2>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              fontSize: 13,
              opacity: 0.9,
            }}
          >
            <span>{file.type || "未知类型"}</span>
            <span>•</span>
            <span>{file.size > 0 ? formatBytes(file.size) : "大小未知"}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => triggerDownload(file.url, file.name)}
        style={{
          padding: "10px 28px",
          fontSize: 15,
          fontWeight: 500,
          color: "#667eea",
          background: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontFamily: "inherit",
        }}
      >
        📥 下载文件
      </button>

      <p
        style={{
          fontSize: 12,
          opacity: 0.75,
          margin: 0,
          textAlign: "center",
          maxWidth: "90%",
        }}
      >
        没有插件能预览这种格式，先下载到本地再打开吧。
      </p>
    </div>
  );
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
