import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import { Overlay } from "../../components/ResumePlugin/plugins/overlay";
import doc from "./doc.json";

export interface ShareLinkConfig {
  /** 宿主基础地址（未配置 onBuildUrl 时的跳转目标，不含简历数据） */
  baseUrl?: string;
  /**
   * 注入宿主构建链接（推荐）。默认不在 URL 内联简历数据：
   * base64 不是加密，完整 JSON 含姓名 / 电话 / 邮箱 / 住址，会进入浏览器历史与聊天记录。
   * 确需携带数据时，请在此生成脱敏后的短链或服务端短码。
   */
  onBuildUrl?: (data: ResumeData) => string | Promise<string>;
}

const originOf = () =>
  typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : "https://example.com/";

export const createShareLinkPlugin: ResumePluginCreator<ShareLinkConfig> = (config = {}) => {
  const build = async (data: ResumeData): Promise<string> => {
    if (config.onBuildUrl) return config.onBuildUrl(data);
    return config.baseUrl ?? originOf();
  };

  return {
    name: "share-link",
    version: "0.1.0",
    description: doc.description,
    priority: 18,
    config: { order: 18 },
    hooks: {
      renderToolbar: (ctx: ResumePluginContext<ResumeData>) => (
        <button
          key="share-link"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={!!ctx.state.shareOpen}
          onClick={async () => {
            if (ctx.state.shareOpen) {
              ctx.setState({ shareOpen: false, shareCopied: false });
              return;
            }
            try {
              const url = await build(ctx.data as ResumeData);
              ctx.shared.set("share:url", url);
              ctx.setState({ shareOpen: true, shareCopied: false, shareError: null });
            } catch (error) {
              ctx.logger.error("[ShareLink] 链接生成失败", error);
              ctx.setState({ shareOpen: true, shareCopied: false, shareError: "链接生成失败，请稍后重试" });
            }
          }}
          style={toolbarBtn(!!ctx.state.shareOpen)}
        >
          分享
        </button>
      ),
      renderOverlay: (ctx) => {
        if (!ctx.state.shareOpen) return null;
        const url = (ctx.shared.get("share:url") as string) ?? "";
        const copied = !!ctx.state.shareCopied;
        const error = ctx.state.shareError as string | undefined;
        const close = () => ctx.setState({ shareOpen: false, shareCopied: false });
        const copy = async () => {
          if (!url) return;
          try {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
              await navigator.clipboard.writeText(url);
              ctx.setState({ shareCopied: true, shareError: null });
            } else {
              ctx.setState({ shareError: "当前环境不支持剪贴板，请手动复制" });
            }
          } catch (e) {
            ctx.logger.error("[ShareLink] 复制失败", e);
            ctx.setState({ shareError: "复制失败，请手动复制" });
          }
        };
        return (
          <Overlay key="share-link-modal" title="分享链接" onClose={close} zIndex={60}>
            <div
              style={{
                fontSize: 12,
                color: "#5d636a",
                wordBreak: "break-all",
                background: "#f2f3f5",
                borderRadius: 6,
                padding: 8,
                maxHeight: 80,
                overflow: "auto",
              }}
            >
              {url || "生成中…"}
            </div>
            {!config.onBuildUrl && (
              <div style={{ color: "#8a9099", fontSize: 12, marginTop: 8 }}>
                未配置 onBuildUrl：该链接不包含简历数据。如需携带数据，请由宿主生成脱敏短链（base64 不是加密）。
              </div>
            )}
            {error && <div style={{ color: "#cf4407", fontSize: 12, marginTop: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => void copy()} style={toolbarBtn(true)}>
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          </Overlay>
        );
      },
    },
  };
};

createShareLinkPlugin.meta = doc as PluginDoc;
