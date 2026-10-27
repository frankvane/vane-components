/**
 * CSV 表格本体 —— 只负责画，不碰数据来源。
 *
 * 排序按**列下标**而不是表头文字：迁移前 `sortColumn` 存的是表头字符串，
 * 一旦表头有重复（`名称, 名称`）或为空（表头末尾多一个逗号），
 * `headers.indexOf(name)` 永远指向第一列 —— 点第二列排序，动的却是第一列。
 */

import React from "react";

export interface CsvTableProps {
  headers: string[];
  rows: string[][];
  /** 当前排序列下标，`null` 表示不排序 */
  sortColumn: number | null;
  sortDirection: "asc" | "desc";
  /** 列下标 → 用户拖出来的最小宽度 */
  columnWidths: Record<number, number>;
  onSort: (index: number) => void;
  onResize: (index: number, width: number) => void;
}

const MIN_COLUMN_WIDTH = 64;

export function CsvTable({
  headers,
  rows,
  sortColumn,
  sortDirection,
  columnWidths,
  onSort,
  onResize,
}: CsvTableProps) {
  const startResize = (
    event: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = columnWidths[index] ?? 100;

    const onMove = (e: MouseEvent) => {
      // 不让用户把列拖成负宽 / 0 宽
      const next = Math.max(MIN_COLUMN_WIDTH, startWidth + e.clientX - startX);
      onResize(index, next);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <table
      data-vfp-csv-table
      style={{
        borderCollapse: "collapse",
        fontSize: 13,
        fontVariantNumeric: "tabular-nums",
        minWidth: "100%",
      }}
    >
      <thead>
        <tr>
          <th
            style={{
              ...headCellStyle,
              width: 44,
              minWidth: 44,
              textAlign: "right",
              color: "#9ca3af",
              cursor: "default",
            }}
          >
            #
          </th>
          {headers.map((header, index) => {
            const active = sortColumn === index;
            return (
              <th
                key={index}
                onClick={() => onSort(index)}
                title="点击排序"
                style={{
                  ...headCellStyle,
                  minWidth: columnWidths[index] ?? 100,
                  background: active ? "#e0f2fe" : "#f9fafb",
                  position: "relative",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      maxWidth: 320,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {header || `列 ${index + 1}`}
                  </span>
                  {active && (
                    <span style={{ fontSize: 10, color: "#0369a1" }}>
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </span>
                <div
                  data-vfp-csv-resize
                  onMouseDown={(e) => startResize(e, index)}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 5,
                    cursor: "col-resize",
                    background: "transparent",
                  }}
                />
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td
              style={{
                ...bodyCellStyle,
                textAlign: "right",
                color: "#c0c4cc",
                fontSize: 11,
              }}
            >
              {rowIndex + 1}
            </td>
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                title={cell}
                style={{
                  ...bodyCellStyle,
                  minWidth: columnWidths[cellIndex] ?? 100,
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const headCellStyle: React.CSSProperties = {
  padding: "7px 10px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 12,
  color: "#374151",
  borderBottom: "2px solid #e5e7eb",
  borderRight: "1px solid #f1f5f9",
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const bodyCellStyle: React.CSSProperties = {
  padding: "5px 10px",
  borderRight: "1px solid #f8fafc",
  maxWidth: 320,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "#1f2329",
};
