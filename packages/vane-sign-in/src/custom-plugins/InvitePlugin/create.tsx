import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { ACCENT } from "../tokens";
import { invokeCallback } from "../../utils/callback";

export interface InviteConfig {
  /** 自定义按钮文案 */
  text?: string;
}

/**
 * InvitePlugin - 邀请好友助力（操作区）。
 * 触发 ctx.callbacks.invite()，常用于游戏/拉新运营位，邀请好友助力解锁额外奖励。
 */
// 泛型默认值 any：公共契约位（同 types.ts 顶部约定），收紧为 unknown 会让不写 T 的调用方 tsc 失败。
export function createInvitePlugin<T = any>(
  config: InviteConfig = {}
): SignInPlugin<T> {
  const { text = "邀请好友助力" } = config;
  return {
    name: "Invite",
    version: "0.1.0",
    description: doc.description,
    priority: 45,
    enabled: true,
    hooks: {
      renderActions: (ctx: SignInPluginContext<T>) => {
        return (
          <button
            type="button"
            onClick={() => {
              // 包内兜住同步抛错 / Promise reject，避免 unhandled rejection
              void invokeCallback(ctx.callbacks.invite).catch((error) => {
                console.warn("[vane-sign-in] callbacks.invite 执行失败", error);
              });
            }}
            style={{
              border: `1px solid ${ACCENT}`,
              background: "#ffffff",
              color: ACCENT,
              borderRadius: 18,
              padding: "6px 14px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {text}
          </button>
        );
      },
    },
  };
}

createInvitePlugin.meta = doc as PluginDoc;
