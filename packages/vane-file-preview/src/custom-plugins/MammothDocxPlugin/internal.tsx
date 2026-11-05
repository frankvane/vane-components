/**
 * `MammothDocxPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import { useEffect, useState } from "react";

import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import { sanitizeHtml } from "../../components/FilePreviewPlugin/shared/sanitizeHtml";
import {
  defaultOf,
  useDynamicModule,
} from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";
import type { MammothDocxPluginConfig } from "./create";

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

type DocxState =
  | { status: "loading" }
  | { status: "ready"; html: string; messages: string[] }
  | { status: "error"; error: string };

export function MammothBody({
  context,
  config,
  loadMammoth,
}: {
  context: FilePreviewPluginContext;
  config: Required<MammothDocxPluginConfig>;
  loadMammoth: () => Promise<unknown>;
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
          // mammoth 的产物是文件内容，不能默认它已转义；入库前先过白名单（P1-5）
          html: sanitizeHtml(result.value || ""),
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
