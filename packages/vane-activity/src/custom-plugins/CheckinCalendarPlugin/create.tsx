import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import { CheckinCalendar } from "./internal";
import doc from "./doc.json";

export interface CheckinCalendarPluginConfig extends ActivityPluginConfigBase {
  /** 标题（默认「连续签到」） */
  title?: string;
  /** 共几天（默认 data.checkin.days ?? 7） */
  days?: number;
  /** 已完成天数（默认 data.checkin.done ?? 0） */
  done?: number;
  /** 今天格子下标 0-based（默认 data.checkin.todayIndex ?? done） */
  todayIndex?: number;
  /** 签到回调；不传则组件内乐观 +1（无后端场景） */
  onCheckin?: () => void;
  /** 是否显示签到按钮（默认 true） */
  showButton?: boolean;
}

/**
 * CheckinCalendarPlugin - 签到日历：N 格进度（已签 / 今日 / 未开始三态）+ 连续天数 + 签到按钮。
 *
 * 落在 renderProgress 槽，与进度条 / 环 / 里程碑同槽共存（靠 order 定上下）。
 * 数据来自 data.checkin（days / done / todayIndex）；不传时回退 config 的 days / done。
 */
export const createCheckinCalendarPlugin: PluginCreator<
  CheckinCalendarPluginConfig
> = (config = {}) => {
  const {
    title = "连续签到",
    days = 7,
    done = 0,
    todayIndex,
    onCheckin,
    showButton = true,
  } = config;

  return {
    name: "CheckinCalendarPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    config,
    hooks: {
      renderProgress: (context: ActivityPluginContext) => (
        <CheckinCalendar
          ctx={context}
          title={title}
          days={days}
          done={done}
          todayIndex={todayIndex}
          onCheckin={onCheckin}
          showButton={showButton}
        />
      ),
    },
  };
};

createCheckinCalendarPlugin.meta = doc as PluginDoc;
