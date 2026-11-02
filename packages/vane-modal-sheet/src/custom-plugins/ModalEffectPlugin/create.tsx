import type { ModalSheetPluginCreator } from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface ModalEffectPluginConfig {
  /** 背景最大缩大量（0–1，默认 0.06，即 Apple Maps 的轻微放大） */
  amount?: number;
  /** 被缩放的宿主节点选择器（默认 "#root"，弹层 Portal 挂 body 不会跟着缩） */
  hostSelector?: string;
}

/**
 * iOS modal effect：背景页随 progress 轻微放大 + 圆角联动（Apple Maps 弹层感）。
 * 内核逐帧写 --vane-ms-progress，这里 rAF 读 CSS 变量直接写 transform，
 * 零 React 渲染成本。priority 80（反馈带）。
 */
export const createModalEffectPlugin: ModalSheetPluginCreator<ModalEffectPluginConfig> = (
  config = {}
) => {
  const { amount = 0.06, hostSelector = "#root" } = config;
  let rafId = 0;

  return {
    name: "modal-effect",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 80,
    hooks: {
      onMount: (ctx) => {
        const host = document.querySelector(hostSelector);
        if (!host) return;
        const root = ctx.props.containerRefExternal?.current;
        const tick = () => {
          // 进度真源是 CSS 变量（内核逐帧写），读它避免任何 React 渲染
          const p = root
            ? Number(root.style.getPropertyValue("--vane-ms-progress")) || 0
            : 0;
          const scale = 1 + p * amount;
          (host as HTMLElement).style.transform = `scale(${scale.toFixed(4)})`;
          (host as HTMLElement).style.transformOrigin = "center top";
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => {
          cancelAnimationFrame(rafId);
          (host as HTMLElement).style.transform = "";
        };
      },
    },
  };
};

createModalEffectPlugin.meta = doc as import("vane-plugin-core").PluginDoc;
