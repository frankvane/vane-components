/**
 * `vane-file-preview/custom-plugins/XlsxPreviewPlugin`
 *
 * XLSX 离线解析（SheetJS）→ HTML 表格，带**真的** Sheet 切换。
 *
 * ## 迁移时改掉的三件事
 *
 * 1. **删掉 16 处 `console.log`。** 迁移前每打开一个表格会打印渲染、effect、
 *    useMemo、状态分支的每一帧，还打印整份 sheetNames；控制台滚屏不说，
 *    这些日志在「为什么表格没出来」时反而是噪音。
 * 2. **Sheet 切换从假的变成真的。** 迁移前工具栏写死 `Sheet: 1`，
 *    而 `activeSheet` state 存在正文组件里、工具栏根本读不到。
 *    现在用 `context.sharedData` 当跨插件共享的单一真源 + `forceUpdate()` 驱动：
 *    正文解析完把 `sheetNames` 写进 sharedData，工具栏照着渲染页签，
 *    点页签就改 sharedData 再 forceUpdate。
 * 3. **加行/列上限（`maxRows` / `maxCols`）。** `sheet_to_html` 会一次性铺满整个
 *    used range：一张 5 万行的表直接产出几十万个 `<td>`，浏览器当场卡死。
 *    按 range 切前 N 行 N 列，并明确告警「只显示了前 N 行」——
 *    比「转圈到用户以为坏了」诚实。
 *
 * ## license 提醒
 *
 * `xlsx`（SheetJS Community Edition）是 **Apache-2.0**，商用可以，但要注意：
 * npm 上的 `xlsx` 停在 0.18.5 —— SheetJS 从 0.19 起改在自己的 CDN 分发
 * （`https://cdn.sheetjs.com/`），npm 包不再更新。想要新版本得换源安装。
 * 本条也写进了 `doc.json` 的 notes，免得消费方以为 npm 上是最新的。
 */

import React, { useEffect, useMemo, useState } from "react";

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

export interface XlsxPreviewPluginConfig {
  /** 默认打开第几个 sheet（从 0 开始）。默认 0 */
  defaultSheetIndex?: number;
  /** 最多渲染多少行，超出截断并提示。默认 200 */
  maxRows?: number;
  /** 最多渲染多少列。默认 50 */
  maxCols?: number;
}

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

/** 模块级常量，引用稳定 */
const loadXlsx = () => import("xlsx");

type XlsxState =
  | { status: "loading" }
  | { status: "ready"; workbook: WorkBookLike; truncated: boolean }
  | { status: "error"; error: string };

function XlsxBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: Required<XlsxPreviewPluginConfig>;
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

    return { html, truncated, rows: 0, cols: 0 };
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
function SheetTabs({ context }: { context: FilePreviewPluginContext }) {
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

export function createXlsxPreviewPlugin(
  config: XlsxPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<XlsxPreviewPluginConfig> = {
    defaultSheetIndex: config.defaultSheetIndex ?? 0,
    maxRows: config.maxRows ?? 200,
    maxCols: config.maxCols ?? 50,
  };

  return {
    name: "XlsxPreviewPlugin",
    version: "1.0.0",
    description: "XLSX 离线解析 + 多 Sheet 切换",
    supportedTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    supportedExtensions: [".xlsx", ".xlsm", ".xls"],
    priority: 8,
    config: resolved,

    hooks: {
      render: (context) => <XlsxBody context={context} config={resolved} />,

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="XLSX"
            icon="📊"
          />
          <ToolbarSeparator />
          <SheetTabs context={context} />
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

export default createXlsxPreviewPlugin;
