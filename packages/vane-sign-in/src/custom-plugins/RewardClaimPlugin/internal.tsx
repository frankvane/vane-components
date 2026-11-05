import React, { useRef, useState } from "react";
import type {
  SignInPluginContext,
  RewardInfo,
} from "../../components/SignInPlugin/plugins/types";
import { ACCENT } from "../tokens";
import { invokeCallback, resolveErrorMessage } from "../../utils/callback";

interface ClaimButtonProps {
  ctx: SignInPluginContext;
  target: RewardInfo;
  pendingText: string;
  errorText: string;
}

/**
 * 领取按钮（有内部态，必须是独立组件）。
 * 与签到 CTA 同款在途锁：pending 期间禁用，失败回滚并展示错误，
 * 成功以消费方回写的 `reward.claimed` 为准（不做乐观已领）。
 */
export function ClaimButton({
  ctx,
  target,
  pendingText,
  errorText,
}: ClaimButtonProps) {
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setLocalError(null);
    try {
      await invokeCallback(ctx.callbacks.claim, target.day);
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
        data-testid="si-claim-btn"
        data-day={String(target.day)}
        data-pending={String(pending)}
        aria-busy={pending || undefined}
        disabled={pending}
        onClick={() => {
          void handleClaim();
        }}
        style={{
          border: "none",
          background: ACCENT,
          color: "#ffffff",
          borderRadius: 18,
          padding: "6px 16px",
          fontSize: 13,
          fontWeight: 700,
          cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        {pending ? pendingText : `领取第${target.day}天奖励 · ${target.label}`}
      </button>
      {localError && (
        <div
          role="alert"
          data-testid="si-claim-error"
          style={{ fontSize: 12, color: "#d4380d" }}
        >
          {localError}
        </div>
      )}
    </div>
  );
}
