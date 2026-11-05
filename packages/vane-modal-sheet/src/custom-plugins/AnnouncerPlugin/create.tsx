import React from "react";
import type {
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface AnnouncerPluginConfig {
  /** 各档播报文案（长度对齐 snapPoints；缺省播报「已展开 N%」） */
  labels?: string[];
}

/**
 * 读屏播报：挂一个 aria-live=polite 区域，onSnap 时播报当前档位。
 * 时基值走 getter + forceUpdate 铁律。priority 84（反馈带）。
 */
export const createAnnouncerPlugin: ModalSheetPluginCreator<AnnouncerPluginConfig> = (
  config = {}
) => {
  const { labels } = config;
  let message = "";

  return {
    name: "announcer",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 84,
    hooks: {
      onSnap: (ctx: ModalSheetPluginContext, index: number) => {
        const text =
          labels?.[index] ?? `已展开 ${Math.round(ctx.progress * 100)}%`;
        if (text === message) return;
        message = text;
        ctx.forceUpdate();
      },
      renderOverlay: () => (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            margin: -1,
            overflow: "hidden",
            clipPath: "inset(50%)",
            whiteSpace: "nowrap",
          }}
        >
          {message}
        </div>
      ),
    },
  };
};

createAnnouncerPlugin.meta = doc as import("vane-plugin-core").PluginDoc;
