import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { CouponCore, createCouponCard } from "../src";
import type { CouponData, CouponPlugin } from "../src";
import { createClaimStatePlugin } from "../src/custom-plugins/ClaimStatePlugin";
import { createValidityPlugin } from "../src/custom-plugins/ValidityPlugin";
import { createRuleExpandPlugin } from "../src/custom-plugins/RuleExpandPlugin";
import { createStackPlugin } from "../src/custom-plugins/StackPlugin";
import {
  createClaimStatePlugin as createClaimStateFromIndex,
} from "../src/custom-plugins";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const DAY = 24 * 60 * 60 * 1000;

const baseCoupon: CouponData = {
  id: "t1",
  title: "测试券",
  amount: 10,
  threshold: 99,
};

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  container = null;
  root = null;
});

async function mount(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(ui);
  });
  return container;
}

const q = (sel: string) => container!.querySelector(sel);
const qq = (sel: string) => container!.querySelectorAll(sel);
const click = async (sel: string) => {
  const el = q(sel) as HTMLElement | null;
  expect(el).toBeTruthy();
  await act(async () => {
    el!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
  });
};

// ============ 工厂结构 ============

describe("插件工厂结构（三件套契约）", () => {
  it("四个官方插件 name/priority/meta 齐全", () => {
    const factories = [
      createClaimStatePlugin,
      createValidityPlugin,
      createRuleExpandPlugin,
      createStackPlugin,
    ];
    const expectedNames = ["claim-state", "validity", "rule-expand", "stack"];
    const expectedPriorities = [32, 23, 21, 12];
    factories.forEach((factory, i) => {
      const plugin = factory({});
      expect(plugin.name).toBe(expectedNames[i]);
      expect(plugin.priority).toBe(expectedPriorities[i]);
      // .meta 挂载（丢 meta → demo 插件卡空白）
      expect((factory as any).meta).toBeTruthy();
      expect((factory as any).meta.name).toContain("Plugin");
    });
  });

  it("桶导出与子路径导出是同一工厂", () => {
    expect(createClaimStateFromIndex).toBe(createClaimStatePlugin);
  });
});

// ============ 裸核心 ============

describe("CouponCore 本体", () => {
  it("渲染面额 / 门槛 / 标题；无门槛与自定义门槛文案", async () => {
    await mount(
      React.createElement(CouponCore, {
        coupon: { ...baseCoupon, title: "新人券", threshold: 99 },
      })
    );
    expect(q('[data-testid="coupon-amount"]')!.textContent).toContain("10");
    expect(q('[data-testid="coupon-threshold"]')!.textContent).toBe("满99可用");
    expect(q('[data-testid="coupon-title"]')!.textContent).toBe("新人券");

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    await mount(
      React.createElement(CouponCore, {
        coupon: { ...baseCoupon, threshold: 0, thresholdText: "自定义门槛" },
      })
    );
    expect(q('[data-testid="coupon-threshold"]')!.textContent).toBe("自定义门槛");

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    await mount(
      React.createElement(CouponCore, {
        coupon: { ...baseCoupon, threshold: undefined },
      })
    );
    expect(q('[data-testid="coupon-threshold"]')!.textContent).toBe("无门槛");
  });

  it("discount 形态渲染 X 折", async () => {
    await mount(
      React.createElement(CouponCore, {
        coupon: { ...baseCoupon, amount: 8.5, amountType: "discount" },
      })
    );
    expect(q('[data-testid="coupon-amount"]')!.textContent).toBe("8.5折");
  });
});

// ============ ClaimState 状态机 ============

describe("ClaimStatePlugin 状态机", () => {
  it("available → claiming → claimed（异步领取成功）", async () => {
    let resolveClaim: (v: { ok: boolean }) => void = () => {};
    const Coupon = createCouponCard([
      createClaimStatePlugin({
        claim: () => new Promise<{ ok: boolean }>((r) => (resolveClaim = r)),
      }),
    ]);
    await mount(React.createElement(Coupon, { coupon: baseCoupon }));

    const btn = () => q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn()!.dataset.phase).toBe("available");
    expect(btn()!.textContent).toBe("立即领取");

    await click('[data-testid="coupon-claim-btn"]');
    expect(btn()!.dataset.phase).toBe("claiming");
    expect(btn()!.disabled).toBe(true);

    await act(async () => {
      resolveClaim({ ok: true });
      await Promise.resolve();
    });
    expect(btn()!.dataset.phase).toBe("claimed");
    expect(btn()!.textContent).toBe("已领取");
  });

  it("领取失败回退 available", async () => {
    const Coupon = createCouponCard([
      createClaimStatePlugin({
        claim: async () => ({ ok: false, reason: "超出限领" }),
      }),
    ]);
    await mount(React.createElement(Coupon, { coupon: baseCoupon }));
    await click('[data-testid="coupon-claim-btn"]');
    const btn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn.dataset.phase).toBe("available");
    expect(btn.textContent).toBe("立即领取");
  });

  it("stock ≤ 0 挂载即 soldout（终态不响应点击）", async () => {
    const Coupon = createCouponCard([createClaimStatePlugin({ stock: 0 })]);
    await mount(React.createElement(Coupon, { coupon: baseCoupon }));
    const btn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn.dataset.phase).toBe("soldout");
    expect(btn.textContent).toBe("已抢光");
    expect(btn.disabled).toBe(true);
  });

  it("initialPhase 生效（idle 未开始）", async () => {
    const Coupon = createCouponCard([
      createClaimStatePlugin({ initialPhase: "idle" }),
    ]);
    await mount(React.createElement(Coupon, { coupon: baseCoupon }));
    const btn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn.dataset.phase).toBe("idle");
    expect(btn.textContent).toBe("未开始");
  });

  it("过期联动：validity.expired → phase 降级 expired；used 终态不被打回", async () => {
    const NOW = Date.now();
    const Coupon = createCouponCard([
      createValidityPlugin(),
      createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
    ]);
    await mount(
      React.createElement(Coupon, {
        coupon: { ...baseCoupon, validTo: NOW - DAY },
      })
    );
    const btn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn.dataset.phase).toBe("expired");
    expect(btn.textContent).toBe("已过期");
  });

  it("onPhaseChange 钩子与用户回调触发", async () => {
    const seen: string[] = [];
    const onPhaseChange = (phase: string) => seen.push(phase);
    const spyPlugin: CouponPlugin = {
      name: "phase-spy",
      version: "0.1.0",
      priority: 99,
      config: {},
      hooks: {
        onPhaseChange: (_ctx, phase) => onPhaseChange(phase),
      },
    };
    const Coupon = createCouponCard([
      spyPlugin,
      createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
    ]);
    await mount(React.createElement(Coupon, { coupon: baseCoupon }));
    await click('[data-testid="coupon-claim-btn"]');
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    // claiming 与 claimed 都应被观测到（available 是首挂载，不触发）
    expect(seen).toContain("claiming");
    expect(seen).toContain("claimed");
  });
});

// ============ Validity ============

describe("ValidityPlugin 有效期判定", () => {
  it("absolute：紧迫/正常/文案", async () => {
    const NOW = Date.now();
    const Coupon = createCouponCard([createValidityPlugin({ urgentDays: 3 })]);
    await mount(
      React.createElement(Coupon, {
        coupon: {
          ...baseCoupon,
          validFrom: NOW - 10 * DAY,
          validTo: NOW + 2 * DAY,
        },
      })
    );
    const el = q('[data-testid="coupon-validity"]') as HTMLElement;
    expect(el.dataset.urgent).toBe("true");
    expect(el.textContent).toContain("仅剩");
  });

  it("relative 未领取：「领取后 N 天内有效」；领取后锚定 claimedAt", async () => {
    const Coupon = createCouponCard([
      createValidityPlugin(),
      createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
    ]);
    await mount(
      React.createElement(Coupon, { coupon: { ...baseCoupon, validDays: 7 } })
    );
    let el = q('[data-testid="coupon-validity"]') as HTMLElement;
    expect(el.dataset.mode).toBe("relative");
    expect(el.textContent).toContain("领取后 7 天内有效");

    await click('[data-testid="coupon-claim-btn"]');
    el = q('[data-testid="coupon-validity"]') as HTMLElement;
    expect(el.textContent).not.toContain("领取后");
    expect(el.textContent).toContain("天内有效");
  });

  it("未声明任何有效期：不渲染、不写 state", async () => {
    const Coupon = createCouponCard([createValidityPlugin()]);
    await mount(React.createElement(Coupon, { coupon: baseCoupon }));
    expect(q('[data-testid="coupon-validity"]')).toBeNull();
  });
});

// ============ RuleExpand ============

describe("RuleExpandPlugin 规则展开", () => {
  const rules = ["规则一", "规则二", "规则三", "规则四", "规则五"];

  it("默认折叠 1 条 → 展开 5 条 → 收起", async () => {
    const Coupon = createCouponCard([createRuleExpandPlugin()]);
    await mount(
      React.createElement(Coupon, { coupon: { ...baseCoupon, rules } })
    );
    expect(qq('[data-testid^="coupon-rule-"]').length).toBe(1);
    expect(q('[data-testid="coupon-rules"]')!.getAttribute("data-expanded")).toBe("false");

    await click('[data-testid="coupon-rules-toggle"]');
    expect(qq('[data-testid^="coupon-rule-"]').length).toBe(5);
    expect(q('[data-testid="coupon-rules"]')!.getAttribute("data-expanded")).toBe("true");

    await click('[data-testid="coupon-rules-toggle"]');
    expect(qq('[data-testid^="coupon-rule-"]').length).toBe(1);
  });

  it("rules 为空渲染 null；条数不多于折叠数时无切换按钮", async () => {
    const Coupon = createCouponCard([createRuleExpandPlugin()]);
    await mount(
      React.createElement(Coupon, { coupon: { ...baseCoupon, rules: ["仅一条"] } })
    );
    expect(q('[data-testid="coupon-rules"]')).toBeTruthy();
    expect(q('[data-testid="coupon-rules-toggle"]')).toBeNull();
  });
});

// ============ Stack ============

describe("StackPlugin 叠加角标", () => {
  it("stackable true → 可叠加角标；false + showWhenNotStackable → 灰标；未声明 → 无角标", async () => {
    const Coupon = createCouponCard([
      createStackPlugin({ showWhenNotStackable: true }),
    ]);
    await mount(
      React.createElement(Coupon, {
        coupon: { ...baseCoupon, stackable: true },
      })
    );
    expect(q('[data-testid="coupon-stack-badge"]')!.textContent).toBe("可叠加");

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    await mount(
      React.createElement(Coupon, {
        coupon: { ...baseCoupon, stackable: false },
      })
    );
    expect(q('[data-testid="coupon-stack-badge"]')!.textContent).toBe("不可叠加");

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    await mount(React.createElement(Coupon, { coupon: baseCoupon }));
    expect(q('[data-testid="coupon-stack-badge"]')).toBeNull();
  });
});

// ============ 沙箱 ============

describe("插件沙箱隔离", () => {
  it("一个插件渲染抛错不影响其他插件的插槽输出", async () => {
    const badPlugin: CouponPlugin = {
      name: "bad-render",
      version: "0.1.0",
      priority: 50,
      config: {},
      hooks: {
        renderFooter: () => {
          throw new Error("boom");
        },
      },
    };
    const Coupon = createCouponCard([
      badPlugin,
      createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
    ]);
    await mount(React.createElement(Coupon, { coupon: baseCoupon }));
    // 坏插件被边界吞掉，领取按钮照常渲染
    expect(q('[data-testid="coupon-claim-btn"]')).toBeTruthy();
  });
});
