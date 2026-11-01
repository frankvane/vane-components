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
 *
 * ## 安全边界：iframe 一律带最小权限 sandbox
 *
 * 文件预览的输入天然不可信。`file.url` 指向 real `application/pdf` 时浏览器进内置
 * 查看器、不执行 HTML；但只要服务端按扩展名给了 `text/html`（或消费方传的是同源的
 * `blob:`，blob 继承创建者 origin），裸 iframe 里的脚本就会**在宿主源执行**。
 * 因此默认 `sandbox="allow-scripts"`：
 *   - **刻意不给 `allow-same-origin`** —— 两者组合等于没加 sandbox，可逃逸回宿主源；
 *   - 不给 `allow-popups` / `allow-top-navigation`，脚本无法导航外层页面；
 *   - `referrerPolicy="no-referrer"`，不把宿主页面地址带给文件源。
 *
 * 权衡：个别浏览器（Chromium 系）在无 `allow-same-origin` 时可能不渲染内置 PDF 查看器
 * （表现为灰底空白）。若文件来源**完全可信**（自家静态目录 + 正确 MIME），可以显式
 * `sandbox: false` 或传更宽的策略；默认值不放开。
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
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";

export interface PdfPreviewPluginConfig {
  /**
   * 兼容保留。**已不再渲染 `<embed>`**（embed 不支持 sandbox，无法建立安全边界），
   * 两种取值都走同一个带 sandbox 的 `<iframe>`。
   */
  useIframe?: boolean;
  /** 是否保留浏览器 PDF 查看器自带的工具栏。默认 true */
  enableToolbar?: boolean;
  /**
   * iframe 的 sandbox 策略。默认 `"allow-scripts"`（不含 allow-same-origin）。
   * 传 `false` 关闭 sandbox —— 只应在文件来源可信时使用。
   */
  sandbox?: string | false;
  /** iframe 的 referrerPolicy。默认 `"no-referrer"` */
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

const DEFAULT_SANDBOX = "allow-scripts";
const DEFAULT_REFERRER_POLICY: React.HTMLAttributeReferrerPolicy = "no-referrer";

const PDF_ZOOM_KEY = "pdf:zoom";

/** 追加到 URL 的查看器参数，不覆盖 URL 上已有的 hash */
function withViewerParams(url: string, enableToolbar: boolean): string {
  if (enableToolbar) return url;
  const params = "toolbar=0&navpanes=0&scrollbar=0";
  // 已有 hash 时用 & 接上，否则开一个
  if (url.includes("#")) return `${url}&${params}`;
  return `${url}#${params}`;
}

// ============ 正文 ============

function PdfBody({
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

function PdfToolbar({
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

export function createPdfPreviewPlugin(
  config: PdfPreviewPluginConfig = {}
): FilePreviewPlugin {
  const enableToolbar = config.enableToolbar ?? true;
  const sandbox = config.sandbox === undefined ? DEFAULT_SANDBOX : config.sandbox;
  const referrerPolicy = config.referrerPolicy ?? DEFAULT_REFERRER_POLICY;
  const resolved = {
    useIframe: config.useIframe ?? true,
    enableToolbar,
    sandbox,
    referrerPolicy,
  };

  return {
    name: "PdfPreviewPlugin",
    version: "1.1.0",
    description: "PDF 预览（浏览器原生渲染，iframe 带最小权限 sandbox）",
    supportedTypes: ["application/pdf"],
    supportedExtensions: [".pdf"],
    priority: 10,
    config: resolved,

    hooks: {
      render: (context) => {
        if (context.state.state !== "loaded") return null;

        return (
          <PdfBody
            context={context}
            src={withViewerParams(context.file.url, enableToolbar)}
            sandbox={sandbox}
            referrerPolicy={referrerPolicy}
          />
        );
      },

      renderToolbar: (context) => (
        <PdfToolbar context={context} enableToolbar={enableToolbar} />
      ),
    },
  };
}

export default createPdfPreviewPlugin;
