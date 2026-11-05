/**
 * `DocxPreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import { useEffect, useRef, useState } from "react";

import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import {
  defaultOf,
  useDynamicModule,
} from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";
import type { DocxPreviewPluginConfig } from "./create";

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

type DocxState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; error: string };

export function DocxPreviewBody({
  context,
  config,
  loadDocxPreview,
}: {
  context: FilePreviewPluginContext;
  config: Required<DocxPreviewPluginConfig>;
  loadDocxPreview: () => Promise<unknown>;
}) {
  const { file } = context;
  const docxModule = useDynamicModule(loadDocxPreview);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<DocxState>({ status: "loading" });

  useEffect(() => {
    if (docxModule.status !== "ready") return;

    let alive = true;
    // 换文件 / 卸载时真的取消请求，而不是只在回调里比对 alive
    const controller = new AbortController();
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(file.url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const arrayBuffer = await res.arrayBuffer();
        // fetch 完成时可能已经切走了：先在渲染前拦一次（P1-2）
        if (!alive) return;

        const docx = defaultOf<DocxPreviewModule>(docxModule.mod);
        /*
         * 先画到游离容器。renderAsync 是长操作，直接往 hostRef 里写的话，
         * 中途切文件会留下「做了一半的旧文档」，而且 clear 发生在 fetch 之后、
         * 旧文档在被清空前一直是可见的。
         */
        const staging = document.createElement("div");
        await docx.renderAsync(arrayBuffer, staging, null, {
          className: "vfp-docx",
          inWrapper: true,
          breakPages: config.breakPages,
          renderHeaders: config.renderHeaders,
          renderFooters: config.renderHeaders,
        });

        // 渲染完再检查一次：renderAsync 本身也可能跑了几百毫秒
        if (!alive) return;
        const host = hostRef.current;
        if (!host) return;
        host.replaceChildren(...Array.from(staging.childNodes));
        setState({ status: "ready" });
      } catch (err) {
        // abort 不是错误，别把「用户切走了」显示成渲染失败
        if (!alive || controller.signal.aborted) return;
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "DOCX 渲染失败",
        });
      }
    })();

    return () => {
      alive = false;
      controller.abort();
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
