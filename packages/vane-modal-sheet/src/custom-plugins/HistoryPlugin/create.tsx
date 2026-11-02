import type {
  ModalSheetCoreProps,
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface HistoryPluginConfig {
  /** 推入 history 的状态标记（默认 { vaneModalSheet: "close" }） */
  state?: unknown;
}

/**
 * Android 返回手势 / 浏览器后退关闭：打开时 pushState 埋一条记录，
 * popstate（返回键）触发 ctx.close()。关闭后清哨兵避免自己 pop 自己。
 * priority 66（行为带）。
 */
export const createHistoryPlugin: ModalSheetPluginCreator<HistoryPluginConfig> = (
  config = {}
) => {
  const { state = { vaneModalSheet: "close" } } = config;
  let armed = false;

  const onPop = (close: () => void) => () => {
    if (!armed) return;
    armed = false;
    close();
  };

  /** pushState 安全封装：不可克隆的 state 回退 null，避免 DataCloneError 打断打开 */
  const push = (value: unknown) => {
    if (typeof history === "undefined" || typeof history.pushState !== "function") {
      return;
    }
    try {
      history.pushState(value, "");
    } catch (error) {
      console.warn(
        "[vane-modal-sheet] HistoryPlugin pushState 失败，已用 null 重试",
        error
      );
      try {
        history.pushState(null, "");
      } catch {
        // history 不可写（沙箱 / 跨域限制）时静默放弃
      }
    }
  };

  return {
    name: "history",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 66,
    hooks: {
      onMount: (ctx: ModalSheetPluginContext) => {
        const handler = onPop(() => ctx.close());
        window.addEventListener("popstate", handler);
        return () => {
          // 卸载只摘监听，不主动 history.back()，避免把用户带离当前页
          window.removeEventListener("popstate", handler);
          armed = false;
        };
      },
      onPropsChange: (ctx: ModalSheetPluginContext, _prev: ModalSheetCoreProps, next: ModalSheetCoreProps) => {
        if (next.isOpen && !armed) {
          armed = true;
          push(state);
        } else if (!next.isOpen && armed) {
          armed = false;
          history.back();
        }
        void ctx;
      },
      onClose: () => {
        // 拖拽关闭 / Esc 关闭等不经过 onPropsChange 的路径，这里收尾
        if (armed) {
          armed = false;
          history.back();
        }
      },
    },
  };
};

createHistoryPlugin.meta = doc as import("vane-plugin-core").PluginDoc;
