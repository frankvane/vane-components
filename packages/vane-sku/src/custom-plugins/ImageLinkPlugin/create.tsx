import type {
  SkuPlugin,
  SkuPluginContext,
} from "../../components/SkuPlugin/plugins/types";

/**
 * ImageLinkPlugin — 规格切主图（B5：只发事件，不渲染 UI）。
 *
 * 命中变体带 image 时把图抛给外层（回调 + 总线），由外层 gallery / card 决定
 * 怎么切主图 —— 规格图联动与「谁来渲染主图」解耦，core 因此不碰图片渲染。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface ImageLinkConfig {
  /** 主图切换回调（推荐用法） */
  onImageChange?: (image: string) => void;
}

export function createImageLinkPlugin(
  config: ImageLinkConfig = {}
): SkuPlugin {
  const push = (context: SkuPluginContext) => {
    const image = context.variant?.image;
    if (!image) return;
    config.onImageChange?.(image);
    context.bus.emit("sku:image", image);
  };

  return {
    name: "ImageLink",
    version: "0.1.0",
    description: "规格切主图：命中变体带图时抛事件，不渲染 UI",
    priority: 30,
    config,
    hooks: {
      onMount: (context: SkuPluginContext) => {
        push(context);
      },
      onSkuChange: (context: SkuPluginContext) => {
        push(context);
      },
    },
  };
}
