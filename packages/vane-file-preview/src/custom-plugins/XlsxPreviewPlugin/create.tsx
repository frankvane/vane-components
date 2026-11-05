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

import {
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { SheetTabs, XlsxBody } from "./internal";

export interface XlsxPreviewPluginConfig {
  /** 默认打开第几个 sheet（从 0 开始）。默认 0 */
  defaultSheetIndex?: number;
  /** 最多渲染多少行，超出截断并提示。默认 200 */
  maxRows?: number;
  /** 最多渲染多少列。默认 50 */
  maxCols?: number;
  /**
   * 超过这个字节数直接拒绝解析。默认 20MB。
   * SheetJS 是全量内存解析，大文件会把标签页卡死；必须在 fetch 之前拦。
   * 设为 0 表示不限制（不建议）。
   */
  maxFileSize?: number;
}

/** 模块级常量，引用稳定 */
const loadXlsx = () => import("xlsx");

export function createXlsxPreviewPlugin(
  config: XlsxPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<XlsxPreviewPluginConfig> = {
    defaultSheetIndex: config.defaultSheetIndex ?? 0,
    maxRows: config.maxRows ?? 200,
    maxCols: config.maxCols ?? 50,
    maxFileSize: config.maxFileSize ?? 20 * 1024 * 1024,
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
      render: (context) => (
        <XlsxBody context={context} config={resolved} loadXlsx={loadXlsx} />
      ),

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
