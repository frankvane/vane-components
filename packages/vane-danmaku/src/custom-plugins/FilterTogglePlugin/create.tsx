import type {
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { FilterToggle } from "./internal";

export interface FilterToggleConfig {
  /** 默认开启的过滤项 key（其余默认关） */
  defaults?: string[];
  /** 切换回调（消费方可据此重建对应数据面插件）；与 bus 广播并存 */
  onToggle?: (key: string, enabled: boolean) => void;
}

/**
 * FilterTogglePlugin —— 过滤开关条（UI 面，renderHeader）。
 * 渲染一排过滤项 chip，点击经 bus 广播 "danmaku:filter" {key,enabled}，
 * 由消费方（demo）据此重建对应数据面插件（传 enabled）。纯控制层，不碰弹幕流。
 */
export function createFilterTogglePlugin(
  config: FilterToggleConfig = {}
): DanmakuPlugin {
  return {
    name: "filter-toggle",
    version: "0.1.0",
    description: doc.description,
    priority: 31,
    enabled: true,
    hooks: {
      renderHeader: (context: DanmakuPluginContext) => (
        <FilterToggle
          context={context}
          defaults={config.defaults}
          onToggle={config.onToggle}
        />
      ),
    },
  };
}

createFilterTogglePlugin.meta = doc as PluginDoc;
