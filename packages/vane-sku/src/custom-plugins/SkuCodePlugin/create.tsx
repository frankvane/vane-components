import React from "react";
import type { SkuPlugin, SkuPluginContext } from "../../components/SkuPlugin/plugins/types";

/**
 * SkuCodePlugin — 货号 / SKU 编码展示。
 *
 * 命中变体后把 SKU 编码显示出来，方便客服对单、用户报修、订单核对。
 * 属于典型的「一行字但每家都要」的长尾需求，做成插件而不是塞进 core。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface SkuCodeConfig {
  /** 前缀文案，默认 "货号" */
  label?: string;
}

export function createSkuCodePlugin(config: SkuCodeConfig = {}): SkuPlugin {
  return {
    name: "SkuCode",
    version: "0.1.0",
    description: "货号展示：命中变体后显示 SKU 编码",
    priority: 15,
    config: { slotPosition: "after", order: 50, ...config },
    hooks: {
      renderHeader: (context: SkuPluginContext) => {
        const v = context.variant;
        if (!v?.sku) return null;
        return (
          <div
            data-testid="sku-code"
            style={{ marginTop: 6, fontSize: 11, color: "#5b6064", fontFamily: "ui-monospace, monospace" }}
          >
            {config.label ?? "货号"}：{v.sku}
          </div>
        );
      },
    },
  };
}
