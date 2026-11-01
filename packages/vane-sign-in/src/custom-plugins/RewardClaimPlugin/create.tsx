import type React from "react";
import { useRef, useState } from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
  RewardInfo,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { ACCENT, TEXT_3 } from "../tokens";
import { invokeCallback, resolveErrorMessage } from "../../utils/callback";

export interface RewardClaimConfig {
  /** 请求在途时的按钮文案 */
  pendingText?: string;
  /** 回调失败时的兜底文案（错误对象自带 message 时优先用 message） */
  errorText?: string;
}

interface ClaimButtonProps {
  ctx: SignInPluginContext<any>;
  target: RewardInfo;
  pendingText: string;
  errorText: string;
}

/**
 * 领取按钮（有内部态，必须是独立组件）。
 * 与签到 CTA 同款在途锁：pending 期间禁用，失败回滚并展示错误，
 * 成功以消费方回写的 `reward.claimed` 为准（不做乐观已领）。
 */
function ClaimButton({ ctx, target, pendingText, errorText }: ClaimButtonProps) {
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
        {pending
          ? pendingText
          : `领取第${target.day}天奖励 · ${target.label}`}
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

/**
 * RewardClaimPlugin - 当日奖励领取（奖励区）。
 * 找到「已达天数可领但尚未领取」的第一个奖励（data.rewards 中 day<=streak 且 !claimed），
 * 提供领取按钮；点按经 ctx.callbacks.claim(day) 下发。无待领时显示终态文案。
 */
export function createRewardClaimPlugin<T = any>(
  config: RewardClaimConfig = {}
): SignInPlugin<T> {
  const { pendingText = "领取中…", errorText = "领取失败，请重试" } = config;

  return {
    name: "RewardClaim",
    version: "0.1.0",
    description: doc.description,
    priority: 31,
    enabled: true,
    hooks: {
      renderRewards: (ctx: SignInPluginContext<T>) => {
        const { rewards, streak } = ctx.data;
        // 服务端可能乱序：按 day 升序取最靠前的一个待领奖励，避免「先领大奖」
        const target: RewardInfo | undefined = [...(rewards ?? [])]
          .filter((r) => r.day <= streak && !r.claimed)
          .sort((a, b) => a.day - b.day)[0];
        if (!target) {
          return (
            <div style={{ fontSize: 12, color: TEXT_3 }}>
              今日奖励已全部领取
            </div>
          );
        }
        return (
          <ClaimButton
            ctx={ctx}
            target={target}
            pendingText={pendingText}
            errorText={errorText}
          />
        );
      },
    },
  };
}

createRewardClaimPlugin.meta = doc as PluginDoc;
