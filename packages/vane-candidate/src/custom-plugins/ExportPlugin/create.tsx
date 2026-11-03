import type { PluginDoc } from "vane-plugin-core";
import type {
  Candidate,
  CandidatePluginCreator,
  StageConfig,
} from "../../components/CandidatePlugin/plugins/types";
import { DEFAULT_STAGES } from "../../components/CandidatePlugin/plugins/types";
import { csvCell } from "../../components/CandidatePlugin/domain";
import { toolbarBtn } from "../../components/CandidatePlugin/plugins/tokens";
import doc from "./doc.json";

export interface ExportConfig {
  /** 导出文件名（不含扩展名） */
  filename?: string;
  /** 额外列（header + 取值函数） */
  columns?: Array<{ header: string; get: (c: Candidate) => string | number | undefined }>;
}

const BUILTIN_COLUMNS: Array<{ header: string; get: (c: Candidate) => string | number | undefined }> = [
  { header: "姓名", get: (c) => c.name },
  { header: "岗位", get: (c) => c.role },
  { header: "阶段", get: (c) => c.stage },
  { header: "匹配分", get: (c) => c.score },
  { header: "邮箱", get: (c) => c.email },
  { header: "手机号", get: (c) => c.phone },
  { header: "来源", get: (c) => c.source },
  { header: "投递时间", get: (c) => c.appliedAt },
];

function download(filename: string, content: string) {
  // \ufeff BOM：保证 Excel 打开 UTF-8 CSV 不乱码
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export —— CSV 导出。
 * 工具栏「导出 CSV」按钮：把当前看板数据（经筛选/排序管道之后）按列导出为
 * CSV（带 BOM，公式注入防护）。列可扩展。
 */
export const createExportPlugin: CandidatePluginCreator<ExportConfig> = (
  config = {}
) => {
  const filename = config.filename ?? "candidates";
  return {
    name: "export",
    version: "0.1.0",
    description: doc.description,
    priority: 60,
    config: { order: 60 },
    hooks: {
      renderToolbar: (ctx) => {
        const stages = (ctx.props?.stages ??
          (DEFAULT_STAGES as StageConfig[])) as StageConfig[];
        return (
          <button
            key="export"
            type="button"
            aria-label="导出候选人列表为 CSV"
            onClick={() => {
              const candidates = (ctx.data as Candidate[]) ?? [];
              const columns = [...BUILTIN_COLUMNS, ...(config.columns ?? [])];
              const stageLabel = (key: string) =>
                stages.find((s) => s.key === key)?.label ?? key;
              const rows = [
                columns.map((col) => csvCell(col.header)).join(","),
                ...candidates.map((c) =>
                  columns
                    .map((col) =>
                      // 阶段列以 header 识别（身份比较对 BUILTIN_COLUMNS 的引用
                      // 顺序脆弱），导出人类可读的阶段标签而非原始 key
                      csvCell(col.header === "阶段" ? stageLabel(c.stage) : col.get(c))
                    )
                    .join(",")
                ),
              ];
              download(`${filename}-${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\r\n"));
            }}
            style={toolbarBtn(false)}
          >
            导出 CSV
          </button>
        );
      },
    },
  };
};

createExportPlugin.meta = doc as PluginDoc;
