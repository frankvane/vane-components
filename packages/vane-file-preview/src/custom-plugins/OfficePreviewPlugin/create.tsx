/**
 * `vane-file-preview/custom-plugins/OfficePreviewPlugin`
 *
 * Office 文档（doc/docx/xls/xlsx/ppt/pptx）预览，走**第三方在线查看器**：
 * Microsoft Office Online（`view.officeapps.live.com`）或 Google Docs Viewer。
 * 本包不解析 OOXML，所以零依赖。
 *
 * ## 它的原理决定了它有很多「用不了」的场景
 *
 * 在线查看器是「它们的服务器去你给的 URL 拉文件，渲染成图片/HTML 再嵌进来」。
 * 所以目标 URL 必须**公网可达**：
 *   - `blob:` / `data:` —— 只存在当前页面内存里，服务端永远取不到；
 *   - `localhost` / `127.0.0.1` —— 指的是你自己的机器；
 *   - 内网段 / 无点主机名 —— 同理。
 * 迁移前只判断了 `localhost` 并且**照样渲染 iframe**，只是叠一条黄色提示，
 * 用户看到的是一个必然超时的空白框。现在渲染前先判断，命中就换成说明面板。
 *
 * ## 为什么保留 `priorityOf` 这个函数逃生口
 *
 * 它的优先级取决于 config：`preferDocxOnline: true` 时 docx 要给到 9，
 * 才能压过 `DocxPreviewPlugin`(8) / `MammothDocxPlugin`(8)；而 xlsx/pptx 仍是 7，
 * 不能抢走 `XlsxPreviewPlugin`(8)。这种「按文件 + 按 config 算」的规则
 * 声明式的常量 `priority` 表达不了，所以它是 17 个插件里唯一保留函数形式的一个
 * （`resolve.ts` 的 `priorityOf` 为此留着）。
 *
 * ## 自动降级做不到，别假装能做到
 *
 * 迁移前的 `handleError` 想在 Microsoft 失败时自动切 Google。但 iframe 的 `onError`
 * 对**跨域**加载失败根本不会触发（浏览器出于安全不给这个信号），
 * 那条分支实际上永远走不到。现在改成给用户一个「换查看器」按钮，
 * 并在注释里写明原因 —— 与其留一段看起来在工作、实则死掉的降级逻辑，
 * 不如让人知道要手动点。
 */

import type React from "react";

import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { OfficeBody, OfficeToolbar } from "./internal";

export type OfficeViewer = "microsoft" | "google" | "auto";

export interface OfficePreviewPluginConfig {
  /** 用哪个在线查看器。`auto` 默认先 Microsoft，可手动切 Google */
  viewer?: OfficeViewer;
  /** 工具栏里显示下载按钮。默认 true */
  showToolbar?: boolean;
  /**
   * docx 优先走在线查看器（优先级 9 > 本地解析插件的 8）。
   * 默认 false —— 本地解析（docx-preview / mammoth）不依赖公网，更可靠。
   */
  preferDocxOnline?: boolean;
  /**
   * iframe 的 sandbox 策略。默认 `"allow-scripts allow-same-origin allow-popups allow-forms"`。
   *
   * 这里允许 `allow-same-origin` 是安全的：目标是固定的第三方查看器域名
   * （view.officeapps.live.com / docs.google.com），与宿主**不同源**，
   * `allow-same-origin` 只还原查看器自身 origin，不会让脚本回到宿主源。
   * 反过来说，如果把 `src` 换成同源地址就**必须**去掉这一项 —— 本插件不允许那样配。
   */
  iframeSandbox?: string;
  /** iframe 的 referrerPolicy。默认 `"no-referrer"` */
  iframeReferrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

type ResolvedConfig = Required<OfficePreviewPluginConfig>;

const OFFICE_MIME = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
];

// ============ 工厂 ============

const DEFAULT_IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-popups allow-forms";
const DEFAULT_IFRAME_REFERRER_POLICY: React.HTMLAttributeReferrerPolicy =
  "no-referrer";

export function createOfficePreviewPlugin(
  config: OfficePreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: ResolvedConfig = {
    viewer: config.viewer ?? "auto",
    showToolbar: config.showToolbar ?? true,
    preferDocxOnline: config.preferDocxOnline ?? false,
    iframeSandbox: config.iframeSandbox ?? DEFAULT_IFRAME_SANDBOX,
    iframeReferrerPolicy:
      config.iframeReferrerPolicy ?? DEFAULT_IFRAME_REFERRER_POLICY,
  };

  return {
    name: "OfficePreviewPlugin",
    version: "1.0.0",
    description: "Office 文档在线预览（Office Online / Google Docs Viewer）",
    supportedTypes: OFFICE_MIME,
    // 带上宏 / 模板变体：Office Online 能看，而 mammoth / docx-preview / xlsx 都读不了
    supportedExtensions: [
      ".docx",
      ".docm",
      ".dotx",
      ".xlsx",
      ".xlsm",
      ".xltx",
      ".pptx",
      ".pptm",
      ".potx",
      ".doc",
      ".xls",
      ".ppt",
    ],
    // 声明式 7 是「非 docx」的默认值；docx 上由 priorityOf 按 config 覆盖成 9
    priority: 7,
    config: resolved,

    hooks: {
      priorityOf: (file) => {
        const isDocx =
          file.extension.toLowerCase().replace(/^\./, "") === "docx" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        // 只有 docx 会被提到 9；xlsx/pptx 必须留在 7，
        // 否则会把 XlsxPreviewPlugin(8) / PptxPreviewPlugin(8) 挤掉
        return resolved.preferDocxOnline && isDocx ? 9 : 7;
      },

      render: (context) => <OfficeBody context={context} config={resolved} />,
      renderToolbar: (context) => (
        <OfficeToolbar context={context} config={resolved} />
      ),
    },
  };
}

export default createOfficePreviewPlugin;
