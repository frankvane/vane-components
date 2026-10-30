import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { CouponCore, createCouponCard } from "../../../src";
import type { CouponData } from "../../../src";
import { createClaimStatePlugin } from "../../../src/custom-plugins/ClaimStatePlugin";
import { createValidityPlugin } from "../../../src/custom-plugins/ValidityPlugin";
import { createRuleExpandPlugin } from "../../../src/custom-plugins/RuleExpandPlugin";
import { createStackPlugin } from "../../../src/custom-plugins/StackPlugin";
import { createProgressPlugin } from "../../../src/custom-plugins/ProgressPlugin";
import { createQuotaPlugin } from "../../../src/custom-plugins/QuotaPlugin";
import { createCopyCodePlugin } from "../../../src/custom-plugins/CopyCodePlugin";
import { createCountdownPlugin } from "../../../src/custom-plugins/CountdownPlugin";
import { auditCoupon } from "./audit-coupon";

/**
 * 浏览器内自测（?selftest=1）
 *
 * 本仓库浏览器工具链（截图 / DOM 快照）在部分环境不可用，靠肉眼也验不出
 * 「状态机是否真的降级了」。把断言搬进真实浏览器：挂载真实组件 → 派发真实点击
 * → 读真实 DOM，结果写进 document.title 供外部读取。
 */
const DAY = 24 * 60 * 60 * 1000;

const baseCoupon: CouponData = {
  id: "st",
  title: "自测券",
  amount: 10,
  threshold: 99,
};

const CouponBare = createCouponCard([]);
const CouponClaim = createCouponCard([
  createClaimStatePlugin({
    claim: async () => ({ ok: true }),
  }),
]);
const CouponClaimFail = createCouponCard([
  createClaimStatePlugin({
    claim: async () => ({ ok: false, reason: "超出限领" }),
  }),
]);
const CouponSoldout = createCouponCard([createClaimStatePlugin({ stock: 0 })]);
const CouponValidity = createCouponCard([
  createValidityPlugin({ urgentDays: 3 }),
  createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
]);
const CouponRules = createCouponCard([createRuleExpandPlugin()]);
const CouponStack = createCouponCard([
  createStackPlugin({ showWhenNotStackable: true }),
]);
const CouponFull = createCouponCard([
  createStackPlugin({ showWhenNotStackable: true }),
  createValidityPlugin({ urgentDays: 3 }),
  createRuleExpandPlugin(),
  createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
]);
const CouponProgress = createCouponCard([createProgressPlugin({ urgentPct: 30 })]);
const CouponQuota = createCouponCard([createQuotaPlugin({ quota: 2, purchasedCount: 2 })]);
const CouponCopyCode = createCouponCard([
  createCopyCodePlugin({ code: "ST-2026" }),
  createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
]);

/** 让 React 的被动 effect（useEffect）跑完 —— flushSync 只刷渲染，不刷 effect */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * 轮询等条件成立（链式 effect 的深度随环境浮动，固定 tick 数在 happy-dom 里会抖）。
 * 条件一直不成立就超时放行，让后面的断言给出可读的失败信息。
 */
const waitFor = async (cond: () => boolean, tries = 60) => {
  for (let i = 0; i < tries && !cond(); i++) await tick();
};

async function mount(ui: React.ReactElement) {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:0;top:0;width:420px;background:#fff";
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  await tick();
  return {
    host,
    root,
    q: (sel: string) => host.querySelector(sel) as HTMLElement | null,
    qq: (sel: string) => host.querySelectorAll(sel),
    click: async (sel: string) => {
      const el = host.querySelector(sel) as HTMLElement | null;
      if (!el) throw new Error(`找不到元素 ${sel}`);
      flushSync(() => el.click());
      await tick();
    },
  };
}

export interface SelfTestResult {
  total: number;
  passed: number;
  failed: string[];
}

export async function runSelfTest(): Promise<SelfTestResult> {
  const failed: string[] = [];
  let total = 0;
  const ok = (name: string, cond: boolean) => {
    total += 1;
    // 同步写入计数：卡住时能看出停在第几项
    document.title = `SELFTEST RUNNING ${total}`;
    if (!cond) failed.push(name);
  };

  // ---- 1. 裸核心 ----
  {
    const t = await mount(<CouponBare coupon={baseCoupon} />);
    ok("裸核心：渲染面额 ¥10", t.q('[data-testid="coupon-amount"]')?.textContent?.includes("10") === true);
    ok("裸核心：门槛文案 满99可用", t.q('[data-testid="coupon-threshold"]')?.textContent === "满99可用");
    ok("裸核心：渲染标题", t.q('[data-testid="coupon-title"]')?.textContent === "自测券");
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 2. 领取状态机：成功流 ----
  {
    const t = await mount(<CouponClaim coupon={baseCoupon} />);
    const btn = () => t.q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    ok("状态机：初始 available", btn()?.dataset.phase === "available");
    await t.click('[data-testid="coupon-claim-btn"]');
    await waitFor(() => btn()?.dataset.phase === "claimed");
    ok("状态机：点击后 claimed（异步 claim 已 resolve）", btn()?.dataset.phase === "claimed");
    ok("状态机：终态按钮禁用", btn()?.disabled === true);
    ok("几何体检：领取卡无越界/重叠", auditCoupon(t.host).problems.length === 0);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 3. 状态机：失败回退 + 抢空 ----
  {
    const t = await mount(<CouponClaimFail coupon={baseCoupon} />);
    await t.click('[data-testid="coupon-claim-btn"]');
    await waitFor(() => (t.q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement)?.dataset.phase === "available");
    ok("状态机：领取失败回退 available", (t.q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement)?.dataset.phase === "available");
    flushSync(() => t.root.unmount());
    t.host.remove();

    const t2 = await mount(<CouponSoldout coupon={baseCoupon} />);
    const btn = t2.q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    ok("状态机：stock=0 挂载即 soldout", btn?.dataset.phase === "soldout");
    ok("状态机：soldout 文案「已抢光」", btn?.textContent === "已抢光");
    flushSync(() => t2.root.unmount());
    t2.host.remove();
  }

  // ---- 4. 有效期 ----
  {
    const NOW = Date.now();
    const t = await mount(
      <CouponValidity
        coupon={{ ...baseCoupon, validFrom: NOW - 10 * DAY, validTo: NOW + 2 * DAY }}
      />
    );
    const validity = t.q('[data-testid="coupon-validity"]') as HTMLElement;
    ok("有效期：紧迫态标记 urgent", validity?.dataset.urgent === "true");
    ok("有效期：紧迫角标「仅剩」", validity?.textContent?.includes("仅剩") === true);
    const btn = t.q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    ok("有效期：未过期仍可领取", btn?.dataset.phase === "available");
    flushSync(() => t.root.unmount());
    t.host.remove();

    const t2 = await mount(<CouponValidity coupon={{ ...baseCoupon, validTo: NOW - DAY }} />);
    // 过期联动是两段链式 effect（validity 写入 → onValidityChange → phase 写入），
    // 等它落地再断言（真实浏览器里瞬时完成）
    const btn2 = t2.q('[data-testid="coupon-claim-btn"]') as HTMLButtonElement;
    await waitFor(() => btn2?.dataset.phase === "expired");
    ok("有效期：过期联动状态机降级 expired", btn2?.dataset.phase === "expired");
    ok("有效期：过期角标「已过期」", t2.q('[data-testid="coupon-validity"]')?.textContent?.includes("已过期") === true);
    flushSync(() => t2.root.unmount());
    t2.host.remove();

    const t3 = await mount(<CouponValidity coupon={{ ...baseCoupon, validDays: 7 }} />);
    const v = t3.q('[data-testid="coupon-validity"]') as HTMLElement;
    ok("有效期：相对模式「领取后 7 天内有效」", v?.textContent?.includes("领取后 7 天内有效") === true);
    await t3.click('[data-testid="coupon-claim-btn"]');
    // 领取 → claimedAt 写入 → 相位 effect → 有效期重算，同样是链式 effect，等重算落地
    const v2 = t3.q('[data-testid="coupon-validity"]') as HTMLElement;
    await waitFor(() => !(v2?.textContent ?? "").includes("领取后"));
    ok("有效期：领取后重算锚定 claimedAt", (v2?.textContent ?? "").includes("领取后") === false);
    flushSync(() => t3.root.unmount());
    t3.host.remove();
  }

  // ---- 5. 规则展开 ----
  {
    const t = await mount(
      <CouponRules coupon={{ ...baseCoupon, rules: ["一", "二", "三", "四", "五"] }} />
    );
    ok("规则：默认折叠 1 条", t.qq('[data-testid^="coupon-rule-"]').length === 1);
    await t.click('[data-testid="coupon-rules-toggle"]');
    ok("规则：展开后 5 条", t.qq('[data-testid^="coupon-rule-"]').length === 5);
    await t.click('[data-testid="coupon-rules-toggle"]');
    ok("规则：收起后 1 条", t.qq('[data-testid^="coupon-rule-"]').length === 1);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 6. 叠加角标 ----
  {
    const t = await mount(<CouponStack coupon={{ ...baseCoupon, stackable: true }} />);
    ok("叠加：stackable=true 显示可叠加", t.q('[data-testid="coupon-stack-badge"]')?.textContent === "可叠加");
    flushSync(() => t.root.unmount());
    t.host.remove();

    const t2 = await mount(<CouponStack coupon={{ ...baseCoupon, stackable: false }} />);
    ok("叠加：false 显示不可叠加灰标", t2.q('[data-testid="coupon-stack-badge"]')?.textContent === "不可叠加");
    flushSync(() => t2.root.unmount());
    t2.host.remove();
  }

  // ---- 7. 四插件合体：槽位顺序 + 几何 ----
  {
    const NOW = Date.now();
    const t = await mount(
      <CouponFull
        coupon={{
          ...baseCoupon,
          amount: 88,
          threshold: 599,
          stackable: true,
          validFrom: NOW - 12 * DAY,
          validTo: NOW + 2 * DAY,
          rules: ["规则 A", "规则 B", "规则 C"],
        }}
      />
    );
    ok("合体：角标渲染", !!t.q('[data-testid="coupon-stack-badge"]'));
    ok("合体：有效期渲染", !!t.q('[data-testid="coupon-validity"]'));
    ok("合体：规则渲染", !!t.q('[data-testid="coupon-rules"]'));
    // after 槽内：有效期（priority 23）应在规则（priority 21）上方
    const validity = t.q('[data-testid="coupon-validity"]');
    const rules = t.q('[data-testid="coupon-rules"]');
    ok(
      "合体：槽内顺序 有效期在规则上方（priority 降序）",
      !!(validity && rules && (validity.compareDocumentPosition(rules) & Node.DOCUMENT_POSITION_FOLLOWING))
    );
    ok("合体：领取按钮渲染", !!t.q('[data-testid="coupon-claim-btn"]'));
    const audit = auditCoupon(t.host);
    ok(
      "合体：几何体检 0 问题（happy-dom 无布局引擎时自动跳过）",
      audit.problems.length === 0 && (audit.checked === 0 || audit.checked >= 2)
    );
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 8. 核心组件直挂（不经 withPlugins） ----
  {
    const t = await mount(<CouponCore coupon={baseCoupon} />);
    ok("裸 CouponCore：直接渲染可用", !!t.q('[data-testid="coupon-title"]'));
    ok(
      "裸 CouponCore：挂载标记存在",
      !!t.q('[data-testid="coupon-mounted"]')
    );
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 9. 扩展插件：进度 / 限领 / 券码 / 倒计时 ----
  {
    // 进度条：常规 + 紧迫
    const t = await mount(
      <CouponProgress coupon={{ ...baseCoupon, total: 100, claimed: 85 }} />
    );
    const p = t.q('[data-testid="coupon-progress"]') as HTMLElement;
    ok("进度：percent 属性 85", p?.dataset.percent === "85");
    ok("进度：紧迫态 urgent=true（urgentPct 30）", p?.dataset.urgent === "true");
    ok("进度：文案含 已抢 85% 与 仅剩 15 张", (p?.textContent ?? "").includes("已抢 85%") && (p?.textContent ?? "").includes("仅剩 15 张"));
    flushSync(() => t.root.unmount());
    t.host.remove();

    // 限领：超限红字
    const t2 = await mount(<CouponQuota coupon={baseCoupon} />);
    const qt = t2.q('[data-testid="coupon-quota"]') as HTMLElement;
    ok("限领：reached=true", qt?.dataset.reached === "true");
    ok("限领：文案「已达限领上限」", (qt?.textContent ?? "").includes("已达限领上限"));
    flushSync(() => t2.root.unmount());
    t2.host.remove();

    // 券码：领取后出现（available 相位不渲染）
    const t3 = await mount(<CouponCopyCode coupon={baseCoupon} />);
    ok("券码：available 相位不渲染", !t3.q('[data-testid="coupon-code"]'));
    await t3.click('[data-testid="coupon-claim-btn"]');
    await waitFor(() => !!t3.q('[data-testid="coupon-code"]'));
    ok("券码：领取后展示券码 ST-2026", t3.q('[data-testid="coupon-code"]')?.textContent === "ST-2026");
    ok("券码：复制按钮存在", !!t3.q('[data-testid="coupon-copy-btn"]'));
    flushSync(() => t3.root.unmount());
    t3.host.remove();

    // 倒计时：先出「距开抢」，到点 autoStart 降级 available
    // startAt 必须在挂载前一刻取值（模块顶层装配会让 200ms 在跑到本节之前耗尽）
    const CouponCountdown = createCouponCard([
      createCountdownPlugin({ startAt: Date.now() + 200, tickMs: 50, autoStart: true }),
    ]);
    const t4 = await mount(<CouponCountdown coupon={baseCoupon} />);
    const rootEl = () => t4.q('[data-testid="coupon-root"]') as HTMLElement;
    await waitFor(() => !!t4.q('[data-testid="coupon-countdown-value"]'), 150);
    ok("倒计时：渲染「距开抢」", (t4.q('[data-testid="coupon-countdown-value"]')?.textContent ?? "").includes("距开抢"));
    await waitFor(() => rootEl()?.dataset.phase === "available", 150);
    ok("倒计时：到点 autoStart 进入 available", rootEl()?.dataset.phase === "available");
    // phase 先落地、countdown:0 的渲染随后（两次 setState 两个渲染），同样轮询
    await waitFor(() => !t4.q('[data-testid="coupon-countdown-value"]'), 150);
    ok("倒计时：到点后倒计时消失", !t4.q('[data-testid="coupon-countdown-value"]'));
    flushSync(() => t4.root.unmount());
    t4.host.remove();
  }

  return { total, passed: total - failed.length, failed };
}

/** 供 main.tsx 调用：跑完把结论写进 document.title，便于外部（无截图时）读取 */
export async function runSelfTestToTitle(): Promise<void> {
  // 先落一个「已启动」标记：便于区分「根本没跑」与「跑了一半卡住」
  document.title = "SELFTEST RUNNING";
  try {
    const r = await runSelfTest();
    document.title =
      r.failed.length === 0
        ? `SELFTEST OK ${r.passed}/${r.total}`
        : `SELFTEST FAIL ${r.passed}/${r.total} :: ${r.failed.join(" | ")}`;
  } catch (e) {
    document.title = `SELFTEST ERROR :: ${(e as Error).message}`;
  }
}
