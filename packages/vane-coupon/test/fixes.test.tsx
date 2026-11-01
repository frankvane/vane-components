import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { CouponCore, createCouponCard } from "../src";
import type {
  CouponCoreRef,
  CouponData,
  CouponEligibility,
  CouponPlugin,
} from "../src";
import { createClaimStatePlugin } from "../src/custom-plugins/ClaimStatePlugin";
import { createProgressPlugin } from "../src/custom-plugins/ProgressPlugin";
import { createQuotaPlugin } from "../src/custom-plugins/QuotaPlugin";
import { createValidityPlugin } from "../src/custom-plugins/ValidityPlugin";
import { createEligibilityPlugin } from "../src/custom-plugins/EligibilityPlugin";
import { createRemindPlugin } from "../src/custom-plugins/RemindPlugin";
import { createCountdownPlugin } from "../src/custom-plugins/CountdownPlugin";
import { createCopyCodePlugin } from "../src/custom-plugins/CopyCodePlugin";
import { createChannelPlugin } from "../src/custom-plugins/ChannelPlugin";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const DAY = 24 * 60 * 60 * 1000;
const base: CouponData = { id: "f1", title: "修复回归券", amount: 10 };

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
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const waitFor = async (cond: () => boolean, tries = 120) => {
  for (let i = 0; i < tries && !cond(); i++) await tick();
};

/** 让相位停在指定值的占位插件（priority 99 先执行） */
const phaseLock = (phase: string): CouponPlugin => ({
  name: `phase-lock-${phase}`,
  version: "0.1.0",
  priority: 99,
  config: {},
  hooks: { onMount: (ctx) => ctx.setState({ phase }) },
});

// ============ CP-P1-1 库存并集口径 ============

describe("CP-P1-1 展示与门控共用库存口径", () => {
  it("claimed=total：进度条「已抢完」，按钮 soldout/disabled 且不发起领取", async () => {
    let claims = 0;
    const Coupon = createCouponCard([
      createProgressPlugin(),
      createClaimStatePlugin({
        claim: async () => {
          claims += 1;
          return { ok: true };
        },
      }),
    ]);
    await mount(
      React.createElement(Coupon, {
        coupon: { ...base, total: 10, claimed: 10 },
      })
    );

    const progress = q('[data-testid="coupon-progress"]') as HTMLElement;
    expect(progress.dataset.soldout).toBe("true");
    expect(progress.textContent).toContain("已抢完");

    const btn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn.dataset.phase).toBe("soldout");
    expect(btn.textContent).toBe("已抢光");
    expect(btn.disabled).toBe(true);

    await click('[data-testid="coupon-claim-btn"]');
    expect(claims).toBe(0);
  });

  it("stock=0（total 未抢完）：按钮同样 soldout，进度条同步标售罄", async () => {
    const Coupon = createCouponCard([
      createProgressPlugin({ stock: 0 }),
      createClaimStatePlugin({ stock: 0 }),
    ]);
    await mount(
      React.createElement(Coupon, { coupon: { ...base, total: 100, claimed: 20 } })
    );
    expect(
      (q('[data-testid="coupon-progress"]') as HTMLElement).dataset.soldout
    ).toBe("true");
    expect(
      (q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement).dataset.phase
    ).toBe("soldout");
  });
});

// ============ CP-P1-2 限领门控 ============

describe("CP-P1-2 限领超限门控", () => {
  it("purchased=quota：按钮「已达限领上限」且禁用，点击不发起领取", async () => {
    let claims = 0;
    const Coupon = createCouponCard([
      createQuotaPlugin({ quota: 2, purchasedCount: 2 }),
      createClaimStatePlugin({
        claim: async () => {
          claims += 1;
          return { ok: true };
        },
      }),
    ]);
    await mount(React.createElement(Coupon, { coupon: base }));

    const btn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn.dataset.gate).toBe("quota-limited");
    expect(btn.textContent).toBe("已达限领上限");
    expect(btn.disabled).toBe(true);

    await click('[data-testid="coupon-claim-btn"]');
    expect(claims).toBe(0);
  });

    it("ClaimState 自身按 coupon.quota / order.purchasedCount 判定为 quota-limited 相位", async () => {
    const Coupon = createCouponCard([
      createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
    ]);
    await mount(
      React.createElement(Coupon, {
        coupon: { ...base, quota: 1 },
        order: { purchasedCount: 1 },
      })
    );
    const btn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn.dataset.phase).toBe("quota-limited");
    expect(btn.textContent).toBe("已达限领上限");
    expect(btn.disabled).toBe(true);
  });
});

// ============ CP-P1-3 过期随时间收敛 ============

describe("CP-P1-3 过期时钟", () => {
  it("页内停留跨过 validTo：定时复查把 validity 与相位收敛为 expired", async () => {
    const validTo = Date.now() + 300;
    const Coupon = createCouponCard([
      createValidityPlugin(),
      createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
    ]);
    await mount(
      React.createElement(Coupon, { coupon: { ...base, validTo } })
    );

    const validity = () => q('[data-testid="coupon-validity"]') as HTMLElement | null;
    const btn = () => q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement | null;
    expect(validity()?.dataset.expired).toBe("false");

    await waitFor(() => validity()?.dataset.expired === "true", 600);
    expect(validity()?.dataset.expired).toBe("true");
    await waitFor(() => btn()?.dataset.phase === "expired");
    expect(btn()?.dataset.phase).toBe("expired");
    expect(btn()?.disabled).toBe(true);
  });

  it("点击时按注入时钟重算：跨过 validTo 后不再发起领取", async () => {
    let clock = Date.now();
    let claims = 0;
    const now = () => clock;
    const validTo = clock + 10 * DAY;
    const Coupon = createCouponCard([
      createClaimStatePlugin({ now, claim: async () => { claims += 1; } }),
    ]);
    await mount(
      React.createElement(Coupon, { coupon: { ...base, validTo } })
    );

    const btn = () => q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn().dataset.phase).toBe("available");

    clock = validTo + 1;
    await click('[data-testid="coupon-claim-btn"]');
    expect(btn().dataset.phase).toBe("expired");
    expect(claims).toBe(0);
  });
});

// ============ CP-P1-5 可用性判定接入领取按钮 ============

describe("CP-P1-5 订单不可用时门控领取", () => {
  it("门槛不足：按钮不可用且不发起领取；EligibilityPlugin 回传原因", async () => {
    let claims = 0;
    const results: CouponEligibility[] = [];
    const Coupon = createCouponCard([
      createEligibilityPlugin({ onEvaluate: (r) => results.push(r) }),
      createClaimStatePlugin({
        claim: async () => {
          claims += 1;
          return { ok: true };
        },
      }),
    ]);
    await mount(
      React.createElement(Coupon, {
        coupon: { ...base, threshold: 100 },
        order: { amount: 50 },
      })
    );

    const btn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(btn.dataset.eligible).toBe("false");
    expect(btn.textContent).toBe("不可用");
    expect(btn.disabled).toBe(true);
    expect(results[0]?.reasons).toContain("threshold");
    expect(results[0]?.thresholdGap).toBe(50);

    await click('[data-testid="coupon-claim-btn"]');
    expect(claims).toBe(0);
  });

    it("门槛刚好满足 / 商品范围未命中分别放行与拦截", async () => {
    const Coupon = createCouponCard([
      createEligibilityPlugin(),
      createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
    ]);

    await mount(
      React.createElement(Coupon, {
        coupon: { ...base, threshold: 100 },
        order: { amount: 100 },
      })
    );
    const okBtn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(okBtn.dataset.eligible).toBe("true");
    expect(okBtn.disabled).toBe(false);

    if (root) act(() => root!.unmount());
    container!.remove();

    await mount(
      React.createElement(Coupon, {
        coupon: { ...base, threshold: 0, scope: { excludeSku: ["X"] } },
        order: { items: [{ sku: "X", amount: 100 }] },
      })
    );
    const blocked = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    expect(blocked.dataset.eligible).toBe("false");
    expect(blocked.disabled).toBe(true);
  });
});

// ============ CP-P2-1 重入锁 ============

describe("CP-P2-1 领取重入锁", () => {
  it("同一事件循环内连点两次只发起一次领取", async () => {
    let claims = 0;
    const Coupon = createCouponCard([
      createClaimStatePlugin({
        claim: async () => {
          claims += 1;
          return { ok: true };
        },
      }),
    ]);
    await mount(React.createElement(Coupon, { coupon: base }));

    const btn = q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    await act(async () => {
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(claims).toBe(1);
  });
});

// ============ CP-P2-2 开抢提醒渲染条件 ============

describe("CP-P2-2 Remind 渲染条件", () => {
  it("倒计时进行中（相位仍是 available）也能渲染提醒", async () => {
    const reminded: boolean[] = [];
    const Coupon = createCouponCard([
      createCountdownPlugin({ startAt: Date.now() + 5000, tickMs: 50 }),
      createRemindPlugin({ onRemind: (on) => reminded.push(on) }),
    ]);
    await mount(React.createElement(Coupon, { coupon: base }));

    await waitFor(() => !!q('[data-testid="coupon-remind-btn"]'));
    const btn = q('[data-testid="coupon-remind-btn"]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.dataset.on).toBe("false");

    await click('[data-testid="coupon-remind-btn"]');
    await waitFor(() => (q('[data-testid="coupon-remind-btn"]') as HTMLButtonElement)?.dataset.on === "true");
    expect(reminded).toEqual([true]);
  });

  it("validity.notStarted 时也渲染提醒", async () => {
    const Coupon = createCouponCard([
      createValidityPlugin(),
      createRemindPlugin(),
    ]);
    const now = Date.now();
    await mount(
      React.createElement(Coupon, {
        coupon: { ...base, validFrom: now + DAY, validTo: now + 10 * DAY },
      })
    );
    expect(q('[data-testid="coupon-remind-btn"]')).toBeTruthy();
  });
});

// ============ CP-P2-3 面额 / 门槛兜底 ============

describe("CP-P2-3 面额门槛展示兜底", () => {
  it("NaN 面额显示「—」并标记 invalid；NaN 门槛标记 invalid", async () => {
    await mount(
      React.createElement(CouponCore, {
        coupon: { ...base, amount: Number.NaN, threshold: Number.NaN },
      })
    );
    const amount = q('[data-testid="coupon-amount"]') as HTMLElement;
    expect(amount.dataset.invalid).toBe("true");
    expect(amount.textContent).toContain("—");
    const threshold = q('[data-testid="coupon-threshold"]') as HTMLElement;
    expect(threshold.dataset.state).toBe("invalid");
    expect(threshold.textContent).toBe("门槛待确认");
  });
});

// ============ CP-P2-4 插槽 memo ============

describe("CP-P2-4 无关重渲染不重跑渲染钩子", () => {
  it("父组件重渲染（券数据不变）不重复调用 renderHeader", async () => {
    let renders = 0;
    const spy: CouponPlugin = {
      name: "render-spy",
      version: "0.1.0",
      priority: 50,
      config: {},
      hooks: {
        renderHeader: () => {
          renders += 1;
          return React.createElement("span", { "data-testid": "spy" });
        },
      },
    };
    const Coupon = createCouponCard([spy]);

    function App() {
      const [, setN] = useState(0);
      return React.createElement(
        "div",
        null,
        React.createElement(
          "button",
          { "data-testid": "bump", onClick: () => setN((n) => n + 1) },
          "bump"
        ),
        React.createElement(Coupon, { coupon: base })
      );
    }

    await mount(React.createElement(App));
    const before = renders;
    expect(q('[data-testid="spy"]')).toBeTruthy();

    await click('[data-testid="bump"]');
    expect(renders).toBe(before);
  });
});

// ============ CP-P2-5 onPropsChange 浅比较 ============

describe("CP-P2-5 同内容新对象不触发 onPropsChange", () => {
  it("父组件每次新建 coupon 对象（内容相同）不跑插件链", async () => {
    let changes = 0;
    const spy: CouponPlugin = {
      name: "props-spy",
      version: "0.1.0",
      priority: 50,
      config: {},
      hooks: {
        onPropsChange: () => {
          changes += 1;
        },
      },
    };
    const Coupon = createCouponCard([spy]);

    function App() {
      const [, setN] = useState(0);
      return React.createElement(
        "div",
        null,
        React.createElement(
          "button",
          { "data-testid": "bump", onClick: () => setN((n) => n + 1) },
          "bump"
        ),
        React.createElement(Coupon, { coupon: { ...base } })
      );
    }

    await mount(React.createElement(App));
    expect(changes).toBe(0);

    await click('[data-testid="bump"]');
    await act(async () => {
      await Promise.resolve();
    });
    expect(changes).toBe(0);
  });
});

// ============ CP-P2-6 useImperativeHandle 依赖 ============

describe("CP-P2-6 容器 ref 切换后句柄刷新", () => {
  it("containerRefExternal 变化后 getContainer 返回新节点", async () => {
    const refA = React.createRef<HTMLDivElement>();
    const refB = React.createRef<HTMLDivElement>();
    const handle = React.createRef<CouponCoreRef>();

    await mount(
      React.createElement(CouponCore, {
        ref: handle,
        coupon: base,
        containerRefExternal: refA,
      })
    );
    const first = handle.current!.getContainer();
    expect(first).toBe(q('[data-testid="coupon-root"]'));

    await act(async () => {
      root!.render(
        React.createElement(CouponCore, {
          ref: handle,
          coupon: base,
          containerRefExternal: refB,
        })
      );
    });
    expect(refA.current).toBeNull();
    expect(handle.current!.getContainer()).not.toBeNull();
    expect(handle.current!.getContainer()).toBe(refB.current);
  });
});

// ============ CP-P2-7 复制失败提示 ============

describe("CP-P2-7 复制兜底失败上报", () => {
  it("clipboard 与 execCommand 都失败时触发 onError，不误报成功", async () => {
    const reasons: Array<string | undefined> = [];
    const originalClipboard = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard"
    );
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    const originalExec = (document as any).execCommand;
    (document as any).execCommand = () => false;

    try {
      const Coupon = createCouponCard([
        createCopyCodePlugin({
          code: "SAVE-X",
          onError: (reason) => reasons.push(reason),
        }),
        phaseLock("claimed"),
      ]);
      await mount(React.createElement(Coupon, { coupon: base }));
      await click('[data-testid="coupon-copy-btn"]');

      expect(q('[data-testid="coupon-copy-btn"]')!.textContent).toBe("复制");
      expect(reasons).toEqual(["clipboard-unavailable"]);
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, "clipboard", originalClipboard);
      } else {
        delete (navigator as any).clipboard;
      }
      (document as any).execCommand = originalExec;
    }
  });
});

// ============ CP-P2-8 Channel 重复标签 ============

describe("CP-P2-8 渠道标签重复不触发 key 警告", () => {
  it("重复渠道标签全部渲染且无 duplicate key 警告", async () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(" "));
    };
    try {
      const Coupon = createCouponCard([createChannelPlugin()]);
      await mount(
        React.createElement(Coupon, {
          coupon: { ...base, channels: ["仅 APP", "仅 APP"] },
        })
      );
      expect(qq('[data-testid="coupon-channel-badge"]').length).toBe(2);
      expect(errors.some((msg) => msg.includes("same key"))).toBe(false);
    } finally {
      console.error = originalError;
    }
  });
});
