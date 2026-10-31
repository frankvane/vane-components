import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createRuleExpandPlugin } from "vane-sign-in/custom-plugins/RuleExpandPlugin";
import type { DemoMeta } from "./types";
import { buildSignInData, buildCallbacks } from "./lib/sampleData";

/**
 * 16 · 规则折叠 RuleExpand
 * 单装这一个插件：底部区把 data.rules 折叠为可展开列表，长规则不常驻。
 */
export const meta: DemoMeta = {
  slug: "rule-expand",
  title: "规则折叠 RuleExpand",
  group: "plugin",
  intro: "底部区规则折叠：data.rules 收进可展开列表，点击展开/收起，避免长文案常驻占用空间。",
};

const Enhanced = withSignInPlugins(SignInCore, [createRuleExpandPlugin()]);

export default function Stage() {
  const [signed, setSigned] = useState(false);
  const data = buildSignInData(signed);
  const callbacks = buildCallbacks({ sign: () => setSigned(true) });
  return (
    <Enhanced
      data={data}
      callbacks={callbacks}
      containerStyle={{ maxWidth: 480, margin: "0 auto" }}
    />
  );
}
