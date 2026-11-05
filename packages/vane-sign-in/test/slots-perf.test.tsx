import { describe, expect, it, vi } from "vitest";
import React, { useState } from "react";
import type { ReactElement } from "react";
import { SignInCore, withSignInPlugins } from "../src";
import { renderSignInSlot } from "../src/components/SignInPlugin/plugins/slots";
import type {
  SignInPlugin,
  SignInPluginContext,
  SignInData,
} from "../src";
import { mountCard, flush } from "./helpers";

function baseData(): SignInData {
  return {
    todaySigned: false,
    streak: 7,
    maxStreak: 12,
    totalDays: 132,
    points: 3680,
    calendar: [],
    rewards: [],
    makeup: { available: 3, used: 1, max: 3 },
  };
}

function actionPlugin(name: string, priority: number): SignInPlugin {
  return {
    name,
    priority,
    enabled: true,
    hooks: {
      renderActions: () => <span data-plugin={name}>{name}</span>,
    },
  } as SignInPlugin;
}

/**
 * P2-1 · 槽位 key 不再使用 index
 *
 * 旧实现 `key={index}`：插件集排序变化（config.order / priority）时，
 * 带内部状态的插件（Remind / RuleExpand）会因 key 位移被重挂载、状态丢失。
 * 这里直接检查槽产物元素的 key 语义。
 */
describe("P2-1 · 槽位 key 使用插件名而非 index", () => {
  it("key 与插件名绑定，重排后依然一一对应", () => {
    const context = {
      data: baseData(),
      callbacks: {},
    } as unknown as SignInPluginContext;

    const a = actionPlugin("Alpha", 10);
    const b = actionPlugin("Beta", 20);

    // 排序规则 priority 降序：Beta 在前
    const forward = renderSignInSlot([a, b], context, "renderActions");
    expect(
      forward.map((node) => (node as ReactElement | null)?.key)
    ).toEqual(["signin-slot-Beta", "signin-slot-Alpha"]);

    // 调高 Alpha 的优先级导致排序对调：key 跟随插件身份而非数组位置
    // （旧实现 key={index} 两次都会是 ["0", "1"]，重排后状态串位）
    const boosted = actionPlugin("Alpha", 30);
    const reordered = renderSignInSlot([boosted, b], context, "renderActions");
    expect(
      reordered.map((node) => (node as ReactElement | null)?.key)
    ).toEqual(["signin-slot-Alpha", "signin-slot-Beta"]);
  });
});

/**
 * P2-2 · 父级无关重渲染不重跑插件钩子
 *
 * 旧实现的领域 context 每次渲染都造新对象（`extendContext` 依赖整个 props），
 * 父级一次空 setState 就会让五个领域槽全部重跑钩子。
 */
describe("P2-2 · context 身份稳定", () => {
  it("父级无关 setState 不重跑 renderHeader", async () => {
    const renderHeader = vi.fn(() => <div data-testid="header-once">头部</div>);
    const plugin = {
      name: "HeaderProbe",
      priority: 10,
      enabled: true,
      hooks: { renderHeader },
    } as SignInPlugin;

    const Wrapped = withSignInPlugins(SignInCore, [plugin]);
    const data = baseData();
    const callbacks = {};

    function Parent(props: { data: SignInData; callbacks: object }) {
      const [tick, setTick] = useState(0);
      return (
        <div>
          <button
            type="button"
            data-testid="parent-tick"
            onClick={() => setTick((t) => t + 1)}
          >
            父级渲染 {tick}
          </button>
          <Wrapped data={props.data} callbacks={props.callbacks} />
        </div>
      );
    }

    const h = mountCard(Parent as unknown as React.ElementType, {
      data,
      callbacks,
    });

    expect(renderHeader).toHaveBeenCalledTimes(1);
    expect(h.q('[data-testid="header-once"]')).toBeTruthy();

    await h.click('[data-testid="parent-tick"]');
    await h.click('[data-testid="parent-tick"]');
    await flush();

    // 旧实现会随父级每次渲染重跑；现在 slotContext 身份稳定，命中 memo
    expect(renderHeader).toHaveBeenCalledTimes(1);
    expect(h.q('[data-testid="header-once"]')).toBeTruthy();

    h.unmount();
  });
});
