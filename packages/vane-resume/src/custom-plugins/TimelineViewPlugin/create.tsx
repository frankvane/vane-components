import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, 
  ResumeData,
} from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";
import { Timeline } from "./internal";

export interface TimelineViewConfig {
  sections?: ("work" | "education")[];
  mode?: "list" | "timeline";
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
