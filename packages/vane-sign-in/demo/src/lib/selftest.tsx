import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { SignInCore, withSignInPlugins } from "../../../src";
import type { SignInCallbacks } from "../../../src";
import { createStreakStatePlugin } from "../../../src/custom-plugins/StreakStatePlugin";
import { createCalendarStripPlugin } from "../../../src/custom-plugins/CalendarStripPlugin";
import { createRewardPreviewPlugin } from "../../../src/custom-plugins/RewardPreviewPlugin";
import { createMakeupSlotPlugin } from "../../../src/custom-plugins/MakeupSlotPlugin";
import { createTodayCheckInPlugin } from "../../../src/custom-plugins/TodayCheckInPlugin";
import { createPointsBalancePlugin } from "../../../src/custom-plugins/PointsBalancePlugin";
import { createStatRowPlugin } from "../../../src/custom-plugins/StatRowPlugin";
import { createLevelBadgePlugin } from "../../../src/custom-plugins/LevelBadgePlugin";
import { createCountdownPlugin } from "../../../src/custom-plugins/CountdownPlugin";
import { createCalendarGridPlugin } from "../../../src/custom-plugins/CalendarGridPlugin";
import { createRewardClaimPlugin } from "../../../src/custom-plugins/RewardClaimPlugin";
import { createMilestonePlugin } from "../../../src/custom-plugins/MilestonePlugin";
import { createSharePlugin } from "../../../src/custom-plugins/SharePlugin";
import { createRemindPlugin } from "../../../src/custom-plugins/RemindPlugin";
import { createInvitePlugin } from "../../../src/custom-plugins/InvitePlugin";
import { createRuleExpandPlugin } from "../../../src/custom-plugins/RuleExpandPlugin";
import { createRewardHistoryPlugin } from "../../../src/custom-plugins/RewardHistoryPlugin";
import { buildSignInData } from "../demos/lib/sampleData";

/**
 * 浏览器内自测（?selftest=1）
 *
 * 与 coupon 同款思路：把断言搬进真实浏览器，挂载真实组件 → 派发真实点击 →
 * 读真实 DOM，结论写进 document.title（无截图环境下的稳定回传通道）。
 */
const Enhanced = withSignInPlugins(SignInCore, [
  createStreakStatePlugin(),
  createCalendarStripPlugin(),
  createRewardPreviewPlugin(),
  createMakeupSlotPlugin(),
  createTodayCheckInPlugin(),
  createPointsBalancePlugin(),
  createStatRowPlugin(),
  createLevelBadgePlugin(),
  createCountdownPlugin(),
  createCalendarGridPlugin(),
  createRewardClaimPlugin(),
  createMilestonePlugin(),
  createSharePlugin(),
  createRemindPlugin(),
  createInvitePlugin(),
  createRuleExpandPlugin(),
  createRewardHistoryPlugin(),
]);

/** 让 React 的被动 effect 跑完 */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

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

/**
 * 几何体检（越界 / 负坐标 / 零尺寸 / 溢出）。
 * happy-dom 等无布局引擎环境里所有 rect 都是 0，直接跳过（checked=0），
 * 把判定权交还给真实浏览器（?selftest=1 跑的就是真布局）。
 */
export function auditSignIn(host: HTMLElement): { checked: number; problems: string[] } {
  const els = Array.from(host.querySelectorAll<HTMLElement>("*"));
  const rects = els.map((e) => ({ e, r: e.getBoundingClientRect() }));
  const anyReal = rects.some((x) => x.r.width > 0 || x.r.height > 0);
  if (!anyReal) return { checked: 0, problems: [] };

  const problems: string[] = [];
  let checked = 0;
  const hr = host.getBoundingClientRect();
  for (const { r } of rects) {
    checked += 1;
    if (r.width < 0 || r.height < 0) problems.push("negative-size");
    if (r.left < -1 || r.top < -1) problems.push("negative-coord");
    if (r.right > hr.right + 1 || r.bottom > hr.bottom + 1) problems.push("overflow");
    if (r.width === 0 || r.height === 0) problems.push("zero-size");
  }
  if (host.scrollHeight > host.clientHeight + 1) problems.push("scroll-overflow");
  return { checked, problems: Array.from(new Set(problems)) };
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
    document.title = `SELFTEST RUNNING ${total}`;
    if (!cond) failed.push(name);
  };

  const spy = { signed: false, claimed: null as number | null, makeup: null as string | null };

  function Demo() {
    const [signed, setSigned] = useState(false);
    const data = buildSignInData(signed);
    const callbacks: SignInCallbacks = {
      sign: () => {
        spy.signed = true;
        setSigned(true);
      },
      claim: (d) => {
        spy.claimed = d;
      },
      makeup: (date) => {
        spy.makeup = date;
      },
      share: () => {},
      remind: () => {},
      invite: () => {},
    };
    return <Enhanced data={data} callbacks={callbacks} containerStyle={{ maxWidth: 480 }} />;
  }

  // ---- 主流程：签到 + 连签 + 补签 + 奖励领取 ----
  {
    const t = await mount(<Demo />);

    ok("根容器渲染 si-root", !!t.q('[data-testid="si-root"]'));
    const streak = t.q('[data-testid="si-streak"]');
    ok("连签数渲染（未签 streak=7）", !!streak && (streak.textContent ?? "").includes("7") && (streak.textContent ?? "").includes("天连签"));

    const btn = t.q('[data-testid="si-checkin-btn"]') as HTMLButtonElement;
    ok("今日签到按钮：未签态存在", !!btn && btn.dataset.signed === "false");
    ok("今日签到按钮：未签文本「立即签到」", (btn?.textContent ?? "") === "立即签到");

    const makeup = t.q('[data-testid="si-makeup-btn"]') as HTMLButtonElement;
    ok("补签入口存在且未禁用", !!makeup && makeup.dataset.disabled === "false" && makeup.disabled === false);
    ok("补签文案含「补签」", (makeup?.textContent ?? "").includes("补签"));

    ok("未达领奖天数时无领取按钮", !t.q('[data-testid="si-claim-btn"]'));

    // 点击签到 → 状态切换到已签
    await t.click('[data-testid="si-checkin-btn"]');
    await waitFor(() => (t.q('[data-testid="si-checkin-btn"]') as HTMLButtonElement)?.dataset.signed === "true");
    const btn2 = t.q('[data-testid="si-checkin-btn"]') as HTMLButtonElement;
    ok("签到后：按钮态 signed=true", btn2?.dataset.signed === "true");
    ok("签到后：按钮禁用", btn2?.disabled === true);
    ok("签到后：文案「今日已签 ✓」", (btn2?.textContent ?? "").includes("今日已签"));

    const streak2 = t.q('[data-testid="si-streak"]');
    ok("签到后：连签数更新为 8", !!streak2 && (streak2.textContent ?? "").includes("8"));
    ok("签到回调被触发", spy.signed === true);

    // 连签到 8 → 第 8 天奖励待领 → 领取按钮出现
    const claim = t.q('[data-testid="si-claim-btn"]') as HTMLButtonElement;
    ok("达标后：出现领取按钮", !!claim && claim.dataset.day === "8");
    if (claim) {
      await t.click('[data-testid="si-claim-btn"]');
      ok("领取回调被触发且 day=8", spy.claimed === 8);
    }

    // 补签点击（day9 仍在补签窗口）
    await t.click('[data-testid="si-makeup-btn"]');
    ok("补签回调被触发且日期=2026-10-09", spy.makeup === "2026-10-09");

    // 几何体检：无布局引擎时自动跳过
    const audit = auditSignIn(t.host);
    ok(
      "几何体检：0 问题（happy-dom 无布局引擎时自动跳过）",
      audit.problems.length === 0 && (audit.checked === 0 || audit.checked >= 2)
    );

    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  return { total, passed: total - failed.length, failed };
}

/** 供 main.tsx 调用：跑完把结论写进 document.title */
export async function runSelfTestToTitle(): Promise<void> {
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
