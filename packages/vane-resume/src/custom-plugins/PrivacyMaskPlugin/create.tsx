import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn, cloneData } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export interface PrivacyMaskConfig {
  /** blur=整页毛玻璃视觉遮罩；hide=仅字段级隐藏 */
  mode?: "blur" | "hide";
  /** 隐私模式下隐藏的字段（两种 mode 都会做数据级隐藏） */
  fields?: string[];
}

export const createPrivacyMaskPlugin: ResumePluginCreator<PrivacyMaskConfig> = (config = {}) => {
  const mode = config.mode ?? "blur";
  const fields = config.fields ?? ["summary", "contacts"];

  return {
    name: "privacy-mask",
    version: "0.1.0",
    description: doc.description,
    priority: 42,
    config: { order: 42 },
    // 依赖 contact-desensitize：字段隐藏放在脱敏之后
    dependencies: ["contact-desensitize"],
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (ctx.state.privacyOn === undefined) ctx.setState({ privacyOn: false });
      },
      renderToolbar: (ctx) => {
        const on = !!ctx.state.privacyOn;
        return (
          <button
            key="privacy-mask"
            type="button"
            onClick={() => ctx.setState({ privacyOn: !on })}
            style={toolbarBtn(on)}
          >
            {on ? "隐私：开" : "隐私：关"}
          </button>
        );
      },
      // priority 46：字段隐藏放在脱敏之后，避免脱敏文本被再次处理。
      // blur 模式同样做数据级隐藏：毛玻璃只是视觉层，DOM 明文仍可被复制 / 导出，
      // 因此敏感字段必须在数据层移除，不能只依赖 backdropFilter。
      transformData: (ctx, data) => {
        if (!ctx.state.privacyOn) return data;
        const d = cloneData(data as ResumeData);
        if (fields.includes("summary") && d.basics) d.basics.summary = "*** 已隐藏 ***";
        if (fields.includes("contacts") && d.basics) d.basics.contacts = [];
        return d;
      },
      renderOverlay: (ctx) => {
        if (!ctx.state.privacyOn || mode !== "blur") return null;
        return (
          <div
            key="privacy-mask-overlay"
            data-vr-privacy-mask=""
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              background: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              隐私模式 · 内容已遮挡（敏感字段已隐藏）
            </span>
          </div>
        );
      },
    },
  };
};

createPrivacyMaskPlugin.meta = doc as PluginDoc;
