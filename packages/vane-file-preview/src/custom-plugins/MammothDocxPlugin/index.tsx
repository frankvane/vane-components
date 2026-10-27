/**
 * `vane-file-preview/custom-plugins/MammothDocxPlugin`
 *
 * DOCX 离线预览（mammoth）→ 干净的语义化 HTML。**默认的 docx 实现**。
 *
 * ## 两个 docx 插件怎么分工
 *
 * | | MammothDocxPlugin | DocxPreviewPlugin |
 * |---|---|---|
 * | 产物 | 语义 HTML（h1/p/table） | 还原版式（分页、页边距、字体） |
 * | 依赖 | `mammoth` | `docx-preview` |
 * | 默认 | ✅ | 需显式 `file.docxMode: "docx-preview"` |
 *
 * 由 `file.docxMode` 决定，**两个插件的 `canHandle` 互斥**，所以不存在「谁 priority 高」
 * 的隐式规则 —— 迁移前两个都声明 `.docx` + 都算 priority，赢家取决于注册顺序，
 * demo 里调换一下数组顺序就换个渲染器，没人知道为什么。
 *
 * ## 迁移时改掉的三件事
 *
 * 1. `mammoth/mammoth.browser` 静态 import → 动态 import。子路径尤其要小心：
 *    `external: ["mammoth"]` **匹配不到** `mammoth/mammoth.browser`，
 *    整库会被内联（见 vite.config 的注释）。
 * 2. `canHandle` 加 `file.docxMode` 判断（上面那张表）。
 * 3. 删掉 `styleMap: []` 空数组和「Mammoth 模式」这条纯粹的调试横幅 ——
 *    用户不需要知道渲染器内部名字；要看渲染差异请对比两个插件。
 */

import React, { useEffect, useState } from "react";

import {
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import {
  defaultOf,
  useDynamicModule,
} from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";

export interface MammothDocxPluginConfig {
  /** 是否附带 mammoth 的默认样式映射（标题 / 列表 / 表格）。默认 true */
  withDefaultStyle?: boolean;
  /** 整个插件开关：关掉后 `.docx` 交给别的插件。默认 true */
  enabled?: boolean;
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface MammothResult {
  value: string;
  messages: Array<{ message?: string; value?: string } | string>;
}

interface MammothModule {
  convertToHtml: (
    input: { arrayBuffer: ArrayBuffer },
    options: { includeDefaultStyleMap?: boolean }
  ) => Promise<MammothResult>;
}

/** 模块级常量，引用稳定；子路径 import 也必须写在这里（静态可分析才能拆 chunk） */
const loadMammoth = () => import("mammoth/mammoth.browser");

function isDocx(file: FilePreviewPluginContext["file"]): boolean {
  if (file.extension.toLowerCase().replace(/^\./, "") === "docx") return true;
  return file.type === DOCX_MIME;
}

type DocxState =
  | { status: "loading" }
  | { status: "ready"; html: string; messages: string[] }
  | { status: "error"; error: string };

function MammothBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: Required<MammothDocxPluginConfig>;
}) {
  const { file } = context;
  const mammothModule = useDynamicModule(loadMammoth);
  const [state, setState] = useState<DocxState>({ status: "loading" });
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    if (mammothModule.status !== "ready") return;

    let alive = true;
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const arrayBuffer = await res.arrayBuffer();

        const mammoth = defaultOf<MammothModule>(mammothModule.mod);
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          { includeDefaultStyleMap: config.withDefaultStyle }
        );

        if (!alive) return;
        setState({
          status: "ready",
          html: result.value || "",
          messages: (result.messages ?? []).map((m) =>
            typeof m === "string" ? m : String(m.message ?? m.value ?? "")
          ),
        });
      } catch (err) {
        if (!alive) return;
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "DOCX 解析失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [file.url, mammothModule, config.withDefaultStyle]);

  if (mammothModule.status === "unavailable") {
    return (
      <MissingDependency
        pkg="mammoth"
        feature="离线渲染 docx 需要 mammoth"
        hint={
          <>
            也可以改用 <code>DocxPreviewPlugin</code>（还原版式，依赖{" "}
            <code>docx-preview</code>）：装它并设置{" "}
            <code>file.docxMode: "docx-preview"</code>。
          </>
        }
        error={mammothModule.error.message}
      />
    );
  }

  if (mammothModule.status === "loading" || state.status === "loading") {
    return <LoadingPanel icon="📄" label="正在转换 DOCX…" />;
  }

  if (state.status === "error") {
    return <ErrorPanel label="DOCX 解析失败" error={state.error} />;
  }

  return (
    <div style={{ height: "100%", overflow: "auto", background: "#fff" }}>
      <style>{`
        .vfp-docx-mammoth { padding: 24px 28px; color: #1f2937; font-size: 14px; line-height: 1.75; }
        .vfp-docx-mammoth h1 { font-size: 24px; margin: 20px 0 12px; }
        .vfp-docx-mammoth h2 { font-size: 20px; margin: 18px 0 10px; }
        .vfp-docx-mammoth h3 { font-size: 17px; margin: 16px 0 8px; }
        .vfp-docx-mammoth p { margin: 10px 0; }
        .vfp-docx-mammoth table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .vfp-docx-mammoth th, .vfp-docx-mammoth td { border: 1px solid #d1d5db; padding: 6px 10px; }
        .vfp-docx-mammoth img { max-width: 100%; height: auto; }
        .vfp-docx-mammoth ul, .vfp-docx-mammoth ol { padding-left: 1.4em; }
      `}</style>

      <div
        className="vfp-docx-mammoth"
        data-vfp-docx-mode="mammoth"
        dangerouslySetInnerHTML={{ __html: state.html }}
      />

      {state.messages.length > 0 && (
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            padding: "10px 28px 20px",
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          <button
            type="button"
            onClick={() => setShowMessages((v) => !v)}
            style={{
              padding: 0,
              border: "none",
              background: "none",
              color: "#6b7280",
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            mammoth 有 {state.messages.length} 条转换提示（不一定是错误）
          </button>
          {showMessages && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {state.messages.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function createMammothDocxPlugin(
  config: MammothDocxPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<MammothDocxPluginConfig> = {
    withDefaultStyle: config.withDefaultStyle ?? true,
    enabled: config.enabled ?? true,
  };

  return {
    name: "MammothDocxPlugin",
    version: "1.0.0",
    description: "DOCX 离线预览（mammoth，语义 HTML，默认实现）",
    supportedTypes: [DOCX_MIME],
    supportedExtensions: [".docx"],
    priority: 8,
    config: resolved,

    hooks: {
      // 与 DocxPreviewPlugin 互斥：默认走 mammoth，只有显式要版式时才让位
      canHandle: (file) =>
        resolved.enabled && isDocx(file) && file.docxMode !== "docx-preview",

      render: (context) => (
        <MammothBody context={context} config={resolved} />
      ),

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="DOCX"
            icon="📄"
          />
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载原文件"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createMammothDocxPlugin;
