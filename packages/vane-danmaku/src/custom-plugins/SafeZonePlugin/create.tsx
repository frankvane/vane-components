import type {
  DanmakuPlugin,
  DanmakuPluginContext,
  Rect,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface SafeZoneConfig {
  /**
   * 消费方注入的避让区 provider（如接 MediaPipe 时返回实时人物矩形）。
   * 内核每帧调用，绝不阻塞 60fps 渲染；返回最新已知避让区即可。
   */
  provider?: () => Rect[];
  /** 静态安全区：保留顶部/底部条带（比例 0..1），中间留空防遮挡（默认 {top:0.18,bottom:0.12}） */
  reservedBands?: { top?: number; bottom?: number };
}

/**
 * SafeZonePlugin —— 防遮挡（轨道分配策略，数据面契约）。
 * 不依赖任何 ML：只把「避让区来源」写入运行时 shared（avoidZoneProvider），
 * 内核每帧读取并让轨道调度避开这些区域。默认静态安全区（顶/底条带）即零 ML 防遮挡；
 * 消费方接 MediaPipe（Selfie Seg 掩膜→矩形 / Pose 点→凸包）时把 provider 传进来即可。
 *
 * 关键解耦：发布包不捆绑 MediaPipe，体积预算不受影响；ML 跑在消费方 Worker / 独立管线，
 * 低频产出避让区，内核同步消费上一帧已知区（人不会瞬移，几帧延迟可接受）。
 */
export function createSafeZonePlugin(
  config: SafeZoneConfig = {}
): DanmakuPlugin {
  const bands = config.reservedBands ?? { top: 0.18, bottom: 0.12 };

  return {
    name: "safe-zone",
    version: "0.1.0",
    description: doc.description,
    priority: 34,
    enabled: true,
    hooks: {
      onMount: (context: DanmakuPluginContext) => {
        const shared = context.shared;
        if (config.provider) {
          shared.set("avoidZoneProvider", config.provider);
          return;
        }
        shared.set("avoidZoneProvider", () => {
          const { width, height } = context.getSize();
          const zones: Rect[] = [];
          if (bands.top) {
            zones.push({ x: 0, y: 0, w: width, h: height * bands.top });
          }
          if (bands.bottom) {
            zones.push({
              x: 0,
              y: height * (1 - bands.bottom),
              w: width,
              h: height * bands.bottom,
            });
          }
          return zones;
        });
      },
    },
  };
}

createSafeZonePlugin.meta = doc as PluginDoc;
