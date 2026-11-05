/**
 * `CsvPreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import { useEffect, useMemo, useState } from "react";

import { triggerDownload } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import { useDynamicModule, defaultOf } from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import { useSharedValue } from "../../components/FilePreviewPlugin/shared/useSharedValue";
import type {
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";
import { CsvTable } from "./CsvTable";
import {
  CSV_DELIMITER_KEY,
  CSV_PAGE_KEY,
  CSV_SEARCH_KEY,
} from "./CsvToolbar";
import {
  decodeText,
  parseCsv,
  toCsvText,
  type PapaLike,
  type ParsedCsv,
} from "./parse";
import type { CsvPreviewPluginConfig } from "./create";

type ResolvedConfig = Required<CsvPreviewPluginConfig>;

/** 模块级常量：引用稳定，effect 只跑一次 */
const loadPapa = () => import("papaparse");

type RawState =
  | { status: "loading" }
  | { status: "ready"; text: string; encoding: string }
  | { status: "error"; error: string };

interface SortState {
  column: number | null;
  direction: "asc" | "desc";
}

// ============ 正文 ============

export function CsvBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const papa = useDynamicModule(loadPapa);
  const [raw, setRaw] = useState<RawState>({ status: "loading" });
  const [search] = useSharedValue(context, CSV_SEARCH_KEY, "");
  const [delimiter] = useSharedValue(context, CSV_DELIMITER_KEY, "");
  const [page, setPage] = useSharedValue(context, CSV_PAGE_KEY, 1);
  const [sort, setSort] = useState<SortState>({ column: null, direction: "asc" });
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});

  useEffect(() => {
    let alive = true;
    setRaw({ status: "loading" });

    (async () => {
      try {
        const size = context.file.size;
        if (config.maxFileSize > 0 && size > config.maxFileSize) {
          throw new Error(
            `文件 ${(size / 1024 / 1024).toFixed(1)}MB，超过表格解析上限 ${(
              config.maxFileSize /
              1024 /
              1024
            ).toFixed(1)}MB`
          );
        }

        const res = await fetch(context.file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        // 读 arrayBuffer 而不是 text：只有字节才能判断编码
        const buf = await res.arrayBuffer();
        const decoded = decodeText(buf);
        if (!alive) return;
        setRaw({ status: "ready", ...decoded });
      } catch (err) {
        if (!alive) return;
        setRaw({
          status: "error",
          error: err instanceof Error ? err.message : "文件读取失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
    // 只跟文件标识与阈值走（context 每次渲染都是新对象）
  }, [context.file.url, context.file.size, config.maxFileSize]);

  const parsed: ParsedCsv | null = useMemo(() => {
    if (papa.status !== "ready" || raw.status !== "ready") return null;
    const Papa = defaultOf<PapaLike>(papa.mod);
    return parseCsv(Papa, raw.text, {
      delimiter: delimiter || undefined,
      maxRows: config.maxPreviewRows,
    });
  }, [papa, raw, delimiter, config.maxPreviewRows]);

  // 过滤 → 排序。两者都只依赖 parsed / search / sort，翻页时不会重算。
  const visible = useMemo(() => {
    if (!parsed) return null;
    const needle = search.trim().toLowerCase();

    let rows = parsed.rows;
    if (needle) {
      rows = rows.filter((row) =>
        row.some((cell) => cell.toLowerCase().includes(needle))
      );
    }

    if (sort.column !== null) {
      const column = sort.column;
      const factor = sort.direction === "asc" ? 1 : -1;
      rows = [...rows].sort(
        (a, b) =>
          // numeric: true —— 否则 "10" 排在 "9" 前面
          factor * a[column].localeCompare(b[column], undefined, { numeric: true })
      );
    }

    return { ...parsed, rows };
  }, [parsed, search, sort]);

  const totalPages = visible
    ? Math.max(1, Math.ceil(visible.rows.length / config.pageSize))
    : 1;

  // 过滤后页数变少时把页码拉回来（否则停在一个不存在的页上，表格空白）
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  const currentPage = Math.min(page, totalPages);
  const pageRows = visible
    ? visible.rows.slice(
        (currentPage - 1) * config.pageSize,
        currentPage * config.pageSize
      )
    : [];

  const handleSort = (column: number) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" }
    );
  };

  const handleResize = (column: number, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [column]: width }));
  };

  const handleExport = () => {
    if (!visible) return;
    const csv = toCsvText(visible.headers, visible.rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, context.file.name.replace(/\.[^/.]+$/, "") + ".csv");
    // Safari 需要延迟 revoke，否则下载可能被取消
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  if (papa.status === "unavailable") {
    return (
      <MissingDependency
        pkg="papaparse"
        feature="解析 CSV 需要 papaparse（引号内换行、转义这些规则手写容易错）"
        error={papa.error.message}
      />
    );
  }

  if (papa.status === "loading" || raw.status === "loading") {
    return <LoadingPanel icon="📊" label="正在解析表格…" />;
  }

  if (raw.status === "error") {
    return <ErrorPanel label="文件读取失败" error={raw.error} />;
  }

  if (!parsed || !visible) return null;

  if (parsed.totalRows === 0) {
    return (
      <ErrorPanel
        label="表格是空的"
        error="文件里只有表头或什么都没有。换分隔符试试，或者下载下来看原文。"
        icon="📊"
      />
    );
  }

  return (
    <div
      data-vfp-csv
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <CsvTable
          headers={visible.headers}
          rows={pageRows}
          sortColumn={sort.column}
          sortDirection={sort.direction}
          columnWidths={columnWidths}
          onSort={handleSort}
          onResize={handleResize}
        />
      </div>

      <div
        data-vfp-csv-footer
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          padding: "6px 12px",
          borderTop: "1px solid #e5e7eb",
          background: "#fafafa",
          fontSize: 12,
          color: "#6b7280",
          flexShrink: 0,
        }}
      >
        <span data-vfp-csv-count>
          共 {visible.rows.length} 行
          {search.trim() ? `（原始 ${parsed.totalRows} 行，已过滤）` : ""}
          {parsed.truncated ? `，仅解析前 ${config.maxPreviewRows} 行` : ""}
          · {visible.headers.length} 列 · {raw.encoding.toUpperCase()} · 分隔符{" "}
          {parsed.delimiter === "\t" ? "Tab" : parsed.delimiter}
        </span>

        {parsed.warnings.length > 0 && (
          <span style={{ color: "#b45309" }} title={parsed.warnings.join("\n")}>
            ⚠ {parsed.warnings[0]}
          </span>
        )}

        <span style={{ marginLeft: "auto" }}>
          {visible.rows.length > 0
            ? `${(currentPage - 1) * config.pageSize + 1}–${Math.min(
                currentPage * config.pageSize,
                visible.rows.length
              )}`
            : "0"}
        </span>

        {totalPages > 1 && (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <PagerButton
              disabled={currentPage === 1}
              onClick={() => setPage(1)}
              label="«"
            />
            <PagerButton
              disabled={currentPage === 1}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              label="‹"
            />
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {currentPage} / {totalPages}
            </span>
            <PagerButton
              disabled={currentPage === totalPages}
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              label="›"
            />
            <PagerButton
              disabled={currentPage === totalPages}
              onClick={() => setPage(totalPages)}
              label="»"
            />
          </span>
        )}

        {config.enableExport && (
          <button
            type="button"
            data-vfp-csv-export
            onClick={handleExport}
            style={{
              padding: "3px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              background: "#fff",
              fontSize: 12,
              cursor: "pointer",
              color: "#374151",
            }}
          >
            导出当前结果
          </button>
        )}
      </div>
    </div>
  );
}

function PagerButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "1px 7px",
        border: "1px solid #d1d5db",
        borderRadius: 3,
        background: "#fff",
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        /* 禁用态走 1.4.3 豁免（门槛 3:1）。.45 会把 #374151 压到 2.34:1，.6 是 3.55 */
        opacity: disabled ? 0.6 : 1,
        color: "#374151",
      }}
    >
      {label}
    </button>
  );
}
