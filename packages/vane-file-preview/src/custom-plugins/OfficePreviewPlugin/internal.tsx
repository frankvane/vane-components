/**
 * `OfficePreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import { useState } from "react";

import { isPubliclyReachableUrl, triggerDownload } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import { createIsolatedContainer } from "../../components/FilePreviewPlugin/shared/isolatedStyles";
import type {
  FilePreviewPluginContext,
  FileInfo,
} from "../../components/FilePreviewPlugin/plugins/types";
import type { OfficePreviewPluginConfig, OfficeViewer } from "./create";

type ResolvedConfig = Required<OfficePreviewPluginConfig>;

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

export function UnreachablePanel({ file }: { file: FileInfo }) {
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

export function OfficeBody({
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
        sandbox={config.iframeSandbox}
        referrerPolicy={config.iframeReferrerPolicy}
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

export function OfficeToolbar({
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
