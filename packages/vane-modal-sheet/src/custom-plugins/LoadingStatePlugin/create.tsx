import React from "react";
import type {
  ModalSheetCoreProps,
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface LoadingStatePluginConfig {
  /** 是否处于加载态（业务侧受控传入） */
  loading?: boolean;
  /** 骨架行数（默认 3） */
  rows?: number;
  /** 骨架高亮色 */
  shimmerColor?: string;
}

/**
 * 加载骨架：loading 时内容区覆盖骨架屏，同时置引擎拖拽锁（加载中不允许
 * 拖拽打断）。业务侧改 loading 后调用宿主 forceUpdate 或随 props 传入。
 * priority 86（反馈带）。
 */
export const createLoadingStatePlugin: ModalSheetPluginCreator<LoadingStatePluginConfig> = (
  config = {}
) => {
  const { loading = false, rows = 3, shimmerColor = "#eef1f4" } = config;

  return {
    name: "loading-state",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 86,
    hooks: {
      transformProps: (props: ModalSheetCoreProps) => {
        if (props.sheetState) props.sheetState.dragLock = loading;
        return props;
      },
      onPropsChange: (ctx: ModalSheetPluginContext) => {
        ctx.forceUpdate();
      },
      renderOverlay: (ctx: ModalSheetPluginContext) => {
        const active =
          (config.loading ?? false) ||
          (ctx.props as { loading?: boolean }).loading === true;
        if (!active) return null;
        return (
          <div
            aria-busy="true"
            aria-label="加载中"
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--vane-modal-sheet-bg, #ffffff)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              zIndex: 5,
            }}
          >
            {Array.from({ length: rows }, (_, i) => (
              <div
                key={i}
                style={{
                  height: 44,
                  borderRadius: 10,
                  background: `linear-gradient(90deg, ${shimmerColor} 25%, #f8fafc 50%, ${shimmerColor} 75%)`,
                  backgroundSize: "200% 100%",
                  animation: "vane-ms-shimmer 1.2s infinite linear",
                }}
              />
            ))}
            <style>{`@keyframes vane-ms-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
          </div>
        );
      },
    },
  };
};

createLoadingStatePlugin.meta = doc as import("vane-plugin-core").PluginDoc;
