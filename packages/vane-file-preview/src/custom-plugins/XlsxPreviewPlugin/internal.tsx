/**
 * `XlsxPreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import { useEffect, useMemo, useState } from "react";

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
import type { XlsxPreviewPluginConfig } from "./create";

/** sharedData 的键：正文与工具栏共用，避免两边各存一份状态 */
const KEY_SHEETS = "xlsx.sheetNames";
const KEY_ACTIVE = "xlsx.activeSheet";

interface WorkBookLike {
  SheetNames: string[];
  Sheets: Record<string, unknown>;
}

interface XlsxModule {
  read: (data: Uint8Array, opts: { type: "array" }) => WorkBookLike;
  utils: {
    sheet_to_html: (
      sheet: unknown,
      opts: Record<string, unknown>
    ) => string;
    decode_range: (ref: string) => {
      s: { r: number; c: number };
      e: { r: number; c: number };
    };
    encode_range: (range: {
      s: { r: number; c: number };
      e: { r: number; c: number };
    }) => string;
  };
}

type XlsxState =
  | { status: "loading" }
  | { status: "ready"; workbook: WorkBookLike; truncated: boolean }
  | { status: "error"; error: string };

export function XlsxBody({
  context,
  config,
  loadXlsx,
}: {
  context: FilePreviewPluginContext;
  config: Required<XlsxPreviewPluginConfig>;
  loadXlsx: () => Promise<unknown>;
}) {
  const { file, sharedData } = context;
  const xlsxModule = useDynamicModule(loadXlsx);
  const [state, setState] = useState<XlsxState>({ status: "loading" });

  // 活动 sheet 只有一份：sharedData。工具栏改它，正文读它。
  const activeSheet = (sharedData.get(KEY_ACTIVE) as number | undefined) ?? 0;

  useEffect(() => {
    if (xlsxModule.status !== "ready") return;

    let alive = true;
    setState({ status: "loading" });

    (async () => {
      try {
        // 先按 size 拦：SheetJS 解析不可中断，等读完再判断已经晚了（P1-4）
        if (config.maxFileSize > 0 && file.size > config.maxFileSize) {
          throw new Error(
            `文件 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过表格解析上限 ${(
              config.maxFileSize /
              1024 /
              1024
            ).toFixed(1)}MB`
          );
        }

        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const buf = await res.arrayBuffer();

        const XLSX = defaultOf<XlsxModule>(xlsxModule.mod);
        const workbook = XLSX.read(new Uint8Array(buf), { type: "array" });

        if (!alive) return;
        sharedData.set(KEY_SHEETS, workbook.SheetNames);
        sharedData.set(
          KEY_ACTIVE,
          Math.min(config.defaultSheetIndex, workbook.SheetNames.length - 1)
        );
        setState({ status: "ready", workbook, truncated: false });
        // 工具栏在另一棵子树上，靠 forceUpdate 把它拉起来重读 sharedData
        context.forceUpdate();
      } catch (err) {
        if (!alive) return;
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "表格解析失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sharedData / forceUpdate 是稳定引用
  }, [file.url, xlsxModule, config.defaultSheetIndex]);

  const rendered = useMemo(() => {
    if (state.status !== "ready" || xlsxModule.status !== "ready") {
      return { html: "", truncated: false, rows: 0, cols: 0 };
    }

    const XLSX = defaultOf<XlsxModule>(xlsxModule.mod);
    const sheetName =
      state.workbook.SheetNames[activeSheet] ?? state.workbook.SheetNames[0];
    const sheet = sheetName ? state.workbook.Sheets[sheetName] : undefined;
    if (!sheet) return { html: "", truncated: false, rows: 0, cols: 0 };

    // 按上限裁 range。`!ref` 是 SheetJS 记录 used range 的字段
    const ref = (sheet as { "!ref"?: string })["!ref"];
    let truncated = false;
    let target = sheet;

    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      const clipped = {
        s: { r: range.s.r, c: range.s.c },
        e: {
          r: Math.min(range.e.r, range.s.r + config.maxRows - 1),
          c: Math.min(range.e.c, range.s.c + config.maxCols - 1),
        },
      };
      truncated = clipped.e.r !== range.e.r || clipped.e.c !== range.e.c;
      target = { ...(sheet as object), "!ref": XLSX.utils.encode_range(clipped) };
    }

    const html = XLSX.utils.sheet_to_html(target, {
      id: "vfp-xlsx-table",
      editable: false,
      header: "",
      footer: "",
    });

    // SheetJS 的 sheet_to_html 直接拼字符串，单元格内容来自文件；过白名单再进 DOM（P1-5）
    return { html: sanitizeHtml(html), truncated, rows: 0, cols: 0 };
  }, [state, activeSheet, xlsxModule, config.maxRows, config.maxCols]);

  if (xlsxModule.status === "unavailable") {
    return (
      <MissingDependency
        pkg="xlsx"
        feature="在浏览器里离线解析 xlsx 需要这个包"
        hint="也可以用 OfficePreviewPlugin 走在线查看器（需要公网可访问的 URL）。"
        error={xlsxModule.error.message}
      />
    );
  }

  if (xlsxModule.status === "loading" || state.status === "loading") {
    return <LoadingPanel icon="📊" label="正在解析表格…" />;
  }

  if (state.status === "error") {
    return <ErrorPanel label="表格解析失败" error={state.error} />;
  }

  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        padding: 16,
        boxSizing: "border-box",
        background: "#f5f6f7",
      }}
    >
      <style>{`
        #vfp-xlsx-table {
          border-collapse: collapse;
          font-family: 'Segoe UI', Calibri, Arial, sans-serif;
          font-size: 12px;
          background: #fff;
          border: 1px solid #d0d0d0;
        }
        #vfp-xlsx-table td, #vfp-xlsx-table th {
          border: 1px solid #e3e3e3;
          padding: 4px 8px;
          max-width: 320px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: middle;
        }
        #vfp-xlsx-table tr:first-child td {
          background: #f0f4f8;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        #vfp-xlsx-table tr:hover td { background: #eef6ff; }
      `}</style>

      {rendered.truncated && (
        <div
          data-vfp-xlsx-truncated
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: 6,
            fontSize: 12,
            color: "#9a3412",
          }}
        >
          表格较大，只渲染了前 {config.maxRows} 行 × {config.maxCols} 列
          （maxRows / maxCols 可调）。完整内容请下载原文件。
        </div>
      )}

      {rendered.html ? (
        <div dangerouslySetInnerHTML={{ __html: rendered.html }} />
      ) : (
        <div style={{ color: "#6b7280", fontSize: 13 }}>这张 sheet 是空的。</div>
      )}
    </div>
  );
}

/** 工具栏里的 Sheet 页签。读 sharedData，点击改 sharedData 再 forceUpdate */
export function SheetTabs({ context }: { context: FilePreviewPluginContext }) {
  const names = (context.sharedData.get(KEY_SHEETS) as string[] | undefined) ?? [];
  const active = (context.sharedData.get(KEY_ACTIVE) as number | undefined) ?? 0;

  if (names.length <= 1) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {names.map((name, i) => (
        <button
          key={`${name}:${i}`}
          type="button"
          onClick={() => {
            context.sharedData.set(KEY_ACTIVE, i);
            context.forceUpdate();
          }}
          style={{
            padding: "3px 10px",
            fontSize: 12,
            borderRadius: 4,
            border: `1px solid ${i === active ? "#007acc" : "#d1d5db"}`,
            background: i === active ? "#007acc" : "#fff",
            color: i === active ? "#fff" : "#374151",
            cursor: "pointer",
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={name}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
