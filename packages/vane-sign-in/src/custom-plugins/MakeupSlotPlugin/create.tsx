import type React from "react";
import { useMemo, useRef, useState } from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
  DayCell,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { useSignInNow } from "../../components/SignInPlugin/plugins/clock";
import { invokeCallback, resolveErrorMessage } from "../../utils/callback";
import { compareDayKeys, isDayKey, toDayKey } from "../../utils/date";
import { DISABLED_BG, DISABLED_FG, ACCENT } from "../tokens";

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

interface MakeupTarget {
  cell: DayCell;
  remaining: number;
  disabled: boolean;
  exhausted: boolean;
  label: string;
}

/**
 * 选补签目标：只看「不晚于业务日的 canMakeup 格」，按日期升序取最早一天。
 * 旧实现用 `find(canMakeup)`，结果取决于服务端数组顺序，甚至会把未来日期补掉。
 */
function pickMakeupTarget(
  ctx: SignInPluginContext<any>,
  now: number,
  buttonText: string | undefined,
  exhaustedText: string,
  noTargetText: string
): MakeupTarget {
  const { makeup, calendar, todayKey: businessTodayKey, businessTimeZone } =
    ctx.data;
  const today = businessTodayKey ?? toDayKey(now, businessTimeZone);
  const cell = (calendar ?? [])
    .filter(
      (item) =>
        item.canMakeup === true &&
        isDayKey(item.date) &&
        compareDayKeys(item.date, today) <= 0
    )
    .sort((a, b) => compareDayKeys(a.date, b.date))[0];

  const remaining = makeup.available - makeup.used;
  const exhausted = remaining <= 0;
  const disabled = exhausted || !cell;
  const label = exhausted
    ? exhaustedText
    : cell
    ? buttonText ?? `补签 · 剩${remaining}次`
    : noTargetText;

  return { cell, remaining, disabled, exhausted, label };
}

interface MakeupButtonProps {
  ctx: SignInPluginContext<any>;
  target: MakeupTarget;
  errorText: string;
}

/** 补签按钮（有内部态）：在途锁 + 失败回滚，成功以消费方数据回写为准。 */
function MakeupButton({ ctx, target, errorText }: MakeupButtonProps) {
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleMakeup = async () => {
    const cell = target.cell;
    if (!cell || target.disabled || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setLocalError(null);
    try {
      await invokeCallback(ctx.callbacks.makeup, cell.date, { day: cell.day });
    } catch (error) {
      setLocalError(resolveErrorMessage(error, errorText));
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  const disabled = target.disabled || pending;
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
        data-testid="si-makeup-btn"
        data-disabled={String(disabled)}
        data-target={target.cell?.date}
        data-pending={String(pending)}
        aria-busy={pending || undefined}
        disabled={disabled}
        onClick={() => {
          void handleMakeup();
        }}
        style={{
          border: disabled ? "1px solid #d8d8d8" : `1px solid ${ACCENT}`,
          background: disabled ? DISABLED_BG : "#fff",
          color: disabled ? DISABLED_FG : ACCENT,
          borderRadius: 18,
          padding: "6px 14px",
          fontSize: 13,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {pending ? "补签中…" : target.label}
      </button>
      {localError && (
        <div
          role="alert"
          data-testid="si-makeup-error"
          style={{ fontSize: 12, color: "#d4380d" }}
        >
          {localError}
        </div>
      )}
    </div>
  );
}

/**
 * MakeupSlotPlugin - 补签位（操作区）。
 * 选「不晚于业务日、日期最早」的可补签格；配额耗尽 / 无可补目标分别提示，
 * 不再把两种状态混成「补签次数已用完」。
 */
export function createMakeupSlotPlugin<T = any>(
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

interface MakeupSlotProps {
  ctx: SignInPluginContext<any>;
  buttonText?: string;
  exhaustedText: string;
  noTargetText: string;
  errorText: string;
}

/** 目标筛选需要 `now`（业务日），放在子组件里才能拿到 Core 时钟。 */
function MakeupSlot({
  ctx,
  buttonText,
  exhaustedText,
  noTargetText,
  errorText,
}: MakeupSlotProps) {
  const now = useSignInNow();
  const target = useMemo(
    () => pickMakeupTarget(ctx, now, buttonText, exhaustedText, noTargetText),
    [ctx, now, buttonText, exhaustedText, noTargetText]
  );
  return <MakeupButton ctx={ctx} target={target} errorText={errorText} />;
}

createMakeupSlotPlugin.meta = doc as PluginDoc;
