import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
  DayCell,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface MakeupSlotConfig {
  /** 自定义按钮文案（禁用态仍显示「补签次数已用完」） */
  buttonText?: string;
}

/**
 * MakeupSlotPlugin - 补签位（操作区）。
 * 找到第一个可补签的漏签格，展示补签入口；补签次数用尽后置灰禁用。
 * canMakeup 由消费方数据驱动（漏签且仍在补签窗口内）。
 */
export function createMakeupSlotPlugin<T = any>(
  config: MakeupSlotConfig = {}
): SignInPlugin<T> {
  const { buttonText } = config;

  return {
    name: "MakeupSlot",
    version: "0.1.0",
    description: doc.description,
    priority: 42,
    enabled: true,
    hooks: {
      renderActions: (ctx: SignInPluginContext<T>) => {
        const { makeup, calendar } = ctx.data;
        const target: DayCell | undefined = (calendar ?? []).find((c) => c.canMakeup);
        const remaining = makeup.available - makeup.used;
        const disabled = remaining <= 0 || !target;
        const label = disabled
          ? "补签次数已用完"
          : buttonText ?? `补签 · 剩${remaining}次`;
        return (
          <button
            type="button"
            data-testid="si-makeup-btn"
            data-disabled={String(disabled)}
            disabled={disabled}
            onClick={() => target && ctx.callbacks.makeup?.(target.date)}
            style={{
              border: disabled ? "1px solid #d8d8d8" : "1px solid #cf4407",
              background: disabled ? "#f2f3f5" : "#fff",
              color: disabled ? "#8a8a8a" : "#cf4407",
              borderRadius: 18,
              padding: "6px 14px",
              fontSize: 13,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {label}
          </button>
        );
      },
    },
  };
}

createMakeupSlotPlugin.meta = doc as PluginDoc;
