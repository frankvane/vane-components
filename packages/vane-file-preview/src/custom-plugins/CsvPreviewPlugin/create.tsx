/**
 * `vane-file-preview/custom-plugins/CsvPreviewPlugin`
 *
 * CSV / TSV / TXT 表格预览：分页、搜索、排序、列宽拖拽、导出。
 *
 * ## 拆成四个文件
 *
 * 迁移前是**一个 730 行的组件**，解析、状态、表格、工具栏、样式全在里面：
 *   - `parse.ts`    解码 / 解析 / 序列化（纯函数，可单测）
 *   - `CsvTable.tsx` 表格（只画）
 *   - `CsvToolbar.tsx` 搜索 / 分隔符 / 下载（走 sharedData）
 *   - `index.tsx`   取数据 + 过滤排序分页 + 装配
 *
 * ## 迁移时修掉的问题
 *
 * 1. **自动检测的分隔符没用上**（setState 异步 → 首轮永远按逗号解析）
 *    + `delimiter` 在 effect 依赖里 → 每个文件解析两遍。详见 parse.ts。
 * 2. **「自动检测编码」是假的**：只把 "gbk" 写进 state，从不重新解码。详见 parse.ts。
 * 3. **排序用表头文字定位列**：表头重复或为空时永远排第一列。见 CsvTable.tsx。
 * 4. **排序用默认 `localeCompare`**：字符串比较下 `"10" < "9"`。现在 `numeric: true`。
 * 5. **49 处 `console.log`**（含 `📊 开始解析`、`✅ CSV 解析完成` 之类）全部删除 ——
 *    一个预览组件不该往用户控制台打日志。
 * 6. **`getPriority` 改成声明式 `priority`。**
 */

import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { CsvToolbar } from "./CsvToolbar";
import { CsvBody } from "./internal";

export interface CsvPreviewPluginConfig {
  /** 每页行数。默认 50 */
  pageSize?: number;
  /** 最多解析多少数据行（不含表头）。默认 1000 */
  maxPreviewRows?: number;
  /** 工具栏显示搜索框。默认 true */
  enableSearch?: boolean;
  /** 显示「导出当前结果」按钮。默认 true */
  enableExport?: boolean;
  /**
   * 超过这个字节数直接拒绝解析。默认 20MB。
   * 表格解析会把整个文件读进内存，大文件必须在 fetch 之前拦（P1-4）。
   * 设为 0 表示不限制。
   */
  maxFileSize?: number;
}

type ResolvedConfig = Required<CsvPreviewPluginConfig>;

// ============ 插件 ============

export function createCsvPreviewPlugin(
  config: CsvPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: ResolvedConfig = {
    pageSize: config.pageSize ?? 50,
    maxPreviewRows: config.maxPreviewRows ?? 1000,
    enableSearch: config.enableSearch ?? true,
    enableExport: config.enableExport ?? true,
    maxFileSize: config.maxFileSize ?? 20 * 1024 * 1024,
  };

  return {
    name: "CsvPreviewPlugin",
    version: "2.0.0",
    description: "CSV / TSV 表格预览：分页、搜索、排序、列宽拖拽、导出",
    supportedTypes: [
      "text/csv",
      "application/csv",
      "text/tab-separated-values",
    ],
    // `.txt` 不在这里认领：纯文本该由 CodePreviewPlugin(priority 4) 兜，
    // 迁移前 CSV 用 `.txt` + `text/plain` 抢走了所有纯文本文件，
    // 打开一个 README.txt 却得到一个「表格是空的」面板。
    supportedExtensions: [".csv", ".tsv"],
    // 高于 Code(4)：.csv 两个插件都认（Code 认 text/plain），CSV 该赢
    priority: 8,
    config: resolved,

    hooks: {
      render: (context) => <CsvBody context={context} config={resolved} />,
      renderToolbar: (context) => (
        <CsvToolbar context={context} config={resolved} />
      ),
    },
  };
}

export default createCsvPreviewPlugin;
