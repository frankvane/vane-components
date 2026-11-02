import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, 
  ResumeData,
  SectionKey,
} from "../../components/ResumePlugin/plugins/types";
import { DEFAULT_SECTION_ORDER } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import { Overlay } from "../../components/ResumePlugin/plugins/overlay";
import doc from "./doc.json";

export interface SectionReorderConfig {
  sections?: SectionKey[];
}

const LABELS: Record<SectionKey, string> = {
  basics: "基本信息",
  work: "工作经历",
  education: "教育背景",
  skills: "专业技能",
  projects: "项目经历",
  extra: "荣誉/语言/证书",
  attachments: "附件",
};

export const createSectionReorderPlugin: ResumePluginCreator<SectionReorderConfig> = (config = {}) => {
  const sections = config.sections ?? DEFAULT_SECTION_ORDER;
  return {
    name: "section-reorder",
    version: "0.1.0",
    description: doc.description,
    priority: 24,
    config: { order: 24 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (!ctx.state.sectionOrder) ctx.setState({ sectionOrder: [...sections], reorderMode: false });
      },
      renderToolbar: (ctx) => (
        <button
          key="section-reorder"
          type="button"
          onClick={() => ctx.setState({ reorderMode: !ctx.state.reorderMode })}
          style={toolbarBtn(!!ctx.state.reorderMode)}
        >
          重排板块
        </button>
      ),
      renderOverlay: (ctx) => {
        if (!ctx.state.reorderMode) return null;
        const order = (ctx.state.sectionOrder as SectionKey[]) ?? [...sections];
        const move = (idx: number, dir: -1 | 1) => {
          const j = idx + dir;
          if (j < 0 || j >= order.length) return;
          const next = [...order];
          [next[idx], next[j]] = [next[j], next[idx]];
          ctx.setState({ sectionOrder: next });
        };
        const close = () => ctx.setState({ reorderMode: false });
        return (
          <Overlay key="reorder-panel" title="上移 / 下移排序板块" onClose={close} width={320} zIndex={57}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {order.map((k, i) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, border: "1px solid #eee", borderRadius: 6, padding: "4px 8px" }}>
                  <span style={{ flex: 1 }}>{i + 1}. {LABELS[k]}</span>
                  <button type="button" aria-label={`上移 ${LABELS[k]}`} onClick={() => move(i, -1)} style={toolbarBtn(false)}>↑</button>
                  <button type="button" aria-label={`下移 ${LABELS[k]}`} onClick={() => move(i, 1)} style={toolbarBtn(false)}>↓</button>
                </div>
              ))}
            </div>
          </Overlay>
        );
      },
    },
  };
};

createSectionReorderPlugin.meta = doc as PluginDoc;
