import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, 
  ResumeData,
  AttachmentItem,
} from "../../components/ResumePlugin/plugins/types";
import { cloneData, safeHref } from "../../components/ResumePlugin/plugins/tokens";
import { Overlay } from "../../components/ResumePlugin/plugins/overlay";
import doc from "./doc.json";

export interface AttachmentPreviewConfig {
  items?: AttachmentItem[];
}

export const createAttachmentPreviewPlugin: ResumePluginCreator<AttachmentPreviewConfig> = (config = {}) => {
  const extra = config.items ?? [];
  return {
    name: "attachment-preview",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    config: { order: 30 },
    hooks: {
      // priority 30：管道末位，仅合并配置项中的附件，不改动其它字段
      transformData: (ctx, data) => {
        if (!extra.length) return data;
        const d = cloneData(data as ResumeData);
        d.attachments = [...(d.attachments ?? []), ...extra];
        return d;
      },
      renderAttachments: (ctx: ResumePluginContext<ResumeData>) => {
        const items = (ctx.data as ResumeData)?.attachments ?? [];
        if (!items.length) return null;
        return (
          <div key="attachment-grid" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {items.map((a, i) => (
              <button
                key={a.id ?? i}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={ctx.state.previewItem === (a.id ?? i)}
                onClick={() => ctx.setState({ previewItem: a.id ?? i })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f2f3f5",
                  color: "#1f2328",
                  border: "1px solid #d4d8de",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                <span style={{ color: "var(--vr-accent, #2f6feb)", textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>
                  {a.kind}
                </span>
                <span>{a.name}</span>
              </button>
            ))}
          </div>
        );
      },
      renderOverlay: (ctx) => {
        const id = ctx.state.previewItem;
        if (id === undefined || id === null) return null;
        const item = (ctx.data as ResumeData)?.attachments?.find(
          (a, i) => (a.id ?? i) === id
        );
        if (!item) return null;
        const close = () => ctx.setState({ previewItem: null });
        return (
          <Overlay key="attachment-lightbox" title={item.name} onClose={close} width={560} zIndex={58}>
            <div style={{ flex: 1, overflow: "auto", minHeight: 240 }}>
              {item.kind === "image" ? (
                <img src={item.url} alt={item.name} style={{ maxWidth: "100%", borderRadius: 6 }} />
              ) : item.kind === "pdf" ? (
                <iframe
                  src={safeHref(item.url)}
                  title={item.name}
                  // 不可信 PDF / 网页：默认只允许脚本，禁同源，防弹窗与顶层导航
                  sandbox="allow-scripts"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  style={{ width: "100%", height: 360, border: "1px solid #eee", borderRadius: 6 }}
                />
              ) : (
                <a href={safeHref(item.url)} target="_blank" rel="noreferrer" style={{ color: "var(--vr-accent, #2f6feb)" }}>打开链接 ↗</a>
              )}
            </div>
          </Overlay>
        );
      },
    },
  };
};

createAttachmentPreviewPlugin.meta = doc as PluginDoc;
