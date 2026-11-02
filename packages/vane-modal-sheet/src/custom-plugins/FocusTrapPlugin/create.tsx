import type { PluginDoc } from "vane-plugin-core";
import type {
  ModalSheetCoreProps,
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface FocusTrapPluginConfig {
  /** 关闭时是否把焦点归还给打开前的元素（默认 true） */
  restoreFocus?: boolean;
}

/**
 * 焦点圈定：打开时焦点进面板（优先 [data-autofocus]），Tab 循环圈定在面板内；
 * 关闭时焦点归还。role="dialog"/aria-modal 由内核面板自带。
 * priority 54（行为钩子）。
 */
export const createFocusTrapPlugin: ModalSheetPluginCreator<
  FocusTrapPluginConfig
> = (config = {}) => {
  const { restoreFocus = true } = config;
  let savedFocus: HTMLElement | null = null;
  let keyHandler: ((e: KeyboardEvent) => void) | null = null;

  /** 幂等释放：摘掉 keydown、归还焦点、清空 savedFocus */
  const release = () => {
    if (typeof document !== "undefined" && keyHandler) {
      document.removeEventListener("keydown", keyHandler);
    }
    keyHandler = null;
    if (restoreFocus) savedFocus?.focus?.();
    savedFocus = null;
  };

  const focusables = (panel: HTMLElement): HTMLElement[] =>
    Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.tabIndex >= 0);

  return {
    name: "focus-trap",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 54,
    hooks: {
      onPropsChange: (
        ctx: ModalSheetPluginContext,
        prev: ModalSheetCoreProps,
        next: ModalSheetCoreProps
      ) => {
        if (typeof document === "undefined") return;
        if (!prev.isOpen && next.isOpen) {
          const panel = ctx.getPanel();
          if (!panel) return;
          savedFocus =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
          const first =
            panel.querySelector<HTMLElement>("[data-autofocus]") ??
            focusables(panel)[0] ??
            panel;
          first.focus?.();
          keyHandler = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;
            const list = focusables(panel);
            if (list.length === 0) return;
            const firstEl = list[0];
            const lastEl = list[list.length - 1];
            if (e.shiftKey && document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          };
          document.addEventListener("keydown", keyHandler);
        } else if (prev.isOpen && !next.isOpen) {
          release();
        }
      },
      onUnmount: () => {
        release();
      },
    },
  };
};

createFocusTrapPlugin.meta = doc as PluginDoc;
