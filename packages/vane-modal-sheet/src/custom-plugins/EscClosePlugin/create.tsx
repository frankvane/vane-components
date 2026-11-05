import type {
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface EscClosePluginConfig {
  /** 是否只在自己是最高层 sheet 时才响应（默认 true，多层嵌套时只关栈顶） */
  topOnly?: boolean;
}

/**
 * Esc 关闭：监听 keydown，Escape 触发 ctx.close()。
 * 多层 sheet 用模块级栈保证只关最顶层。priority 56（行为带）。
 */
const stack: symbol[] = [];

export const createEscClosePlugin: ModalSheetPluginCreator<EscClosePluginConfig> = (
  config = {}
) => {
  const { topOnly = true } = config;
  const id = Symbol("esc-close");

  return {
    name: "esc-close",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 56,
    hooks: {
      onMount: (ctx: ModalSheetPluginContext) => {
        stack.push(id);
        const onKey = (e: KeyboardEvent) => {
          if (e.key !== "Escape") return;
          if (topOnly && stack[stack.length - 1] !== id) return;
          ctx.close();
        };
        window.addEventListener("keydown", onKey);
        return () => {
          window.removeEventListener("keydown", onKey);
          const i = stack.indexOf(id);
          if (i >= 0) stack.splice(i, 1);
        };
      },
    },
  };
};

createEscClosePlugin.meta = doc as import("vane-plugin-core").PluginDoc;
