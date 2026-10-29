/**
 * `vane-file-preview/custom-plugins/PdfPreviewPlugin`
 *
 * PDF 预览走浏览器原生能力：`<iframe>`（默认）或 `<embed>`。
 * 不引 `pdfjs-dist` / `react-pdf` —— 迁移前的 `dependencies` 里有这两个（共 26 个依赖
 * 中的 2 个），代码里 **0 处引用**，是纯粹的体积负债（分析 R2）。
 *
 * ## 滚动收口（P2 留给 P3 的活）
 *
 * 装配层把正文容器统一设成 `overflow: auto`，不再按插件名特判。
 * 但 PDF 自带滚动条，如果 iframe 高度给了 `100%` 之外的任何值（比如固定 600px），
 * 就会出现「iframe 内一条滚动条 + 外层再一条」的双滚动条，滚轮行为还很怪。
 * 这里让容器与 iframe 都严格撑满、`overflow: hidden`，滚动完全交给 PDF 查看器自己。
 *
 * ## 已知限制
 *
 * 浏览器内置 PDF 查看器的**打印/下载按钮控制不了**：`#toolbar=0&navpanes=0`
 * 是 Chrome/Edge 的私有片段参数，Firefox 的 pdf.js 认 `#toolbar=0` 但 Safari
 * 基本忽略。要完全掌控 UI 只能上 pdf.js 自绘，那会把包撑到几百 KB，
 * 与「零重依赖」的定位冲突（ADR-16 D1）。
 */

import React from "react";

import { triggerDownload } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import type { FilePreviewPlugin } from "../../components/FilePreviewPlugin/plugins/types";

export interface PdfPreviewPluginConfig {
  /** 用 `<iframe>`（true，默认）还是 `<embed>`（false） */
  useIframe?: boolean;
  /** 是否保留浏览器 PDF 查看器自带的工具栏。默认 true */
  enableToolbar?: boolean;
}

/** 追加到 URL 的查看器参数，不覆盖 URL 上已有的 hash */
function withViewerParams(url: string, enableToolbar: boolean): string {
  if (enableToolbar) return url;
  const params = "toolbar=0&navpanes=0&scrollbar=0";
  // 已有 hash 时用 & 接上，否则开一个
  if (url.includes("#")) return `${url}&${params}`;
  return `${url}#${params}`;
}

export function createPdfPreviewPlugin(
  config: PdfPreviewPluginConfig = {}
): FilePreviewPlugin {
  const useIframe = config.useIframe ?? true;
  const enableToolbar = config.enableToolbar ?? true;
  const resolved = { useIframe, enableToolbar };

  return {
    name: "PdfPreviewPlugin",
    version: "1.0.0",
    description: "PDF 预览（浏览器原生渲染）",
    supportedTypes: ["application/pdf"],
    supportedExtensions: [".pdf"],
    priority: 10,
    config: resolved,

    hooks: {
      render: (context) => {
        const { file, state } = context;
        if (state.state !== "loaded") return null;

        const src = withViewerParams(file.url, enableToolbar);
        const frameStyle: React.CSSProperties = {
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        };

        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              // 滚动交给 PDF 查看器，外层不再滚（避免双滚动条）
              overflow: "hidden",
              background: "#525659",
            }}
          >
            {useIframe ? (
              <iframe src={src} title={file.name} style={frameStyle} />
            ) : (
              <embed
                src={src}
                type="application/pdf"
                style={frameStyle}
                title={file.name}
              />
            )}
          </div>
        );
      },

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="PDF"
            icon="📄"
          />
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载 PDF"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createPdfPreviewPlugin;
