import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import doc from "./doc.json";

export type StatKey = "expYears" | "skillCount" | "projectCount" | "eduLevel";
export interface StatSummaryConfig {
  /** 展示指标；缺省四项全开 */
  items?: StatKey[];
}

const EDU_RANK: Record<string, number> = {
  博士: 5,
  硕士: 4,
  研究生: 4,
  本科: 3,
  学士: 3,
  大专: 2,
  专科: 2,
  高中: 1,
};

function computeStats(d: ResumeData) {
  const exp = (d.work ?? []).length;
  const skills = (d.skills ?? []).reduce((s, g) => s + (g.items?.length ?? 0), 0);
  const projects = (d.projects ?? []).length;
  let edu = "—";
  let best = 0;
  (d.education ?? []).forEach((e) => {
    const r = EDU_RANK[e.degree] ?? 0;
    if (r > best) {
      best = r;
      edu = e.degree;
    }
  });
  return { exp, skills, projects, edu };
}

/**
 * StatSummary —— 简历数据概览徽章（装饰累积槽 renderBasics）。
 * 在基本信息区追加：工作段数 / 技能数 / 项目数 / 最高学历。纯渲染，不改数据。
 */
export const createStatSummaryPlugin: ResumePluginCreator<StatSummaryConfig> = (config = {}) => {
  const keys = config.items ?? ["expYears", "skillCount", "projectCount", "eduLevel"];
  const LABEL: Record<StatKey, string> = {
    expYears: "工作",
    skillCount: "技能",
    projectCount: "项目",
    eduLevel: "最高学历",
  };
  return {
    name: "stat-summary",
    version: "0.1.0",
    description: doc.description,
    priority: 32,
    config: { order: 32 },
    hooks: {
      renderBasics: (ctx: ResumePluginContext<ResumeData>) => {
        const s = computeStats(ctx.data as ResumeData);
        const valueOf = (k: StatKey): string => {
          switch (k) {
            case "expYears":
              return `${s.exp} 段`;
            case "skillCount":
              return `${s.skills} 项`;
            case "projectCount":
              return `${s.projects} 个`;
            case "eduLevel":
              return s.edu;
            default:
              return "";
          }
        };
        return (
          <div
            key="stat-summary"
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}
          >
            {keys.map((k) => (
              <div
                key={k}
                style={{
                  background: "var(--vr-accent-wash, #eef3fe)",
                  border: "1px solid var(--vr-line, #e3e6ea)",
                  borderRadius: 8,
                  padding: "4px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--vr-accent, #2f6feb)" }}>
                  {valueOf(k)}
                </div>
                <div style={{ fontSize: 11, color: "var(--vr-muted, #5d636a)" }}>{LABEL[k]}</div>
              </div>
            ))}
          </div>
        );
      },
    },
  };
};

createStatSummaryPlugin.meta = doc as PluginDoc;
