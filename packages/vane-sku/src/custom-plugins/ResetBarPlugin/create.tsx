import React from "react";
import type { SkuPlugin, SkuPluginContext } from "../../components/SkuPlugin/plugins/types";

/**
 * ResetBarPlugin — 清空重选。
 *
 * 选了一半想重来是高频操作；core 支持「再点同值取消」，但逐个取消很烦。
 * 这里给一个整体重置入口，走 context.clearSelection()。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface ResetBarConfig {
  /** 按钮文案，默认 "清空重选" */
  text?: string;
  /** 清空后回调 */
  onReset?: () => void;
}

export function createResetBarPlugin(config: ResetBarConfig = {}): SkuPlugin {
  return {
    name: "ResetBar",
    version: "0.1.0",
    description: "清空重选：一键重置全部规格选择",
    priority: 20,
    config: { slotPosition: "after", order: 40, ...config },
    hooks: {
      renderHeader: (context: SkuPluginContext) => {
        const hasSelection = Object.keys(context.selection ?? {}).length > 0;
        if (!hasSelection) return null;

        return (
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              data-testid="sku-reset"
              onClick={() => {
                context.clearSelection();
                config.onReset?.();
              }}
              style={{
                padding: "4px 10px",
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid #d0d4da",
                background: "#fff",
                color: "#1f2328",
                cursor: "pointer",
              }}
            >
              {config.text ?? "清空重选"}
            </button>
          </div>
        );
      },
    },
  };
}
