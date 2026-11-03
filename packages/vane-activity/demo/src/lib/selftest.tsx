import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { ActivityCore, withPlugins } from "../../../src";
import { createTaskListPlugin } from "../../../src/custom-plugins/TaskListPlugin";
import { createProgressFxPlugin } from "../../../src/custom-plugins/ProgressFxPlugin";
import { createRewardClaimPlugin } from "../../../src/custom-plugins/RewardClaimPlugin";
import { createRuleExpandPlugin } from "../../../src/custom-plugins/RuleExpandPlugin";
import { createClaimToastPlugin } from "../../../src/custom-plugins/ClaimToastPlugin";
import { createTaskTabsPlugin } from "../../../src/custom-plugins/TaskTabsPlugin";
import { createCheckinCalendarPlugin } from "../../../src/custom-plugins/CheckinCalendarPlugin";
import { createJackpotPlugin } from "../../../src/custom-plugins/JackpotPlugin";
import { createRedeemCodePlugin } from "../../../src/custom-plugins/RedeemCodePlugin";
import type { ActivityData } from "../../../src";
import { sampleActivity, fullActivity } from "../data/activity";
import { auditActivity } from "./audit-activity";

/**
 * 浏览器内自测（?selftest=1）
 *
 * 为什么需要它：本仓库的浏览器工具链（截图 / DOM 快照）在部分环境下不可用，
 * 靠肉眼看截图也验不出「点击领取到底有没有调 onClaim」「规则折叠 aria 是否真的翻」。
 * 这里把断言搬进真实浏览器：挂载真实组件 → 派发真实点击 → 读真实 DOM，
 * 结果写进 document.title 供外部读取（SELFTEST OK n/n / SELFTEST FAIL ...）。
 */

/** 装配好的活动组件（4 个官方插件全装），模块级创建一次即可 */
const Activity = withPlugins(ActivityCore, [
  createTaskListPlugin(),
  createProgressFxPlugin(),
  createRewardClaimPlugin(),
  createRuleExpandPlugin(),
]);

/** 带领取轻提示的装配（ClaimToastPlugin 用例专用） */
const ToastActivity = withPlugins(ActivityCore, [
  createTaskListPlugin(),
  createRewardClaimPlugin(),
  createClaimToastPlugin({ durationMs: 8000 }),
]);

function Harness({
  data,
  onTaskAction,
  onClaim,
}: {
  data: ActivityData;
  onTaskAction?: (id: string) => void;
  onClaim?: (id: string) => void;
}) {
  return <Activity data={data} onTaskAction={onTaskAction} onClaim={onClaim} />;
}

function ToastHarness({ data, onClaim }: { data: ActivityData; onClaim?: (id: string) => void }) {
  return <ToastActivity data={data} onClaim={onClaim} />;
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

type Mounted = {
  host: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
  q: (sel: string) => HTMLElement | null;
  qa: (sel: string) => HTMLElement[];
  /** 根内全部可见文本（断言文案用） */
  text: () => string;
  clickEl: (el: HTMLElement) => Promise<void>;
};

async function mount(ui: React.ReactElement): Promise<Mounted> {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:0;top:0;width:420px;background:#fff";
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  await tick();
  return {
    host,
    root,
    q: (sel) => host.querySelector<HTMLElement>(sel),
    qa: (sel) => Array.from(host.querySelectorAll<HTMLElement>(sel)),
    text: () => host.textContent ?? "",
    clickEl: async (el) => {
      flushSync(() => el.click());
      await tick();
    },
  };
}

/** 在某个根内按选择器 + 文本定位第一个元素 */
function byText(root: HTMLElement | null, sel: string, text: string): HTMLElement | null {
  if (!root) return null;
  return (
    Array.from(root.querySelectorAll<HTMLElement>(sel)).find((el) =>
      (el.textContent ?? "").includes(text)
    ) ?? null
  );
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

  // ---- 1. 渲染 / 进度 / 几何 ----
  {
    const taskActions: string[] = [];
    const claims: string[] = [];
    const t = await mount(
      <Harness
        data={sampleActivity}
        onTaskAction={(id) => taskActions.push(id)}
        onClaim={(id) => claims.push(id)}
      />
    );
    const root = t.q(".vc-activity");
    ok("渲染：活动根节点 .vc-activity 存在", !!root);
    ok("渲染：任务卡片 = 3", t.qa('[data-testid="activity-task"]').length === 3);
    ok("渲染：奖励卡片 = 3", t.qa('[data-testid="activity-reward"]').length === 3);
    ok("进度：显示 53%（sampleActivity 加权）", (root?.textContent ?? "").includes("53%"));
    ok("几何体检：无叠卡/溢出/零尺寸", auditActivity(root).problems.length === 0);

    // ---- 2. 任务动作：点击 t2「去浏览」触发 onTaskAction('t2') ----
    const t2 = byText(root, '[data-testid="activity-task"]', "浏览会场");
    const t2btn = t2?.querySelector("button") ?? null;
    ok("任务：存在 t2 浏览任务卡片", !!t2);
    ok("任务：t2 渲染动作按钮", !!t2btn);
    if (t2btn) await t.clickEl(t2btn);
    ok("任务：点击「去浏览」触发 onTaskAction('t2')", taskActions.includes("t2"));

    // ---- 3. 奖励领取：r1 claimable 可点；r3 未解锁禁用 ----
    const r1 = byText(root, '[data-testid="activity-reward"]', "5 元无门槛券");
    const r1btn = r1?.querySelector("button") as HTMLButtonElement | null;
    ok("奖励：r1(5元券) 渲染领取按钮", !!r1btn);
    ok("奖励：r1 按钮可点（claimable）", !!r1btn && !r1btn.disabled);
    if (r1btn) await t.clickEl(r1btn);
    ok("奖励：点击「领取」触发 onClaim('r1')", claims.includes("r1"));

    const r3 = byText(root, '[data-testid="activity-reward"]', "终极大礼包");
    const r3btn = r3?.querySelector("button") as HTMLButtonElement | null;
    ok("奖励：r3(阈值1) 未解锁且禁用", !!r3btn && r3btn.disabled);

    // ---- 4. 规则折叠：aria-expanded 切换 ----
    const ruleBtn = t
      .qa("button")
      .find((b) => (b.textContent ?? "").includes("活动规则"));
    ok("规则：渲染「活动规则」按钮", !!ruleBtn);
    ok("规则：初始 aria-expanded=false", ruleBtn?.getAttribute("aria-expanded") === "false");
    if (ruleBtn) await t.clickEl(ruleBtn);
    ok("规则：点击后 aria-expanded=true", ruleBtn?.getAttribute("aria-expanded") === "true");

    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 5. 全完成：触发 100% 庆祝浮层 ----
  {
    const f = await mount(<Harness data={fullActivity} />);
    const froot = f.q(".vc-activity");
    ok("全完成：进度显示 100%", (froot?.textContent ?? "").includes("100%"));
    ok(
      "全完成：触发「进度达成 100%」庆祝浮层",
      (froot?.textContent ?? "").includes("进度达成 100%")
    );
    flushSync(() => f.root.unmount());
    f.host.remove();
  }

  // ---- 6. ClaimToastPlugin：领取后浮出轻提示（新会话新增领取才弹） ----
  {
    const claims: string[] = [];
    const t = await mount(
      <ToastHarness data={sampleActivity} onClaim={(id) => claims.push(id)} />
    );
    const root = t.q(".vc-activity");
    const r1 = byText(root, '[data-testid="activity-reward"]', "5 元无门槛券");
    const r1btn = r1?.querySelector("button") as HTMLButtonElement | null;
    ok("toast：领取前浮层为空（首屏不补弹）", (root?.textContent ?? "").includes("已领取：") === false);
    if (r1btn) await t.clickEl(r1btn);
    ok("toast：点击领取触发 onClaim('r1')", claims.includes("r1"));
    ok(
      "toast：领取后浮出「已领取：5 元无门槛券」",
      (root?.textContent ?? "").includes("已领取：5 元无门槛券")
    );
    ok("toast：role=status 可被读屏播报", t.qa('[role="status"]').length > 0);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 7. 第三批插件：TaskTabs / CheckinCalendar / Jackpot / RedeemCode ----
  {
    // 7a. TaskTabs：页签渲染 + 切换过滤（sampleActivity 自带 taskGroups / task.group）
    const TabsActivity = withPlugins(ActivityCore, [createTaskTabsPlugin()]);
    const t = await mount(<TabsActivity data={sampleActivity} />);
    ok("tabs：渲染 3 个分组页签", t.qa('[data-testid="task-tab"]').length === 3);
    ok(
      "tabs：默认页签（每日）只显示本组任务",
      t.qa('[data-testid="activity-task"]').every((el) => (el.textContent ?? "").includes("每日签到"))
    );
    await t.clickEl(t.qa('[data-testid="task-tab"]')[1]);
    ok(
      "tabs：切到「成长」后显示浏览任务",
      (t.qa('[data-testid="activity-task"]')[0]?.textContent ?? "").includes("浏览会场")
    );
    flushSync(() => t.root.unmount());
    t.host.remove();

    // 7b. CheckinCalendar：连续天数 + 乐观签到
    const CheckinActivity = withPlugins(ActivityCore, [createCheckinCalendarPlugin()]);
    const c = await mount(<CheckinActivity data={sampleActivity} />);
    ok("checkin：初始显示 3/7 天", (c.text() ?? "").includes("3/7 天"));
    const checkinBtn = c.qa("button").find(
      (b): b is HTMLButtonElement => b.textContent === "今日签到"
    );
    ok("checkin：渲染可点的「今日签到」按钮", !!checkinBtn && !checkinBtn.disabled);
    if (checkinBtn) await c.clickEl(checkinBtn);
    ok("checkin：签到后推进到 4/7 天", (c.text() ?? "").includes("4/7 天"));
    flushSync(() => c.root.unmount());
    c.host.remove();

    // 7c. Jackpot：点一次扣次数，抽完禁用
    const JackpotActivity = withPlugins(ActivityCore, [createJackpotPlugin({ times: 1 })]);
    const j = await mount(<JackpotActivity data={sampleActivity} />);
    ok("jackpot：渲染 8 个奖励格", j.qa('[data-testid="jackpot-cell"]').length === 8);
    const drawBtn = j.qa("button").find((b) => b.textContent === "抽一次");
    ok("jackpot：初始剩余 1 次", (j.text() ?? "").includes("剩余 1 次"));
    if (drawBtn) await j.clickEl(drawBtn);
    ok("jackpot：抽一次后剩余 0 次", (j.text() ?? "").includes("剩余 0 次"));
    ok("jackpot：按钮进入「抽取中」态", j.qa("button").some((b) => b.textContent === "抽取中"));
    flushSync(() => j.root.unmount()); // 卸载即清理动画定时器
    j.host.remove();

    // 7d. RedeemCode：三层校验 + 失败回执
    const RedeemActivity = withPlugins(ActivityCore, [
      createRedeemCodePlugin({
        prefix: "VANE",
        minLength: 8,
        onRedeem: (code) => code === "VANE-8888",
      }),
    ]);
    const r = await mount(<RedeemActivity data={sampleActivity} />);
    const input = r.q("input") as HTMLInputElement;
    ok("redeem：渲染兑换码输入框", !!input);
    await r.clickEl(r.qa("button").find((b) => b.textContent === "兑换")!);
    ok("redeem：空值提交提示「请输入兑换码」", (r.text() ?? "").includes("请输入兑换码"));

    const setNativeValue = (el: HTMLInputElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      flushSync(() => {
        setter?.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };
    setNativeValue(input, "VANE-9999");
    await r.clickEl(r.qa("button").find((b) => b.textContent === "兑换")!);
    ok("redeem：错误码提示「兑换码无效或已被使用」", (r.text() ?? "").includes("兑换码无效或已被使用"));

    setNativeValue(input, "vane-8888");
    await r.clickEl(r.qa("button").find((b) => b.textContent === "兑换")!);
    ok("redeem：正确码（小写自动归一）提示兑换成功", (r.text() ?? "").includes("兑换成功"));
    flushSync(() => r.root.unmount());
    r.host.remove();
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
