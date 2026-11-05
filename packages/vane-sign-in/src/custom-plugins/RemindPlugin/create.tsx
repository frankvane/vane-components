import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { RemindButton } from "./internal";

export interface RemindConfig {
  /** 初始是否开启提醒（`data.remindEnabled` 存在时以数据为准） */
  defaultOn?: boolean;
  /** 持久化失败时的兜底文案（错误对象自带 message 时优先用 message） */
  errorText?: string;
}

/**
 * RemindPlugin - 签到提醒开关（操作区）。
 * 本地维护开关态，切换即经 ctx.callbacks.remind(enabled) 下发给消费方持久化；
 * 失败时回滚并展示错误（不再静默停在「已开启」）。
 */
// 泛型默认值 any：公共契约位（同 types.ts 顶部约定），收紧为 unknown 会让不写 T 的调用方 tsc 失败。
export function createRemindPlugin<T = any>(
  config: RemindConfig = {}
): SignInPlugin<T> {
  const { defaultOn = false, errorText = "提醒设置失败，请重试" } = config;
  return {
    name: "Remind",
    version: "0.1.0",
    description: doc.description,
    priority: 44,
    enabled: true,
    hooks: {
      renderActions: (ctx: SignInPluginContext<T>) => (
        <RemindButton
          ctx={ctx}
          initialOn={ctx.data.remindEnabled ?? defaultOn}
          errorText={errorText}
        />
      ),
    },
  };
}

createRemindPlugin.meta = doc as PluginDoc;
