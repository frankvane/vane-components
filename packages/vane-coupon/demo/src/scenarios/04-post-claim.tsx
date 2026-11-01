import React from "react";
import { createCouponCard } from "vane-coupon";
import {
  createClaimStatePlugin,
  createCopyCodePlugin,
  createDetailLinkPlugin,
  createHistoryPlugin,
} from "vane-coupon/custom-plugins";
import type { ScenarioMeta } from "./types";

/**
 * 04 · 领后核销
 *
 * 领完券的券详情页：已领取态 + 券码复制 + 领取记录 + 使用跳转。
 * CopyCode 只在 claimed 之后展示券码，History 按时间倒序。
 */
export const meta: ScenarioMeta = {
  id: "post-claim",
  title: "领后核销",
  group: "领后核销",
  ref: { label: "会员中心 · 我的券包", url: "https://vane.dev/examples/coupon/post-claim" },
  pain: "领完券用户不知道码在哪、去哪用：券码、记录、跳转三件套把领后动线补全。",
  plugs: [
    {
      fn: "createClaimStatePlugin",
      cfg: "initialPhase: \"claimed\"",
      why: "直接以「已领取」半终态打开，可继续核销为 used",
    },
    { fn: "createCopyCodePlugin", why: "claimed 后展示券码一键复制，onCopied 可接埋点" },
    { fn: "createHistoryPlugin", why: "领取/使用记录倒序展示，最多 3 条可配" },
    { fn: "createDetailLinkPlugin", why: "「去使用」跳转链接，把用户送回商详" },
  ],
  props: ["coupon={coupon}"],
  note: "DetailLink 的 href 必须由业务传入（或经 onDetail 接管），这里演示用占位链接。",
};

const Coupon = createCouponCard([
  createClaimStatePlugin({ initialPhase: "claimed" }),
  createCopyCodePlugin(),
  createHistoryPlugin(),
  createDetailLinkPlugin({ href: "https://vane.dev/examples/coupon/post-claim" }),
]);

export default function Stage() {
  const now = Date.now();
  return (
    <Coupon
      coupon={{
        id: "c-used",
        title: "家电焕新专享券",
        amount: 30,
        threshold: 299,
        code: "VD-2026-88XK",
        validTo: now + 4 * 86_400_000,
        history: [
          { at: now - 2 * 86_400_000, action: "领取成功" },
          { at: now - 2 * 86_400_000 + 60_000, action: "查看使用规则" },
        ],
      }}
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
    />
  );
}
