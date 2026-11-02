import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export interface SignatureStampConfig {
  /** 签名姓名（缺省取 basics.name） */
  name?: string;
  /** 手写签名图片 URL */
  image?: string;
  /** 签署日期（缺省今天） */
  date?: () => string;
  /** 是否绘制 CSS 圆形印章 */
  stamp?: "none" | "seal";
  /** 印章文字 */
  stampText?: string;
}

/**
 * SignatureStamp —— 电子落款（装饰累积槽 renderFooter + renderOverlay）。
 * footer 渲染签名 + 签署日期；stamp="seal" 时在左下角叠加 CSS 圆形印章（overlay）。
 * 全部经 state.signatureOn 开关，与其他 footer 插件共存。
 */
export const createSignatureStampPlugin: ResumePluginCreator<SignatureStampConfig> = (config = {}) => {
  const name = config.name;
  const image = config.image;
  const stamp = config.stamp ?? "none";
  const stampText = config.stampText ?? "已确认";
  const dateStr = () => (config.date ? config.date() : new Date().toISOString().slice(0, 10));

  return {
    name: "signature-stamp",
    version: "0.1.0",
    description: doc.description,
    priority: 34,
    config: { order: 34 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (ctx.state.signatureOn === undefined) ctx.setState({ signatureOn: true });
      },
      renderToolbar: (ctx) => (
        <button
          key="signature-stamp"
          type="button"
          onClick={() => ctx.setState({ signatureOn: !ctx.state.signatureOn })}
          style={toolbarBtn(!!ctx.state.signatureOn)}
        >
          {ctx.state.signatureOn ? "落款：开" : "落款：关"}
        </button>
      ),
      renderFooter: (ctx) => {
        if (!ctx.state.signatureOn) return null;
        const b = ctx.data?.basics;
        const who = name ?? b?.name ?? "本人";
        const date = dateStr();
        return (
          <span
            key="signature"
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
              fontSize: 12,
              color: "var(--vr-muted, #5d636a)",
            }}
          >
            {image ? (
              <img src={image} alt="签名" style={{ height: 32, objectFit: "contain" }} />
            ) : (
              <span
                style={{
                  fontFamily: "'Segoe Script','Brush Script MT',cursive",
                  fontSize: 18,
                  color: "var(--vr-text, #1f2328)",
                }}
              >
                {who}
              </span>
            )}
            <span>签署日期：{date}</span>
          </span>
        );
      },
      renderOverlay: (ctx) => {
        if (!ctx.state.signatureOn || stamp !== "seal") return null;
        return (
          <div
            key="stamp-seal"
            style={{
              position: "absolute",
              left: 16,
              bottom: 16,
              zIndex: 41,
              pointerEvents: "none",
              width: 88,
              height: 88,
              borderRadius: "50%",
              border: "3px solid #cf4407",
              color: "#cf4407",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(-12deg)",
            }}
          >
            <div style={{ fontSize: 11, borderBottom: "1px solid #cf4407", paddingBottom: 2, marginBottom: 2 }}>
              RESUME
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1 }}>{stampText}</div>
            <div style={{ fontSize: 10 }}>{dateStr()}</div>
          </div>
        );
      },
    },
  };
};

createSignatureStampPlugin.meta = doc as PluginDoc;
