import React, { useMemo, useRef, useState } from "react";
import type { SignInPluginContext, DayCell } from "../../components/SignInPlugin/plugins/types";
import { useSignInNow } from "../../components/SignInPlugin/plugins/clockContext";
import { invokeCallback, resolveErrorMessage } from "../../utils/callback";
import { compareDayKeys, isDayKey, toDayKey } from "../../utils/date";
import { DISABLED_BG, DISABLED_FG, ACCENT } from "../tokens";

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
  ctx: SignInPluginContext,
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
  ctx: SignInPluginContext;
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

interface MakeupSlotProps {
  ctx: SignInPluginContext;
  buttonText?: string;
  exhaustedText: string;
  noTargetText: string;
  errorText: string;
}

/** 目标筛选需要 `now`（业务日），放在子组件里才能拿到 Core 时钟。 */
export function MakeupSlot({
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
