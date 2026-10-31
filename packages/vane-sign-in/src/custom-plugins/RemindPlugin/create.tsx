import type React from "react";
import { useState } from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { ACCENT, ACCENT_SOFT, TEXT_2 } from "../tokens";

export interface RemindConfig {
  /** 初始是否开启提醒 */
  defaultOn?: boolean;
}

function RemindButton({ ctx }: { ctx: SignInPluginContext<any> }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        const v = !on;
        setOn(v);
        ctx.callbacks.remind?.(v);
      }}
      style={{
        border: `1px solid ${on ? ACCENT : "#d8d8d8"}`,
        background: on ? ACCENT_SOFT : "#ffffff",
        color: on ? ACCENT : TEXT_2,
        borderRadius: 18,
        padding: "6px 14px",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {on ? "已开启提醒" : "签到提醒"}
    </button>
  );
}

/**
 * RemindPlugin - 签到提醒开关（操作区）。
 * 本地维护开关态，切换即经 ctx.callbacks.remind(enabled) 下发给消费方持久化。
 */
export function createRemindPlugin<T = any>(
  config: RemindConfig = {}
): SignInPlugin<T> {
  const { defaultOn = false } = config;
  return {
    name: "Remind",
    version: "0.1.0",
    description: doc.description,
    priority: 44,
    enabled: true,
    hooks: {
      renderActions: (ctx: SignInPluginContext<T>) => {
        // defaultOn 仅作首次渲染初值；RemindButton 自身管态。
        void defaultOn;
        return <RemindButton ctx={ctx} />;
      },
    },
  };
}

createRemindPlugin.meta = doc as PluginDoc;
