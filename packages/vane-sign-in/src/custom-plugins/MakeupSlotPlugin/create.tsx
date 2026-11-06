import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { MakeupSlot } from "./internal";

export interface MakeupSlotConfig {
  /** 自定义按钮文案（仅在「有目标且还有配额」时使用） */
  buttonText?: string;
  /** 配额耗尽时的文案 */
  exhaustedText?: string;
  /** 无可补签目标（配额还在）时的文案 */
  noTargetText?: string;
  /** 回调失败时的兜底文案（错误对象自带 message 时优先用 message） */
  errorText?: string;
}

/**
 * MakeupSlotPlugin - 补签位（操作区）。
 * 选「不晚于业务日、日期最早」的可补签格；配额耗尽 / 无可补目标分别提示，
 * 不再把两种状态混成「补签次数已用完」。
 */
// 泛型默认值 unknown：T 不参与类型结构（data 恒为 SignInData），默认值不影响调用方。
export function createMakeupSlotPlugin<T = unknown>(
  config: MakeupSlotConfig = {}
): SignInPlugin<T> {
  const {
    buttonText,
    exhaustedText = "补签次数已用完",
    noTargetText = "暂无可补签",
    errorText = "补签失败，请重试",
  } = config;

  return {
    name: "MakeupSlot",
    version: "0.1.0",
    description: doc.description,
    priority: 42,
    enabled: true,
    hooks: {
      renderActions: (ctx: SignInPluginContext<T>) => (
        <MakeupSlot
          ctx={ctx}
          buttonText={buttonText}
          exhaustedText={exhaustedText}
          noTargetText={noTargetText}
          errorText={errorText}
        />
      ),
    },
  };
}

createMakeupSlotPlugin.meta = doc as PluginDoc;
