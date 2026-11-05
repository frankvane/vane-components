import React, { useMemo, useRef, useState } from "react";
import type { SignInPluginContext } from "../../components/SignInPlugin/plugins/types";
import { useSignInNow } from "../../components/SignInPlugin/plugins/clockContext";
import { invokeCallback, resolveErrorMessage } from "../../utils/callback";
import { toDayKey } from "../../utils/date";

interface CheckInButtonProps {
  ctx: SignInPluginContext;
  signedText: string;
  unsignedText: string;
  pendingText: string;
  errorText: string;
}

/**
 * 签到按钮（有内部态，必须是独立组件）。
 *
 * 修掉的两个真实缺陷：
 *  - P0：`disabled={todaySigned}` 只等宿主回写数据，网络往返窗口内可被无限次点击。
 *    这里点击后立即置 pending + 使用 ref 同帧去重，失败时回滚 pending 并展示错误；
 *    pending 期间按钮禁用，成功仍以消费方 `data.todaySigned` 为准（不做乐观已签）。
 *  - P1-3：页面跨夜不自动复位。用 Core 时钟的 `now` 与 `nextResetAt` / `todayKey`
 *    比对，跨过业务日后旧 `todaySigned` 视为过期，按钮自动恢复可点。
 */
export function CheckInButton({
  ctx,
  signedText,
  unsignedText,
  pendingText,
  errorText,
}: CheckInButtonProps) {
  const now = useSignInNow();
  const {
    todaySigned,
    nextResetAt,
    todayKey: businessTodayKey,
    businessTimeZone,
    lastError,
  } = ctx.data;

  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const staleSigned = useMemo(() => {
    if (!todaySigned) return false;
    // nextResetAt 是绝对 epoch：跨过即视为新的一天
    if (nextResetAt !== undefined && now >= nextResetAt) return true;
    // 兜底：宿主给了业务日键时，按业务时区逐日比较（不混用 toLocaleDateString / UTC 日切线）
    if (businessTodayKey) {
      return toDayKey(now, businessTimeZone) !== businessTodayKey;
    }
    return false;
  }, [todaySigned, nextResetAt, businessTodayKey, businessTimeZone, now]);

  const signed = todaySigned && !staleSigned;
  const errorMessage = localError ?? lastError?.message ?? null;

  const handleSign = async () => {
    if (signed || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setLocalError(null);
    try {
      await invokeCallback(ctx.callbacks.sign);
    } catch (error) {
      setLocalError(resolveErrorMessage(error, errorText));
    } finally {
      pendingRef.current = false;
      setPending(false);
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
        data-testid="si-checkin-btn"
        data-signed={String(signed)}
        data-pending={String(pending)}
        aria-busy={pending || undefined}
        disabled={signed || pending}
        onClick={() => {
          void handleSign();
        }}
        style={{
          border: "none",
          background: signed ? "#f2f3f5" : "#cf4407",
          color: signed ? "#8a8a8a" : "#ffffff",
          borderRadius: 20,
          padding: "8px 20px",
          fontSize: 14,
          fontWeight: 700,
          cursor: signed || pending ? "not-allowed" : "pointer",
        }}
      >
        {pending ? pendingText : signed ? signedText : unsignedText}
      </button>
      {errorMessage && (
        <div
          role="alert"
          data-testid="si-checkin-error"
          style={{ fontSize: 12, color: "#d4380d" }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
