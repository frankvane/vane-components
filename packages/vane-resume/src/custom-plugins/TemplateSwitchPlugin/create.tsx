import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export interface TemplateDef {
  id: string;
  label: string;
  vars: Record<string, string>;
}
export interface TemplateSwitchConfig {
  templates?: TemplateDef[];
  defaultId?: string;
}

const DEFAULTS: TemplateDef[] = [
  { id: "classic", label: "经典", vars: { "--vr-accent": "#2f6feb", "--vr-pad": "16px", "--vr-radius": "6px", "--vr-h2": "15px", "--vr-font": "system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif" } },
  { id: "modern", label: "现代", vars: { "--vr-accent": "#7c3aed", "--vr-pad": "22px", "--vr-radius": "14px", "--vr-h2": "18px" } },
  { id: "compact", label: "紧凑", vars: { "--vr-accent": "#0ea5a4", "--vr-pad": "10px", "--vr-radius": "4px", "--vr-h2": "14px" } },
  { id: "academic", label: "学术", vars: { "--vr-accent": "#1f6f54", "--vr-pad": "18px", "--vr-radius": "2px", "--vr-h2": "16px", "--vr-font": "Georgia, 'Times New Roman', serif" } },
];

export const createTemplateSwitchPlugin: ResumePluginCreator<TemplateSwitchConfig> = (config = {}) => {
  const templates = config.templates ?? DEFAULTS;
  const defaultId = config.defaultId ?? templates[0]?.id;
  const findTpl = (id?: unknown) => templates.find((t) => t.id === id) ?? templates[0];

  return {
    name: "template-switch",
    version: "0.1.0",
    description: doc.description,
    priority: 12,
    config: { order: 12 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (ctx.state.template === undefined) {
          const t = findTpl(defaultId);
          ctx.setState({ template: t.id, templateVars: t.vars });
        }
      },
      renderToolbar: (ctx: ResumePluginContext<ResumeData>) => {
        const active = (ctx.state.template as string) ?? defaultId;
        return (
          <div
            key="template-switch"
            style={{ display: "flex", gap: 4, alignItems: "center" }}
          >
            <span style={{ fontSize: 12, color: "var(--vr-faint, #8a9099)" }}>模板</span>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  ctx.setState({ template: t.id, templateVars: t.vars });
                  ctx.bus.emit("resume:template-change", t.id);
                }}
                style={toolbarBtn(active === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        );
      },
    },
  };
};

createTemplateSwitchPlugin.meta = doc as PluginDoc;
