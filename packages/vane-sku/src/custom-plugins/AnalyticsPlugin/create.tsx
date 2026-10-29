import type {
  SkuPlugin,
  SkuPluginContext,
  SkuSelection,
  SkuVariant,
} from "../../components/SkuPlugin/plugins/types";

/**
 * AnalyticsPlugin — 埋点上报。
 *
 * 规格选择是转化漏斗的关键一步，「哪些组合被点了、哪些组合根本选不出来」
 * 对选品和库存都是硬需求。这里只做事件出口，不渲染任何 UI：
 * 回调（onEvent）与总线（sku:analytics）双通道，接哪家 SDK 由宿主决定。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface AnalyticsEvent {
  name: "sku:mount" | "sku:change" | "sku:invalid";
  selection: SkuSelection;
  variant: SkuVariant | null;
  at: number;
}

export interface AnalyticsConfig {
  /** 统一事件出口（推荐：接到你自己的埋点 SDK） */
  onEvent?: (event: AnalyticsEvent) => void;
  /** 只在命中变体时上报，默认 false（未命中也上报，便于发现「选不出来」的组合） */
  onlyMatched?: boolean;
}

export function createAnalyticsPlugin(config: AnalyticsConfig = {}): SkuPlugin {
  const emit = (
    context: SkuPluginContext,
    name: AnalyticsEvent["name"],
    selection: SkuSelection,
    variant: SkuVariant | null
  ) => {
    if (config.onlyMatched && !variant) return;
    const event: AnalyticsEvent = {
      name,
      selection,
      variant,
      at: Date.now(),
    };
    context.bus.emit("sku:analytics", event);
    config.onEvent?.(event);
  };

  return {
    name: "Analytics",
    version: "0.1.0",
    description: "规格选择埋点：回调 + 总线双通道，不渲染 UI",
    priority: 10,
    config,
    hooks: {
      onMount: (context: SkuPluginContext) => {
        emit(context, "sku:mount", context.selection, context.variant);
      },
      onSkuChange: (
        context: SkuPluginContext,
        selection: SkuSelection,
        variant: SkuVariant | null
      ) => {
        emit(
          context,
          variant ? "sku:change" : "sku:invalid",
          selection,
          variant
        );
      },
    },
  };
}
