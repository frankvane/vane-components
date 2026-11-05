import type {
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { SettingsPanel } from "./internal";

export interface SettingsPanelConfig {
  /** 初始不透明度，默认 1 */
  opacity?: number;
  /** 初始速度系数，默认 1 */
  speed?: number;
  /** 初始轨道高度（px），默认 28 */
  trackHeight?: number;
  /** 变更回调（消费方可据此更新 DanmakuCore props）；与 bus 广播并存 */
  onChange?: (s: { opacity: number; speed: number; trackHeight: number }) => void;
}

/**
 * SettingsPanelPlugin —— 弹幕设置面板（UI 面，renderOverlay）。
 * 浮层提供不透明度/速度/轨道高度滑块，变更经 bus 广播 "danmaku:settings"，
 * 由消费方（demo）监听并更新 DanmakuCore 的 props。面板本身不参与 canvas 渲染。
 */
export function createSettingsPanelPlugin(
  config: SettingsPanelConfig = {}
): DanmakuPlugin {
  return {
    name: "settings-panel",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    enabled: true,
    hooks: {
      renderOverlay: (context: DanmakuPluginContext) => (
        <SettingsPanel
          context={context}
          opacity={config.opacity}
          speed={config.speed}
          trackHeight={config.trackHeight}
          onChange={config.onChange}
        />
      ),
    },
  };
}

createSettingsPanelPlugin.meta = doc as PluginDoc;
