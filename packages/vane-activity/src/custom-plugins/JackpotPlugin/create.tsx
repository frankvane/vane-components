import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import { JackpotCard } from "./internal";
import doc from "./doc.json";

export interface JackpotPrize {
  id: string;
  label: string;
  icon?: string;
}

/** 服务端权威抽奖结果：中奖格下标（0-7）与可选的剩余次数 */
export interface JackpotDrawResult {
  index: number;
  remaining?: number;
}

export interface JackpotPluginConfig extends ActivityPluginConfigBase {
  /** 卡片标题（默认「幸运抽奖」） */
  title?: string;
  /** 奖池（固定 8 格；不足自动补「谢谢参与」，超过取前 8 个） */
  prizes?: JackpotPrize[];
  /** 剩余抽奖次数（默认 3） */
  times?: number;
  /** 受控剩余次数；传了则由业务侧回写，组件不自行递减 */
  remainingTimes?: number;
  /**
   * 服务端权威抽奖：返回中奖格与剩余次数。
   * 传了则不再使用本地 Math.random；请求期间按钮禁用。
   * 生产环境应始终由服务端决定中奖结果。
   */
  drawResult?: () => JackpotDrawResult | Promise<JackpotDrawResult>;
  /** 中奖通知（动画结束后触发）；仅通知，不负责扣次数 */
  onDraw?: (prize: JackpotPrize, index: number) => void;
}

/**
 * JackpotPlugin - 幸运抽奖九宫格（renderFooter 槽）。
 *
 * 8 个奖励格围绕中心按钮排布，点击后高亮按帧推进、逐渐减速，停在随机中奖格上。
 * 生产环境应通过 drawResult 由服务端决定中奖格与剩余次数；不传时才使用本地随机
 * （仅适合演示，不能作为发奖依据）。remainingTimes 传入时组件不自行扣次数。
 * 计时器在卸载时统一清理，避免对着已卸载组件 setState。
 */
export const createJackpotPlugin: PluginCreator<JackpotPluginConfig> = (
  config = {}
) => {
  const {
    title = "幸运抽奖",
    prizes = [],
    times = 3,
    remainingTimes,
    drawResult,
    onDraw,
  } = config;

  return {
    name: "JackpotPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 24,
    config,
    hooks: {
      renderFooter: (_context: ActivityPluginContext) => (
        <JackpotCard
          title={title}
          prizes={prizes}
          times={times}
          remainingTimes={remainingTimes}
          drawResult={drawResult}
          onDraw={onDraw}
        />
      ),
    },
  };
};

createJackpotPlugin.meta = doc as PluginDoc;
