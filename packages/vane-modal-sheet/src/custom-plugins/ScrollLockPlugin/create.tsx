import type { PluginDoc } from "vane-plugin-core";
import type {
  ModalSheetCoreProps,
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface ScrollLockPluginConfig {
  /** 是否同时锁定 body 的触摸滚动（touchmove preventDefault，默认 false） */
  lockTouch?: boolean;
}

/**
 * body 滚动锁定：isOpen 时锁 body overflow，关闭时按原值恢复。
 * iOS 滚动穿透的完整治理（touchmove 拦截）由 lockTouch 开关提供基础拦截。
 * priority 52（行为钩子）。
 */
export const createScrollLockPlugin: ModalSheetPluginCreator<
  ScrollLockPluginConfig
> = (config = {}) => {
  const { lockTouch = false } = config;
  let savedOverflow = "";
  let touchHandler: ((e: TouchEvent) => void) | null = null;

  return {
    name: "scroll-lock",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 52,
    hooks: {
      onPropsChange: (
        ctx: ModalSheetPluginContext,
        prev: ModalSheetCoreProps,
        next: ModalSheetCoreProps
      ) => {
        if (typeof document === "undefined") return;
        const body = document.body;
        if (!prev.isOpen && next.isOpen) {
          savedOverflow = body.style.overflow;
          body.style.overflow = "hidden";
          if (lockTouch) {
            touchHandler = (e) => {
              // 面板内容区可滚，锁的是背景穿透（content 内滚动由 overscroll-behavior 收口）
              const target = e.target as HTMLElement | null;
              if (target?.closest?.("[data-vane-ms-scrollable]")) return;
              e.preventDefault();
            };
            document.addEventListener("touchmove", touchHandler, {
              passive: false,
            });
          }
        } else if (prev.isOpen && !next.isOpen) {
          body.style.overflow = savedOverflow;
          savedOverflow = "";
          if (touchHandler) {
            document.removeEventListener("touchmove", touchHandler);
            touchHandler = null;
          }
        }
      },
    },
  };
};

createScrollLockPlugin.meta = doc as PluginDoc;
