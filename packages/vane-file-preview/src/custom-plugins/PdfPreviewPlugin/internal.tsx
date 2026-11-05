/**
 * `PdfPreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import React from "react";

import { triggerDownload } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import { useSharedValue } from "../../components/FilePreviewPlugin/shared/useSharedValue";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import type {
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";

const PDF_ZOOM_KEY = "pdf:zoom";

// ============ 正文 ============

export function PdfBody({
  context,
  src,
  sandbox,
  referrerPolicy,
}: {
  context: FilePreviewPluginContext;
  src: string;
  sandbox: string | false;
  referrerPolicy: React.HTMLAttributeReferrerPolicy;
}) {
  const [zoom] = useSharedValue(context, PDF_ZOOM_KEY, 1);

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
      {/*
        安全边界：默认 sandbox 不含 allow-same-origin，脚本无法回到宿主源。
        `zoom` 只在 enableToolbar=false 时由工具栏改动，用于补偿被隐藏的查看器缩放 UI。
      */}
      <iframe
        src={src}
        title={context.file.name}
        sandbox={sandbox === false ? undefined : sandbox}
        referrerPolicy={referrerPolicy}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          zoom: zoom !== 1 ? zoom : undefined,
        }}
      />
    </div>
  );
}

// ============ 工具栏 ============

export function PdfToolbar({
  context,
  enableToolbar,
}: {
  context: FilePreviewPluginContext;
  enableToolbar: boolean;
}) {
  const [zoom, setZoom] = useSharedValue(context, PDF_ZOOM_KEY, 1);

  return (
    <ToolbarContainer>
      <FileMeta
        name={context.file.name}
        size={context.file.size}
        type="PDF"
        icon="📄"
      />
      <ToolbarSeparator />
      {/*
        查看器 UI 被隐藏时，翻页/缩放入口就一起消失了。翻页无法在不解析 PDF 的
        前提下自绘（需要 pdf.js），这里只补回「缩放」，并明确写出翻页归属。
      */}
      {!enableToolbar && (
        <>
          <ToolbarButton
            onClick={() => setZoom(Math.max(0.5, Math.round((zoom - 0.1) * 100) / 100))}
            title="缩小"
            variant="icon"
            disabled={zoom <= 0.5}
          >
            −
          </ToolbarButton>
          <span
            style={{
              fontSize: 12,
              color: "#656d76",
              width: 44,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <ToolbarButton
            onClick={() => setZoom(Math.min(3, Math.round((zoom + 0.1) * 100) / 100))}
            title="放大"
            variant="icon"
            disabled={zoom >= 3}
          >
            +
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setZoom(1)}
            title="复位缩放"
            variant="icon"
          >
            ↺
          </ToolbarButton>
          <span style={{ fontSize: 11, color: "#8c959f" }}>
            翻页由浏览器查看器处理
          </span>
          <ToolbarSeparator />
        </>
      )}
      <ToolbarButton
        onClick={() => triggerDownload(context.file.url, context.file.name)}
        icon="📥"
        title="下载 PDF"
      >
        下载
      </ToolbarButton>
    </ToolbarContainer>
  );
}
