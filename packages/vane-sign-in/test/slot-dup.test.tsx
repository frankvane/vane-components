import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SignInCore, withSignInPlugins } from "../src";
import {
  createStreakStatePlugin,
  createLevelBadgePlugin,
  createCalendarStripPlugin,
  createRewardPreviewPlugin,
  createMilestonePlugin,
  createTodayCheckInPlugin,
  createMakeupSlotPlugin,
  createSharePlugin,
  createRuleExpandPlugin,
  createRewardHistoryPlugin,
} from "../src/custom-plugins";
import { buildSignInData, buildCallbacks } from "../demo/src/demos/lib/sampleData";

describe("领域槽不重影", () => {
  it("每个插件内容只渲染一次，且全部落在带 padding 的 .vs-* 包裹层内", () => {
    const Card = withSignInPlugins(SignInCore, [
      createStreakStatePlugin(),
      createLevelBadgePlugin(),
      createCalendarStripPlugin(),
      createRewardPreviewPlugin(),
      createMilestonePlugin(),
      createTodayCheckInPlugin(),
      createMakeupSlotPlugin(),
      createSharePlugin(),
      createRuleExpandPlugin(),
      createRewardHistoryPlugin(),
    ]);
    const html = renderToStaticMarkup(
      React.createElement(Card, {
        data: buildSignInData(),
        callbacks: buildCallbacks(),
      })
    );

    // 五个槽位包裹层都在
    for (const cls of ["vs-header", "vs-calendar", "vs-rewards", "vs-actions", "vs-footer"]) {
      expect(html.includes(`class="${cls}"`), `缺少包裹层 .${cls}`).toBe(true);
    }
    // 关键回归断言：插件内容只出现一次（曾因内核 composeSlots 把
    // renderHeader/renderFooter 再组进 children 而双渲染出裸拷贝）
    expect(html.split("天连签").length - 1, "连签数重影").toBe(1);
    expect(html.split("黄金会员").length - 1, "等级徽章重影").toBe(1);
    expect(html.split("领取记录").length - 1, "领取记录重影").toBe(1);
    expect(html.split("活动规则").length - 1, "活动规则重影").toBe(1);
    // 五个包裹层各只出现一次（不会因为重复渲染多出一组）
    expect(html.split('class="vs-header"').length - 1).toBe(1);
    expect(html.split('class="vs-footer"').length - 1).toBe(1);
  });
});
