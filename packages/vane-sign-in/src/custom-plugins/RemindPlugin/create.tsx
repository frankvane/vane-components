import type React from "react";
import { useRef, useState } from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { ACCENT, ACCENT_SOFT, TEXT_2 } from "../tokens";
import { invokeCallback, resolveErrorMessage } from "../../utils/callback";

export interface RemindConfig {
  /** 初始是否开启提醒（`data.remindEnabled` 存在时以数据为准） */
  defaultOn?: boolean;
  /** 持久化失败时的兜底文案（错误对象自带 message 时优先用 message） */
  errorText?: string;
}

interface RemindButtonProps {
  ctx: SignInPluginContext<any>;
  initialOn: boolean;
  errorText: string;
}

/**
 * 提醒开关（有内部态，必须是独立组件）。
 *
 * 旧实现「先乐观切换、返回值丢弃」：持久化失败后 UI 永久停在「已开启」。
 * 这里保持乐观切换（开关手感需要即时反馈），但失败时回滚到原状态并给出可见错误。
 */
function RemindButton({ ctx, initialOn, errorText }: RemindButtonProps) {
  const [on, setOn] = useState(initialOn);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  const handleToggle = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const next = !on;
    const previous = on;
    setOn(next);
    setError(null);
    try {
      await invokeCallback(ctx.callbacks.remind, next);
    } catch (err) {
      setOn(previous);
      setError(resolveErrorMessage(err, errorText));
    } finally {
      pendingRef.current = false;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
      }}
    >
      <button
        type="button"
        data-testid="si-remind-btn"
        data-on={String(on)}
        aria-pressed={on}
        onClick={() => {
          void handleToggle();
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
      {error && (
        <div
          role="alert"
          data-testid="si-remind-error"
          style={{ fontSize: 12, color: "#d4380d" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * RemindPlugin - 签到提醒开关（操作区）。
 * 本地维护开关态，切换即经 ctx.callbacks.remind(enabled) 下发给消费方持久化；
 * 失败时回滚并展示错误（不再静默停在「已开启」）。
 */
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
