import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { Overlay } from "../../components/ResumePlugin/plugins/overlay";
import doc from "./doc.json";

export interface AtsRule {
  key: string;
  label: string;
  weight: number;
  test: (d: ResumeData, jobKeywords: string[]) => boolean;
}
export interface AtsReportItem {
  label: string;
  ok: boolean;
  weight: number;
}
export interface AtsReport {
  score: number;
  items: AtsReportItem[];
}
export interface AtsScoreConfig {
  /** JD 关键词，命中加分 */
  jobKeywords?: string[];
  /** 可扩展评分规则（合并内置规则） */
  rules?: AtsRule[];
}

const DEFAULT_RULES: AtsRule[] = [
  { key: "name", label: "含姓名", weight: 10, test: (d) => !!d.basics?.name },
  { key: "contact", label: "含联系方式", weight: 10, test: (d) => (d.basics?.contacts?.length ?? 0) > 0 },
  { key: "work", label: "有工作经历", weight: 15, test: (d) => (d.work?.length ?? 0) > 0 },
  {
    key: "metric",
    label: "工作量化亮点",
    weight: 15,
    test: (d) => (d.work ?? []).some((w) => (w.highlights ?? []).some((h) => /\d/.test(h))),
  },
  { key: "edu", label: "有教育背景", weight: 10, test: (d) => (d.education?.length ?? 0) > 0 },
  {
    key: "skill",
    label: "有技能标签",
    weight: 10,
    test: (d) => (d.skills ?? []).some((g) => (g.items?.length ?? 0) > 0),
  },
  {
    key: "jd",
    label: "命中 JD 关键词",
    weight: 20,
    test: (d, kws) =>
      kws.length > 0 &&
      collectText(d).some((t) => kws.some((k) => t.toLowerCase().includes(k.toLowerCase()))),
  },
  {
    key: "length",
    label: "篇幅适中",
    weight: 10,
    test: (d) => {
      const n =
        (d.work ?? []).reduce((s, w) => s + (w.highlights?.length ?? 0), 0) +
        (d.projects ?? []).length;
      return n <= 40;
    },
  },
];

function collectText(d: ResumeData): string[] {
  const out: string[] = [];
  const b = d.basics;
  if (b) {
    out.push(b.name, b.title, b.summary ?? "");
    (b.contacts ?? []).forEach((c) => out.push(c.value));
  }
  (d.work ?? []).forEach((w) => {
    out.push(w.company, w.role, ...(w.highlights ?? []));
  });
  (d.education ?? []).forEach((e) => out.push(e.school, e.degree, e.major ?? ""));
  (d.skills ?? []).forEach((g) => out.push(g.category, ...(g.items ?? [])));
  (d.projects ?? []).forEach((p) => out.push(p.name, p.desc, p.role ?? ""));
  return out.filter(Boolean);
}

function computeAts(d: ResumeData, jobKeywords: string[]): AtsReport {
  const items: AtsReportItem[] = DEFAULT_RULES.map((r) => ({
    label: r.label,
    weight: r.weight,
    ok: r.test(d, jobKeywords),
  }));
  const score = items.reduce((s, it) => s + (it.ok ? it.weight : 0), 0);
  return { score, items };
}

/**
 * AtsScore —— ATS 兼容性评分（纯分析，不改数据）。
 * transformData（依赖 privacy-mask，确保跑在数据管道末位）把报告写进 ctx.shared["ats:report"]；
 * renderFooter 显示评分徽章；renderOverlay 展开逐条建议。
 */
export const createAtsScorePlugin: ResumePluginCreator<AtsScoreConfig> = (config = {}) => {
  const jobKeywords = config.jobKeywords ?? [];
  const getReport = (ctx: ResumePluginContext<ResumeData>): AtsReport =>
    (ctx.shared.get("ats:report") as AtsReport | undefined) ??
    computeAts(ctx.data as ResumeData, jobKeywords);

  return {
    name: "ats-score",
    version: "0.1.0",
    description: doc.description,
    priority: 38,
    config: { order: 38 },
    dependencies: ["privacy-mask"],
    hooks: {
      transformData: (ctx, data) => {
        ctx.shared.set("ats:report", computeAts(data as ResumeData, jobKeywords));
        return data;
      },
      renderFooter: (ctx) => {
        const report = getReport(ctx);
        const tone = report.score >= 80 ? "#1f9d55" : report.score >= 60 ? "#e8590c" : "#cf4407";
        const open = !!ctx.state.atsOpen;
        return (
          <button
            key="ats-score"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => ctx.setState({ atsOpen: !open })}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              cursor: "pointer",
              color: "var(--vr-muted, #5d636a)",
              background: "transparent",
              border: "none",
              padding: 0,
              font: "inherit",
            }}
          >
            <span>ATS</span>
            <span style={{ fontWeight: 700, color: tone }}>{report.score}</span>
          </button>
        );
      },
      renderOverlay: (ctx) => {
        if (!ctx.state.atsOpen) return null;
        const report = getReport(ctx);
        const close = () => ctx.setState({ atsOpen: false });
        return (
          <Overlay
            key="ats-overlay"
            title={`ATS 兼容性评分 ${report.score}`}
            onClose={close}
            width={380}
            zIndex={59}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {report.items.map((it) => (
                  <div key={it.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: it.ok ? "#1f9d55" : "#cf4407" }}>
                        {it.ok ? "✓" : "✗"} {it.label}
                      </span>
                      <span style={{ color: "#8a9099" }}>{it.weight} 分</span>
                    </div>
                    <div style={{ height: 6, background: "#f2f3f5", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${it.ok ? 100 : 0}%`,
                          height: "100%",
                          background: it.ok ? "#1f9d55" : "#cf4407",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </Overlay>
        );
      },
    },
  };
};

createAtsScorePlugin.meta = doc as PluginDoc;
