import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, 
  ResumeData,
  WorkItem,
  EduItem,
} from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn, highlightText } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export interface TimelineViewConfig {
  sections?: ("work" | "education")[];
  mode?: "list" | "timeline";
}

function Timeline({ items, kind, kw }: { items: (WorkItem | EduItem)[]; kind: "work" | "edu"; kw: string[] }) {
  if (!items.length) return null;
  return (
    <div style={{ position: "relative", paddingLeft: 20 }}>
      <div style={{ position: "absolute", left: 5, top: 4, bottom: 4, width: 2, background: "var(--vr-line, #e3e6ea)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((it, i) => (
          <div key={(it as WorkItem).id ?? i} style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: -19,
                top: 4,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--vr-accent, #2f6feb)",
                boxShadow: "0 0 0 3px #fff",
              }}
            />
            <div style={{ fontWeight: 700, color: "var(--vr-text, #1f2328)" }}>
              {kind === "work"
                ? highlightText((it as WorkItem).company, kw)
                : highlightText((it as EduItem).school, kw)}
            </div>
            <div style={{ color: "var(--vr-muted, #5d636a)", fontSize: 13 }}>
              {kind === "work"
                ? <>
                    {(it as WorkItem).role ? <>{highlightText((it as WorkItem).role as string, kw)} </> : null}
                    {`${(it as WorkItem).start} — ${(it as WorkItem).end}`}
                  </>
                : <>
                    {highlightText((it as EduItem).degree, kw)}
                    {(it as EduItem).major ? <> · {highlightText((it as EduItem).major as string, kw)}</> : null}
                    {` ${(it as EduItem).start} — ${(it as EduItem).end}`}
                  </>}
            </div>
            {kind === "work" && (it as WorkItem).highlights?.length > 0 && (
              <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: "var(--vr-muted, #5d636a)" }}>
                {(it as WorkItem).highlights.map((h, j) => (
                  <li key={j}>{highlightText(h, kw)}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const createTimelineViewPlugin: ResumePluginCreator<TimelineViewConfig> = (config = {}) => {
  const sections = config.sections ?? ["work", "education"];
  const defaultMode = config.mode ?? "list";
  return {
    name: "timeline-view",
    version: "0.1.0",
    description: doc.description,
    priority: 22,
    config: { order: 22 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (ctx.state.timelineMode === undefined) ctx.setState({ timelineMode: defaultMode });
      },
      renderToolbar: (ctx) => {
        const mode = (ctx.state.timelineMode as string) ?? defaultMode;
        const on = mode === "timeline";
        return (
          <button
            key="timeline-view"
            type="button"
            onClick={() => ctx.setState({ timelineMode: on ? "list" : "timeline" })}
            style={toolbarBtn(on)}
          >
            时间轴
          </button>
        );
      },
      // 内容覆盖槽：timeline 模式下返回时间轴，否则返回 null 交核心默认列表
      renderWork: (ctx) => {
        if ((ctx.state.timelineMode as string) !== "timeline" || !sections.includes("work")) return null;
        const kw = (ctx.state.highlightKeywords as string[] | undefined) ?? [];
        return <Timeline items={(ctx.data as ResumeData)?.work ?? []} kind="work" kw={kw} />;
      },
      renderEducation: (ctx) => {
        if ((ctx.state.timelineMode as string) !== "timeline" || !sections.includes("education")) return null;
        const kw = (ctx.state.highlightKeywords as string[] | undefined) ?? [];
        return <Timeline items={(ctx.data as ResumeData)?.education ?? []} kind="edu" kw={kw} />;
      },
    },
  };
};

createTimelineViewPlugin.meta = doc as PluginDoc;
