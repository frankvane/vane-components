import type { PluginDoc } from "vane-plugin-core";
import type { ModalSheetPluginCreator } from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface BackdropPluginConfig {
  /** 遮罩颜色（含透明度） */
  color?: string;
  /** 点击遮罩是否关闭（默认 true） */
  dismissOnClick?: boolean;
}

/**
 * 遮罩插件：透明度 = 打开进度（--vane-ms-progress 由内核逐帧写入，零 React 渲染成本）。
 * priority 10（renderBackdrop 槽）。
 */
export const createBackdropPlugin: ModalSheetPluginCreator<BackdropPluginConfig> = (
  config = {}
) => {
  const { color = "rgba(0, 0, 0, 0.45)", dismissOnClick = true } = config;

  return {
    name: "backdrop",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 10,
    hooks: {
      renderBackdrop: (ctx) => (
        <div
          data-vane-ms-backdrop=""
          onClick={dismissOnClick ? () => ctx.close() : undefined}
          style={{
            position: "absolute",
            inset: 0,
            background: color,
            color: "#ffffff",
            opacity: "var(--vane-ms-progress, 0)",
            transition: "opacity 240ms cubic-bezier(0.32, 0.72, 0, 1)",
            pointerEvents: "auto",
          }}
        />
      ),
    },
  };
};

createBackdropPlugin.meta = doc as PluginDoc;
