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

import type React from "react";

import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { PdfBody, PdfToolbar } from "./internal";

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
