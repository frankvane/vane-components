import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export interface ThemePreset {
  id: string;
  label: string;
  vars: Record<string, string>;
}
export interface ThemeCustomizeConfig {
  presets?: ThemePreset[];
  default?: string;
}

const PRESETS: ThemePreset[] = [
  { id: "blue", label: "蓝", vars: { "--vr-accent": "#2f6feb" } },
  { id: "orange", label: "橙", vars: { "--vr-accent": "#e8590c" } },
  { id: "green", label: "绿", vars: { "--vr-accent": "#1f9d55" } },
  { id: "mono", label: "墨", vars: { "--vr-accent": "#1f2328" } },
];

const apply = (ctx: ResumePluginContext<ResumeData>, vars: Record<string, string>) => {
  ctx.setState({ themeVars: vars, theme: vars["--vr-accent"] ?? ctx.state.theme });
};

export const createThemeCustomizePlugin: ResumePluginCreator<ThemeCustomizeConfig> = (config = {}) => {
  const presets = config.presets ?? PRESETS;
  return {
    name: "theme-customize",
    version: "0.1.0",
    description: doc.description,
    priority: 18,
    config: { order: 18 },
    hooks: {
      onMount: (ctx) => {
        if (ctx.state.theme === undefined && presets[0]) apply(ctx, presets[0].vars);
      },
      renderToolbar: (ctx) => (
        <div
          key="theme-customize"
          style={{ display: "flex", gap: 4, alignItems: "center" }}
        >
          <span style={{ fontSize: 12, color: "var(--vr-faint, #8a9099)" }}>主题</span>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => apply(ctx, p.vars)}
              style={toolbarBtn(ctx.state.theme === p.vars["--vr-accent"])}
            >
              {p.label}
            </button>
          ))}
          <input
            type="color"
            defaultValue={String(ctx.state.theme ?? "#2f6feb")}
            onChange={(e) => apply(ctx, { "--vr-accent": e.target.value })}
            style={{ width: 28, height: 24, border: "none", background: "none", cursor: "pointer" }}
            aria-label="自定义强调色"
          />
        </div>
      ),
    },
  };
};

createThemeCustomizePlugin.meta = doc as PluginDoc;
