/**
 * `vane-file-preview/custom-plugins/DocxPreviewPlugin`
 *
 * DOCX 离线预览（docx-preview）→ **还原版式**：分页、页边距、字号、表格边框都按
 * 文档里的 OOXML 来。代价是依赖比 mammoth 大，且产物是带内联样式的 DOM 树。
 *
 * ## 什么时候该用它，什么时候不该
 *
 * - 要「看起来跟 Word 里一样」→ 用它（`file.docxMode: "docx-preview"`）。
 * - 要「把内容抓出来做搜索 / 提取 / 二次排版」→ 用 `MammothDocxPlugin`（语义 HTML）。
 * - 只是想让用户看一眼 → 两个都行，默认的 mammoth 更轻。
 *
 * ## 迁移时删掉的一段「样式」
 *
 * 迁移前有一段 `<style>`，规则是
 * ```css
 * .docx-preview-container * { display: block !important; visibility: visible !important; }
 * ```
 * 两个问题：
 *   1. 这个类名从来没被加到任何元素上（`renderAsync` 生成的是 `docx-wrapper` /
 *      `docx` 结构），所以整段是死代码；
 *   2. **如果它生效了会更糟** —— 把 `table` / `tr` / `td` / `li` 全部改成 `display: block`，
 *      表格和列表会当场散架。这正是那种「为了修白屏而加的 !important」，
 *      治不了病、一旦命中就是灾难。
 * 现在删掉，改为给 `renderAsync` 传 `className` 并只调它真正支持的选项。
 */

import React, { useEffect, useRef, useState } from "react";

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

export interface DocxPreviewPluginConfig {
  /** 整个插件开关。默认 true（但只有 `file.docxMode === "docx-preview"` 时才会命中） */
  enabled?: boolean;
  /** 分页显示（页与页之间留白）。默认 true */
  breakPages?: boolean;
  /** 渲染页眉页脚。默认 true */
  renderHeaders?: boolean;
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface RenderOptions {
  className?: string;
  inWrapper?: boolean;
  breakPages?: boolean;
  renderHeaders?: boolean;
  renderFooters?: boolean;
}

interface DocxPreviewModule {
  renderAsync: (
    data: ArrayBuffer,
    bodyContainer: HTMLElement,
    styleContainer?: HTMLElement | null,
    options?: RenderOptions
  ) => Promise<unknown>;
}

/** 模块级常量，引用稳定 */
const loadDocxPreview = () => import("docx-preview");

function isDocx(file: FilePreviewPluginContext["file"]): boolean {
  if (file.extension.toLowerCase().replace(/^\./, "") === "docx") return true;
  return file.type === DOCX_MIME;
}

type DocxState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; error: string };

function DocxPreviewBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: Required<DocxPreviewPluginConfig>;
}) {
  const { file } = context;
  const docxModule = useDynamicModule(loadDocxPreview);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<DocxState>({ status: "loading" });

  useEffect(() => {
    if (docxModule.status !== "ready") return;

    let alive = true;
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const arrayBuffer = await res.arrayBuffer();

        const host = hostRef.current;
        if (!host) return;
        // 换文件时先清空，否则旧文档会叠在新文档上面
        host.innerHTML = "";

        const docx = defaultOf<DocxPreviewModule>(docxModule.mod);
        await docx.renderAsync(arrayBuffer, host, null, {
          className: "vfp-docx",
          inWrapper: true,
          breakPages: config.breakPages,
          renderHeaders: config.renderHeaders,
          renderFooters: config.renderHeaders,
        });

        if (!alive) return;
        setState({ status: "ready" });
      } catch (err) {
        if (!alive) return;
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "DOCX 渲染失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [file.url, docxModule, config.breakPages, config.renderHeaders]);

  if (docxModule.status === "unavailable") {
    return (
      <MissingDependency
        pkg="docx-preview"
        feature="还原 docx 版式需要 docx-preview"
        hint={
          <>
            只想把内容读出来（不需版式）可以装 <code>mammoth</code>，
            并把 <code>file.docxMode</code> 设为 <code>"mammoth"</code> 或不设。
          </>
        }
        error={docxModule.error.message}
      />
    );
  }

  if (docxModule.status === "loading") {
    return <LoadingPanel icon="📄" label="正在加载 docx-preview…" />;
  }

  if (state.status === "error") {
    return <ErrorPanel label="DOCX 渲染失败" error={state.error} />;
  }

  return (
    <div style={{ height: "100%", overflow: "auto", background: "#e5e7eb" }}>
      {/* renderAsync 会往这里塞 .docx-wrapper > section.docx 结构 */}
      <div ref={hostRef} data-vfp-docx-mode="docx-preview" />
      {state.status === "loading" && <LoadingPanel icon="📄" label="正在还原版式…" />}
    </div>
  );
}

export function createDocxPreviewPlugin(
  config: DocxPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<DocxPreviewPluginConfig> = {
    enabled: config.enabled ?? true,
    breakPages: config.breakPages ?? true,
    renderHeaders: config.renderHeaders ?? true,
  };

  return {
    name: "DocxPreviewPlugin",
    version: "1.0.0",
    description: "DOCX 版式还原预览（docx-preview）",
    supportedTypes: [DOCX_MIME],
    supportedExtensions: [".docx"],
    // 8 = 与 mammoth 同级（两者由 canHandle 互斥），但必须**高于 OfficePreviewPlugin 的 7**：
    // 平手时 resolve 走「声明顺序」，Office 写在前面就会抢走 —— 那正是迁移前
    // 「换个数组顺序就换个渲染器」的老问题。
    priority: 8,
    config: resolved,

    hooks: {
      canHandle: (file) =>
        resolved.enabled && isDocx(file) && file.docxMode === "docx-preview",

      render: (context) => (
        <DocxPreviewBody context={context} config={resolved} />
      ),

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="DOCX · 版式还原"
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

export default createDocxPreviewPlugin;
