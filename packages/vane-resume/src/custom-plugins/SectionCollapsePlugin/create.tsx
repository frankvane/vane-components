import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, 
  ResumeCoreProps,
  ResumeData,
  SectionKey,
} from "../../components/ResumePlugin/plugins/types";
import { DEFAULT_SECTION_ORDER } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export interface SectionCollapseConfig {
  /** 初始是否开启折叠模式 */
  defaultOn?: boolean;
  /** 初始折叠的板块 */
  defaultCollapsed?: SectionKey[];
}

/**
 * SectionCollapse —— 板块折叠展开（纯 state 驱动）。
 * 仅维护 ctx.state.collapseMode / collapsed；核心板块头部直接读取这两个 state
 * 渲染折叠按钮与收起正文。与 KeywordHighlight / TimelineView 不抢槽，可并存。
 */
export const createSectionCollapsePlugin: ResumePluginCreator<SectionCollapseConfig> = (config = {}) => {
  return {
    name: "section-collapse",
    version: "0.1.0",
    description: doc.description,
    priority: 26,
    config: { order: 26 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (ctx.state.collapseMode === undefined) {
          ctx.setState({
            collapseMode: config.defaultOn ?? false,
            collapsed: config.defaultCollapsed ?? [],
          });
        }
      },
      renderToolbar: (ctx) => {
        const on = !!ctx.state.collapseMode;
        const toggleAll = (val: boolean) => {
          const order =
            (ctx.state.sectionOrder as SectionKey[] | undefined) ?? DEFAULT_SECTION_ORDER;
          ctx.setState({ collapsed: val ? [...order] : [] });
        };
        return (
          <div key="section-collapse" style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => ctx.setState({ collapseMode: !on })}
              style={toolbarBtn(on)}
            >
              {on ? "折叠：开" : "折叠：关"}
            </button>
            {on && (
              <>
                <button type="button" onClick={() => toggleAll(true)} style={toolbarBtn(false)}>
                  全收
                </button>
                <button type="button" onClick={() => toggleAll(false)} style={toolbarBtn(false)}>
                  全展
                </button>
              </>
            )}
          </div>
        );
      },
    },
  };
};

createSectionCollapsePlugin.meta = doc as PluginDoc;
