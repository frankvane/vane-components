/**
 * `DownloadPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import { useEffect } from "react";

import {
  formatBytes,
  normalizeExtension,
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import type {
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";
import type { DownloadPluginConfig } from "./create";

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

export function DownloadBody({
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
        background: "linear-gradient(135deg, #4a5bd0 0%, #5b3a7e 100%)",
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
          color: "#4a5bd0",
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
