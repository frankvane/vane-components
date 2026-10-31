import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import {
  createPointsBalancePlugin,
  createStatRowPlugin,
  createLevelBadgePlugin,
  createRewardPreviewPlugin,
  createRuleExpandPlugin,
} from "vane-sign-in/custom-plugins";
import type { ScenarioMeta } from "./types";
import { buildSignInData, buildCallbacks } from "../demos/lib/sampleData";

/**
 * 03 · 会员积分中心
 *
 * 会员中心重在「资产 + 规则透明」。积分余额、统计横排、等级徽章、积分奖励预告、
 * 规则折叠五个插件组合成账户视图。
 */
export const meta: ScenarioMeta = {
  id: "membership",
  title: "会员积分中心",
  group: "账户",
  ref: { label: "会员中心", url: "https://vane.dev/examples/sign-in/membership" },
  pain: "会员中心重在资产与规则透明；碎插件组合成账户视图。",
  plugs: [
    { fn: "createPointsBalancePlugin", why: "积分余额醒目展示" },
    { fn: "createStatRowPlugin", why: "累计天数 / 连签 / 补签次数一横排" },
    { fn: "createLevelBadgePlugin", why: "当前等级与进度" },
    { fn: "createRewardPreviewPlugin", why: "积分可兑奖励预告" },
    { fn: "createRuleExpandPlugin", cfg: "defaultOpen: true", why: "积分规则可折叠展开" },
  ],
  props: ["data={data}", "callbacks={callbacks}"],
  note: "sampleData 已带 level / rules 字段，等级与规则插件直接能渲染。",
};

const Enhanced = withSignInPlugins(SignInCore, [
  createPointsBalancePlugin(),
  createStatRowPlugin(),
  createLevelBadgePlugin(),
  createRewardPreviewPlugin(),
  createRuleExpandPlugin({ defaultOpen: true }),
]);

export default function Stage() {
  const [signed, setSigned] = useState(false);
  const data = buildSignInData(signed);
  const callbacks = buildCallbacks({ sign: () => setSigned(true) });
  return (
    <Enhanced
      data={data}
      callbacks={callbacks}
      containerStyle={{ maxWidth: 460, margin: "0 auto" }}
    />
  );
}
