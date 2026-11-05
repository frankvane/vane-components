import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import { ClaimToastLayer } from "./internal";
import doc from "./doc.json";

export interface ClaimToastPluginConfig extends ActivityPluginConfigBase {
  /** 单条 toast 停留时长（ms，默认 2400） */
  durationMs?: number;
  /** 同屏最多几条（默认 3），超出丢弃最早的 */
  max?: number;
  /** 出现位置（默认 bottom-right） */
  position?: "bottom-right" | "top-center";
  /** 自定义文案，默认「已领取：{title}」 */
  message?: (title: string) => string;
}

/**
 * ClaimToastPlugin - 领取成功轻提示：监听 ctx.claimedIds 新增项，在右下角浮出
 * 「已领取：xx」并自动消失。与 ConfettiPlugin（全屏庆祝）正交互补：一个重度仪式感，
 * 一个轻量确认。
 *
 * 首屏已存在的领取记录不会补弹（seenRef 初始化为挂载时的 claimedIds）。
 */
export const createClaimToastPlugin: PluginCreator<ClaimToastPluginConfig> = (
  config = {}
) => {
  const {
    durationMs = 2400,
    max = 3,
    position = "bottom-right",
    message,
  } = config;

  return {
    name: "ClaimToastPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 55,
    config,
    hooks: {
      renderOverlay: (context: ActivityPluginContext) => (
        <ClaimToastLayer
          ctx={context}
          durationMs={durationMs}
          max={max}
          position={position}
          message={message}
        />
      ),
    },
  };
};

createClaimToastPlugin.meta = doc as PluginDoc;
