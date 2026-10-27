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

import React, { useState } from "react";

import { isPubliclyReachableUrl, triggerDownload } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import { createIsolatedContainer } from "../../components/FilePreviewPlugin/shared/isolatedStyles";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
  FileInfo,
} from "../../components/FilePreviewPlugin/plugins/types";

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

function officeIcon(extension: string): string {
  const ext = extension.toLowerCase().replace(/^\./, "");
  if (ext.includes("doc")) return "📝";
  if (ext.includes("xls")) return "📊";
  if (ext.includes("ppt")) return "📽️";
  return "📄";
}

function buildViewerUrl(
  rawUrl: string,
  viewer: Exclude<OfficeViewer, "auto">
): string {
  // 在线查看器要绝对地址
  let absolute: string;
  try {
    absolute =
      typeof window === "undefined"
        ? rawUrl
        : new URL(rawUrl, window.location.origin).toString();
  } catch {
    absolute = rawUrl;
  }
  const encoded = encodeURIComponent(absolute);
  return viewer === "google"
    ? `https://docs.google.com/gview?url=${encoded}&embedded=true`
    : `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
}

// ============ 不可达说明面板 ============

function UnreachablePanel({ file }: { file: FileInfo }) {
  const isBlob = file.url.startsWith("blob:") || file.url.startsWith("data:");
  return (
    <div
      data-vfp-office-unreachable
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 24,
        boxSizing: "border-box",
        textAlign: "center",
        background: "#fafafa",
        color: "#57606a",
      }}
    >
      <div style={{ fontSize: 40, lineHeight: 1 }}>{officeIcon(file.extension)}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#1f2329" }}>
        这个地址无法用在线查看器打开
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.7, maxWidth: 420 }}>
        {isBlob ? (
          <>
            文件是 <code>{file.url.split(":")[0]}:</code> 地址，只存在于当前页面内存中，
            微软 / Google 的查看器取不到它。
          </>
        ) : (
          <>
            当前地址是 <code>{summarizeHost(file.url)}</code>，属于本机或内网，
            在线查看器的服务器访问不到。
          </>
        )}
        <br />
        Office 在线预览需要<strong>公网可访问的 URL</strong>
        （或用隧道工具临时暴露本地服务）。
        <br />
        想看离线渲染请装 <code>DocxPreviewPlugin</code> / <code>MammothDocxPlugin</code>
        （docx）或 <code>XlsxPreviewPlugin</code>（xlsx）。
      </div>
      {/*
        说明面板原本是死路：讲清了「为什么不行」，却没给下一个动作。
        而这里最该给的还是「下载」—— 文件就在手上，只是浏览器看不了。
      */}
      <button
        type="button"
        data-vfp-office-download
        onClick={() => triggerDownload(file.url, file.name)}
        style={{
          marginTop: 4,
          padding: "6px 14px",
          border: "1px solid #d0d7de",
          borderRadius: 6,
          background: "#fff",
          color: "#1f2329",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        📥 下载后用本地应用打开
      </button>
    </div>
  );
}

/** 只显示主机名，别把整条 URL（可能带 token）打到界面上 */
function summarizeHost(url: string): string {
  try {
    const u = new URL(url, typeof window === "undefined" ? undefined : window.location.href);
    return u.hostname || u.protocol;
  } catch {
    return "本地地址";
  }
}

// ============ 正文 ============

function OfficeBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const { file, state } = context;
  const [manualViewer, setManualViewer] = useState<"microsoft" | "google">(
    config.viewer === "google" ? "google" : "microsoft"
  );

  if (state.state !== "loaded") return null;
  if (!isPubliclyReachableUrl(file.url)) {
    return <UnreachablePanel file={file} />;
  }

  const effective = config.viewer === "auto" ? manualViewer : config.viewer;

  return (
    <div style={createIsolatedContainer({ background: "#f5f5f5" })}>
      <iframe
        src={buildViewerUrl(file.url, effective)}
        title={`${file.name} 预览`}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
      />
      {config.viewer === "auto" && (
        <button
          type="button"
          onClick={() =>
            setManualViewer((v) => (v === "microsoft" ? "google" : "microsoft"))
          }
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            zIndex: 3,
            padding: "4px 10px",
            fontSize: 11,
            borderRadius: 4,
            border: "1px solid #d0d7de",
            background: "rgba(255,255,255,0.92)",
            color: "#57606a",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          title="在线查看器加载失败时，换另一个服务试试"
        >
          换 {effective === "microsoft" ? "Google" : "Microsoft"} 查看器
        </button>
      )}
    </div>
  );
}

// ============ 工具栏 ============

function OfficeToolbar({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const { file } = context;
  return (
    <ToolbarContainer>
      <FileMeta
        name={file.name}
        size={file.size}
        type="Office 在线预览"
        icon={officeIcon(file.extension)}
      />
      {config.showToolbar && (
        <>
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
        </>
      )}
    </ToolbarContainer>
  );
}

// ============ 工厂 ============

export function createOfficePreviewPlugin(
  config: OfficePreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: ResolvedConfig = {
    viewer: config.viewer ?? "auto",
    showToolbar: config.showToolbar ?? true,
    preferDocxOnline: config.preferDocxOnline ?? false,
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
