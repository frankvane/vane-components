import type { PluginDoc } from "vane-plugin-core";
import type {
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";
import type { ModalSheetCoreProps } from "../../components/ModalSheetPlugin/plugins/types";

export interface KeyboardAvoidPluginConfig {
  /** 键盘弹出时是否自动吸附到最高档（默认 true） */
  snapToTop?: boolean;
}

/**
 * 虚拟键盘避让：visualViewport 监听（VirtualKeyboard API 不可用时兜底），
 * 经 ctx.setViewportInset 告诉内核视口被占用多少，几何由内核重算（插件不碰 transform）。
 * priority 50（行为钩子）。
 */
export const createKeyboardAvoidPlugin: ModalSheetPluginCreator<
  KeyboardAvoidPluginConfig
> = (config = {}) => {
  const { snapToTop = true } = config;

  return {
    name: "keyboard-avoid",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 50,
    hooks: {
      onMount: (ctx: ModalSheetPluginContext) => {
        if (typeof window === "undefined") return;
        const vv = (window as Window & { visualViewport?: VisualViewport })
          .visualViewport;
        if (!vv) return;
        const readInset = () =>
          Math.max(window.innerHeight - vv.height - vv.offsetTop, 0);
        const sync = () => {
          if (!ctx.props.isOpen) return;
          const inset = Math.round(readInset());
          ctx.setViewportInset(inset);
          if (inset > 0 && snapToTop && ctx.currentSnap !== 0) ctx.snapTo(0);
        };
        vv.addEventListener("resize", sync);
        vv.addEventListener("scroll", sync);
        return () => {
          vv.removeEventListener("resize", sync);
          vv.removeEventListener("scroll", sync);
          ctx.setViewportInset(0);
        };
      },
      onPropsChange: (
        ctx: ModalSheetPluginContext,
        prev: ModalSheetCoreProps,
        next: ModalSheetCoreProps
      ) => {
        // 关闭时清零 inset，避免下次打开带着上次的键盘残留
        if (prev.isOpen && !next.isOpen) ctx.setViewportInset(0);
      },
    },
  };
};

createKeyboardAvoidPlugin.meta = doc as PluginDoc;
