import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface AspectRatioSpacerConfig {
  /** 如 4/3、16/9，或直接传数字（宽/高） */
  ratio?: number;
}

export function createAspectRatioSpacerPlugin(config: AspectRatioSpacerConfig = {}): LazyImagePlugin {
  const { ratio = 4 / 3 } = config;
  return {
    name: "aspect-ratio-spacer",
    version: "1.0.0",
    config,
    hooks: {
      // P2-1：在 transformProps 阶段就写入容器 aspect-ratio，首帧即占位（避免 CLS）。
      // 调用方通过 containerStyle.aspectRatio 显式覆盖时保持其值。
      transformProps: (props) => {
        const prev = props.containerStyle?.aspectRatio;
        return {
          ...props,
          containerStyle: {
            ...(props.containerStyle || {}),
            ...(prev !== undefined ? null : { aspectRatio: String(ratio) }),
          },
        } as typeof props;
      },
      onMount: (context: LazyImageContext) => {
        const container = context.containerRef?.current as HTMLElement | null;
        if (!container) return;
        try {
          // 兜底：宿主绕过 transformProps 时仍能保持布局稳定
          if (!(container as HTMLElement).style.aspectRatio) {
            (container as HTMLElement).style.aspectRatio = String(ratio);
          }
        } catch {}
      },
    },
  };
}