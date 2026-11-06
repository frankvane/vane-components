import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { TEXT_2 } from "../tokens";
import { invokeCallback } from "../../utils/callback";

export interface ShareConfig {
  /** 自定义按钮文案 */
  text?: string;
}

/**
 * SharePlugin - 分享成就（操作区）。
 * 触发 ctx.callbacks.share()，由消费方决定分享渠道（海报 / 链接 / 卡片）。
 * 纯无状态按钮，归属各平台运营位的社交扩散位。
 */
// 泛型默认值 unknown：T 不参与类型结构（data 恒为 SignInData），默认值不影响调用方。
export function createSharePlugin<T = unknown>(
  config: ShareConfig = {}
): SignInPlugin<T> {
  const { text = "分享成就" } = config;
  return {
    name: "Share",
    version: "0.1.0",
    description: doc.description,
    priority: 43,
    enabled: true,
    hooks: {
      renderActions: (ctx: SignInPluginContext<T>) => {
        return (
          <button
            type="button"
            onClick={() => {
              // 包内兜住同步抛错 / Promise reject，避免 unhandled rejection
              void invokeCallback(ctx.callbacks.share).catch((error) => {
                console.warn("[vane-sign-in] callbacks.share 执行失败", error);
              });
            }}
            style={{
              border: "1px solid #d8d8d8",
              background: "#ffffff",
              color: TEXT_2,
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

createSharePlugin.meta = doc as PluginDoc;
