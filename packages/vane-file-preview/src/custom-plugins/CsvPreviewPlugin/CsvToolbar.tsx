/**
 * CSV 工具栏 —— 搜索、分隔符、下载。
 *
 * 迁移前这些控件画在**正文内部**（组件自己那条 12px 高的 div 里），
 * 而 `renderToolbar` 里又渲染了一份文件信息 + 下载按钮，于是界面上出现两条
 * 长得像工具栏的东西，一条在上一条在表格上方。现在只在真正的工具栏里出现。
 *
 * 状态全部走 `sharedData`（`csv:search` / `csv:delimiter`），正文读同一份 ——
 * 不再需要「正文 → 父组件 → 工具栏」的回调透传。
 */

import React from "react";

import { triggerDownload } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import { useSharedValue } from "../../components/FilePreviewPlugin/shared/useSharedValue";
import type { FilePreviewPluginContext } from "../../components/FilePreviewPlugin/plugins/types";

/** 空字符串表示「让解析器自动判断」 */
export const DELIMITER_AUTO = "";

const DELIMITER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: DELIMITER_AUTO, label: "自动" },
  { value: ",", label: "逗号 ," },
  { value: ";", label: "分号 ;" },
  { value: "\t", label: "制表符 ⇥" },
  { value: "|", label: "竖线 |" },
];

export const CSV_SEARCH_KEY = "csv:search";
export const CSV_DELIMITER_KEY = "csv:delimiter";
export const CSV_PAGE_KEY = "csv:page";

export function CsvToolbar({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: { enableSearch: boolean };
}) {
  const [search, setSearch] = useSharedValue(context, CSV_SEARCH_KEY, "");
  const [delimiter, setDelimiterRaw] = useSharedValue(
    context,
    CSV_DELIMITER_KEY,
    DELIMITER_AUTO
  );
  const [, setPage] = useSharedValue(context, CSV_PAGE_KEY, 1);

  return (
    <ToolbarContainer>
      <FileMeta
        name={context.file.name}
        size={context.file.size}
        type={context.file.extension.replace(/^\./, "").toUpperCase() || "CSV"}
        icon="📊"
      />
      <ToolbarSeparator />

      {config.enableSearch && (
        <input
          data-vfp-csv-search
          type="search"
          value={search}
          placeholder="搜索全部单元格…"
          onChange={(e) => {
            setSearch(e.target.value);
            // 搜索条件变了必须回到第 1 页，否则停在「第 7 页 / 共 1 页」
            setPage(1);
          }}
          style={{
            padding: "4px 8px",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            fontSize: 12,
            width: 180,
          }}
        />
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>分隔符</span>
        <select
          data-vfp-csv-delimiter
          value={delimiter}
          onChange={(e) => {
            setDelimiterRaw(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "3px 6px",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            fontSize: 12,
            background: "#fff",
          }}
        >
          {DELIMITER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <ToolbarButton
        onClick={() => triggerDownload(context.file.url, context.file.name)}
        icon="📥"
        title="下载原始文件"
      >
        下载
      </ToolbarButton>
    </ToolbarContainer>
  );
}
