import type { ModalSheetPluginCreator } from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface HapticsPluginConfig {
  /** 吸附时震动时长 ms（默认 8） */
  snapMs?: number;
  /** 关闭时震动时长 ms（默认 12） */
  closeMs?: number;
}

/**
 * 触感反馈：吸附 / 关闭时 navigator.vibrate 短震（不支持的设备静默跳过）。
 * priority 82（反馈带）。
 */
export const createHapticsPlugin: ModalSheetPluginCreator<HapticsPluginConfig> = (
  config = {}
) => {
  const { snapMs = 8, closeMs = 12 } = config;

  const buzz = (ms: number) => {
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* 不支持触感的设备静默跳过 */
    }
  };

  return {
    name: "haptics",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 82,
    hooks: {
      onSnap: () => buzz(snapMs),
      onClose: () => buzz(closeMs),
    },
  };
};

createHapticsPlugin.meta = doc as import("vane-plugin-core").PluginDoc;
