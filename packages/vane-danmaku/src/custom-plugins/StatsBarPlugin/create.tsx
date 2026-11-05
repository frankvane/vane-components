import type {
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { StatsBar } from "./internal";

export interface StatsBarConfig {
  /** 是否显示各模式计数，默认 true */
  showModes?: boolean;
}

/**
 * StatsBarPlugin —— 弹幕统计条（UI 面，renderHeader）。
 * 读取领域上下文的 data 展示弹幕总数 / 置顶数 / 各模式计数（来自 transformData 后的数据集）。
 * 纯展示，不修改弹幕流；实时性取决于消费方传入的 items 更新频率。
 */
export function createStatsBarPlugin(
  config: StatsBarConfig = {}
): DanmakuPlugin {
  const showModes = config.showModes ?? true;
  return {
    name: "stats-bar",
    version: "0.1.0",
    description: doc.description,
    priority: 33,
    enabled: true,
    hooks: {
      renderHeader: (context: DanmakuPluginContext) => (
        <StatsBar context={context} showModes={showModes} />
      ),
    },
  };
}

createStatsBarPlugin.meta = doc as PluginDoc;
