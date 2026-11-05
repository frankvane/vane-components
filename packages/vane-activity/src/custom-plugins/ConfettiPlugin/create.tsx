import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type { ActivityPluginContext } from "../../components/ActivityPlugin/plugins/types";
import { ConfettiBurst } from "./internal";
import doc from "./doc.json";

export interface ConfettiPluginConfig {
  /** 彩纸数量（默认 28） */
  count?: number;
  /** 单轮下落时长（秒，默认 2.6） */
  durationSec?: number;
  /** 达成阈值（默认 1，即 100% 才庆祝） */
  threshold?: number;
}

/**
 * ConfettiPlugin - 庆祝彩纸（renderOverlay）：总体进度达到阈值（默认 100%）时，
 * 在活动容器内下落一轮彩纸。与 ProgressFx 自带的文字浮层同槽共存——overlay 槽位
 * 天然可叠加，本插件不声明独占。纯形状动画（无文字），pointerEvents:none 不挡交互。
 */
export const createConfettiPlugin: PluginCreator<ConfettiPluginConfig> = (
  config = {}
) => {
  const { count = 28, durationSec = 2.6, threshold = 1 } = config;

  return {
    name: "ConfettiPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 50,
    config,
    hooks: {
      renderOverlay: (context: ActivityPluginContext) => (
        <ConfettiBurst
          progress={context.progress ?? 0}
          count={count}
          durationSec={durationSec}
          threshold={threshold}
        />
      ),
    },
  };
};

createConfettiPlugin.meta = doc as PluginDoc;
