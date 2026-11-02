import type {
  ModalSheetCoreProps,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface SafeAreaPluginConfig {
  /** 额外的面板底部 padding（叠加在 safe-area 之上，px） */
  extraBottom?: number;
}

/**
 * 刘海屏 / 手势条适配：给面板注入 env(safe-area-inset-*) 内边距。
 * priority 60（行为带，transformProps 派）。
 */
export const createSafeAreaPlugin: ModalSheetPluginCreator<SafeAreaPluginConfig> = (
  config = {}
) => {
  const { extraBottom = 0 } = config;

  return {
    name: "safe-area",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 60,
    hooks: {
      transformProps: (props: ModalSheetCoreProps) => ({
        ...props,
        panelStyle: {
          ...props.panelStyle,
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${extraBottom}px)`,
        },
      }),
    },
  };
};

createSafeAreaPlugin.meta = doc as import("vane-plugin-core").PluginDoc;
