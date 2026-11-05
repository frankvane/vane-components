import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import { RedeemForm } from "./internal";
import doc from "./doc.json";

export interface RedeemCodePluginConfig extends ActivityPluginConfigBase {
  /** 卡片标题（默认「兑换码」） */
  title?: string;
  /** 必填前缀（大写比较，如 "VANE"）；不传则不校验前缀 */
  prefix?: string;
  /** 最短长度（默认 8） */
  minLength?: number;
  /** 输入框占位文案 */
  placeholder?: string;
  /** 兑换成功文案（默认「兑换成功，奖励已入账」） */
  successText?: string;
  /** 兑换回调；返回 false（或 Promise<false>）视为无效码；抛错展示失败文案 */
  onRedeem?: (code: string) => boolean | void | Promise<boolean | void>;
}

/**
 * RedeemCodePlugin - 兑换码：输入框 + 本地校验（长度 / 前缀）+ 成功或失败回执。
 *
 * 落在 renderRewards 槽且不声明独占：可与 RewardClaimPlugin 的奖励列表上下叠放
 * （order 定序）。独占去重只发生在「声明了独占的插件之间」，本插件永不被丢弃。
 */
export const createRedeemCodePlugin: PluginCreator<RedeemCodePluginConfig> = (
  config = {}
) => {
  const {
    title = "兑换码",
    prefix,
    minLength = 8,
    placeholder = "如 VANE-8888",
    successText = "兑换成功，奖励已入账",
    onRedeem,
  } = config;

  return {
    name: "RedeemCodePlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 26,
    config,
    hooks: {
      renderRewards: (_context: ActivityPluginContext) => (
        <RedeemForm
          title={title}
          prefix={prefix}
          minLength={minLength}
          placeholder={placeholder}
          successText={successText}
          onRedeem={onRedeem}
        />
      ),
    },
  };
};

createRedeemCodePlugin.meta = doc as PluginDoc;
