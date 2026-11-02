import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, 
  ResumeData,
  ContactItem,
} from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import { Overlay } from "../../components/ResumePlugin/plugins/overlay";
import doc from "./doc.json";

export interface QrCodeConfig {
  /** 二维码内容；缺省由联系方式生成 vCard */
  content?: string | (() => string);
  position?: "corner" | "avatar" | "modal";
  size?: number;
}

const buildVCard = (d: ResumeData, hideContacts: boolean): string => {
  const b = d.basics;
  const contacts = hideContacts
    ? ""
    : (b?.contacts ?? [])
        .map((c: ContactItem) => `${c.type}:${c.value}`)
        .join("\n");
  return `BEGIN:VCARD\nFN:${b?.name ?? ""}\nTITLE:${b?.title ?? ""}\n${contacts}\nEND:VCARD`;
};

export const createQrCodePlugin: ResumePluginCreator<QrCodeConfig> = (config = {}) => {
  const size = config.size ?? 96;
  const position = config.position ?? "corner";

  // 竞态取消：每次重新生成递增 requestId，旧请求完成后直接丢弃
  let requestId = 0;

  const resolveContent = (ctx: ResumePluginContext<ResumeData>): string => {
    if (typeof config.content === "function") return config.content();
    if (typeof config.content === "string") return config.content;
    // 隐私模式下 vCard 不得携带明文联系方式
    return buildVCard(ctx.data as ResumeData, !!ctx.state.privacyOn);
  };

  const ensureQr = (ctx: ResumePluginContext<ResumeData>) => {
    const content = resolveContent(ctx);
    const done = ctx.shared.get("qr:content") as string | undefined;
    const pending = ctx.shared.get("qr:pending") as string | undefined;
    if (done === content || pending === content) return;

    const id = ++requestId;
    ctx.shared.set("qr:pending", content);
    // 先撤掉旧图，避免语言 / 脱敏 / 隐私切换后仍展示含旧数据的二维码
    ctx.shared.delete("qr:dataurl");

    void (async () => {
      let url = "fallback:" + content;
      try {
        const mod = await import("qrcode");
        // CJS/ESM 互操作：浏览器打包后有时挂在 .default，有时直接挂命名导出
        const QR = (mod as { default?: unknown; toDataURL?: unknown }).default ?? mod;
        url = await (QR as { toDataURL: (s: string, o?: object) => Promise<string> }).toDataURL(content, {
          width: size,
          margin: 1,
        });
      } catch {
        /* 回退为纯文本提示 */
      }
      if (id !== requestId) return;
      ctx.shared.set("qr:content", content);
      ctx.shared.delete("qr:pending");
      ctx.shared.set("qr:dataurl", url);
      ctx.forceUpdate();
    })();
  };

  return {
    name: "qr-code",
    version: "0.1.0",
    description: doc.description,
    priority: 46,
    config: { order: 46 },
    hooks: {
      renderToolbar: (ctx) => {
        if (position !== "modal") return null;
        // 弹层模式也提前生成；open 时无需等待
        ensureQr(ctx);
        return (
          <button
            key="qr-code"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={!!ctx.state.qrOpen}
            onClick={() => ctx.setState({ qrOpen: !ctx.state.qrOpen })}
            style={toolbarBtn(!!ctx.state.qrOpen)}
          >
            二维码
          </button>
        );
      },
      renderOverlay: (ctx) => {
        if (position !== "modal") {
          ensureQr(ctx);
          // 角标常显
          const url = ctx.shared.get("qr:dataurl") as string | undefined;
          if (!url) return null;
          const isImg = !url.startsWith("fallback:");
          return (
            <div
              key="qr-corner"
              style={{ position: "absolute", right: 12, bottom: 12, zIndex: 40, padding: 4, background: "#fff", borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
            >
              {isImg ? (
                <img src={url} width={size} height={size} alt="QR" />
              ) : (
                <div style={{ width: size, height: size, fontSize: 9, padding: 6, wordBreak: "break-all", color: "#1f2328" }}>
                  {url.slice(8, 48)}…
                </div>
              )}
            </div>
          );
        }
        if (!ctx.state.qrOpen) return null;
        ensureQr(ctx);
        const url = ctx.shared.get("qr:dataurl") as string | undefined;
        const isImg = !!url && !url.startsWith("fallback:");
        const close = () => ctx.setState({ qrOpen: false });
        return (
          <Overlay key="qr-modal" title="二维码" onClose={close} width={240} zIndex={59}>
            <div style={{ textAlign: "center" }}>
              {isImg ? (
                <img src={url} width={size * 2} height={size * 2} alt="QR" />
              ) : (
                <div style={{ width: size * 2, height: size * 2, fontSize: 12, padding: 8, color: "#1f2328" }}>{url?.slice(8)}</div>
              )}
              <div style={{ color: "#1f2328", marginTop: 8, fontSize: 12 }}>扫码保存联系方式</div>
            </div>
          </Overlay>
        );
      },
    },
  };
};

createQrCodePlugin.meta = doc as PluginDoc;
