import React from "react";
import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * CopyCodePlugin — 券码复制（after 槽）。
 *
 * phase 为 claimed/used 且有券码（config.code 或 coupon.code）时展示券码 + 复制按钮。
 * 复制走两条路：navigator.clipboard（secure context）不行时退到
 * 隐藏 textarea + execCommand —— 示例站常挂在 http:// 内网 IP 上，只走
 * clipboard API 会静默失败。复制结果写内核 state.codeCopied，失败经 onError 上报。
 *
 * P2-7：定时器存在 context.shared（连续点击先清旧 timer），onUnmount 统一清理；
 * 异步返回后校验挂载标记，卸载后不再写 state。
 * meta 在同目录 index.ts 挂载。
 */
export interface CopyCodeConfig {
  /** 券码（默认读 coupon.code） */
  code?: string;
  /** 标签文案，默认「券码」 */
  label?: string;
  /** 复制成功回调 */
  onCopied?: (code: string) => void;
  /** 复制失败回调（两条路径都失败时触发，便于宿主提示「请手动复制」） */
  onError?: (reason?: string) => void;
}

/** 定时器 / 挂载标记（context.shared 跨渲染共享） */
const TIMER_KEY = "copy-code:timer";
const MOUNTED_KEY = "copy-code:mounted";
/** 「已复制」提示停留时长 */
const COPIED_RESET_MS = 1600;

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok =
      typeof document.execCommand === "function"
        ? document.execCommand("copy")
        : false;
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function createCopyCodePlugin(config: CopyCodeConfig = {}): CouponPlugin {
  const label = config.label ?? "券码";
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  const clearTimer = (context: CouponPluginContext): void => {
    const timer = context.shared.get(TIMER_KEY);
    if (timer !== undefined) {
      window.clearTimeout(timer as number);
      context.shared.delete(TIMER_KEY);
    }
  };

  return {
    name: "copy-code",
    version: "0.1.0",
    description:
      "券码复制：claimed/used 相位展示券码与复制按钮（clipboard API + execCommand 兜底），结果写 state.codeCopied，失败经 onError 上报",
    priority: 18,
    config: mergedConfig,
    hooks: {
      onMount: (context: CouponPluginContext) => {
        context.shared.set(MOUNTED_KEY, true);
      },
      onUnmount: (context: CouponPluginContext) => {
        context.shared.set(MOUNTED_KEY, false);
        clearTimer(context);
        context.shared.delete(MOUNTED_KEY);
      },
      renderHeader: (context: CouponPluginContext) => {
        const phase = context.phase;
        if (phase !== "claimed" && phase !== "used") return null;
        const code = config.code ?? context.coupon.code;
        if (!code) return null;

        const copied = context.state?.codeCopied === true;

        const copy = async () => {
          let ok = false;
          let reason: string | undefined;
          if (navigator.clipboard?.writeText) {
            try {
              await navigator.clipboard.writeText(code);
              ok = true;
            } catch {
              ok = fallbackCopy(code);
              if (!ok) reason = "clipboard-unavailable";
            }
          } else {
            ok = fallbackCopy(code);
            if (!ok) reason = "clipboard-unavailable";
          }
          if (context.shared.get(MOUNTED_KEY) !== true) return;
          context.setState({ codeCopied: ok });
          if (ok) {
            config.onCopied?.(code);
          } else {
            config.onError?.(reason);
          }
          // 连续点击：先清旧 timer，避免「已复制」提示被前一次提前复位
          clearTimer(context);
          const timer = window.setTimeout(() => {
            context.shared.delete(TIMER_KEY);
            if (context.shared.get(MOUNTED_KEY) !== true) return;
            context.setState({ codeCopied: false });
          }, COPIED_RESET_MS);
          context.shared.set(TIMER_KEY, timer);
        };

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              fontSize: 12,
            }}
            data-testid="coupon-code-area"
          >
            <span style={T.fieldLabelStyle}>{label}</span>
            <code
              style={{
                fontFamily: "var(--ff-mono, monospace)",
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 4,
                background: "#f2f3f5",
                color: "#1f2328",
                border: "1px solid #e8eaed",
              }}
              data-testid="coupon-code"
            >
              {code}
            </code>
            <button
              type="button"
              style={{
                padding: "2px 10px",
                fontSize: 11,
                borderRadius: 4,
                border: "1px solid #e8eaed",
                background: "#fff",
                // 内联了背景必须成对内联字色（ADR-13）
                color: "#1a66c2",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              data-testid="coupon-copy-btn"
              data-copied={copied ? "true" : "false"}
              onClick={() => void copy()}
            >
              {copied ? "已复制" : "复制"}
            </button>
          </div>
        );
      },
    },
  };
}
