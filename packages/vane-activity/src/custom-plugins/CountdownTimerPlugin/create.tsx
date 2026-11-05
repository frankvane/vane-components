import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
  ActivityData,
} from "../../components/ActivityPlugin/plugins/types";
import { Countdown } from "./internal";
import doc from "./doc.json";

export interface CountdownTimerPluginConfig extends ActivityPluginConfigBase {
  /** 截止时间（ISO 字符串或时间戳）；不传则回退读 data.endTime */
  endTime?: string | number;
  /** 前缀文案（默认「距活动结束」） */
  label?: string;
  /** 剩余不足该毫秒数时进入紧急态（文字变警示色，默认 1 小时） */
  urgentMs?: number;
}

/**
 * CountdownTimerPlugin - 活动倒计时：renderProgress 槽位在进度条下方追加一行
 * 「距活动结束 x天HH:MM:SS」。截止时间优先取工厂配置，否则回退 data.endTime；
 * 都没有则不渲染。与 ProgressFx 同槽共存（互不独占）。
 */
export const createCountdownTimerPlugin: PluginCreator<CountdownTimerPluginConfig> = (
  config = {}
) => {
  const { endTime, label = "距活动结束", urgentMs = 3600_000 } = config;

  return {
    name: "CountdownTimerPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 12,
    config,
    hooks: {
      renderProgress: (context: ActivityPluginContext) => {
        const raw = endTime ?? (context.data as ActivityData | undefined)?.endTime;
        if (raw === undefined) return null;
        const end = typeof raw === "number" ? raw : new Date(raw).getTime();
        if (!Number.isFinite(end)) return null;
        return <Countdown end={end} label={label} urgentMs={urgentMs} />;
      },
    },
  };
};

createCountdownTimerPlugin.meta = doc as PluginDoc;
