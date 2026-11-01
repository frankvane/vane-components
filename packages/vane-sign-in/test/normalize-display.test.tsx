import { describe, expect, it } from "vitest";
import { SignInCore, withSignInPlugins, normalizeSignInData } from "../src";
import { createStreakStatePlugin } from "../src/custom-plugins/StreakStatePlugin";
import { createRewardHistoryPlugin } from "../src/custom-plugins/RewardHistoryPlugin";
import { createRewardPreviewPlugin } from "../src/custom-plugins/RewardPreviewPlugin";
import { createRuleExpandPlugin } from "../src/custom-plugins/RuleExpandPlugin";
import { createCalendarStripPlugin } from "../src/custom-plugins/CalendarStripPlugin";
import { createCalendarGridPlugin } from "../src/custom-plugins/CalendarGridPlugin";
import { createCountdownPlugin } from "../src/custom-plugins/CountdownPlugin";
import type { SignInData, DayCell, SignInPlugin } from "../src";
import { mountCard } from "./helpers";

function baseData(over: Partial<SignInData> = {}): SignInData {
  return {
    todaySigned: false,
    streak: 7,
    maxStreak: 12,
    totalDays: 132,
    points: 3680,
    calendar: [],
    rewards: [],
    makeup: { available: 3, used: 1, max: 3 },
    ...over,
  };
}

function cell(over: Partial<DayCell> & { date: string }): DayCell {
  return { day: 1, status: "future", ...over };
}

/**
 * P2-8 · 数据归一
 *
 * 旧实现直接把接口数据塞进插件，字段缺失会渲染出「undefined 天连签」，
 * 或让 `makeup.available` 抛 TypeError 后被槽位边界吞掉（整段入口静默消失）。
 */
describe("P2-8 · normalizeSignInData 兜底", () => {
  it("空/缺字段入参生成完整安全数据", () => {
    const data = normalizeSignInData(undefined);
    expect(data.todaySigned).toBe(false);
    expect(data.streak).toBe(0);
    expect(data.maxStreak).toBe(0);
    expect(data.totalDays).toBe(0);
    expect(data.points).toBe(0);
    expect(data.calendar).toEqual([]);
    expect(data.rewards).toEqual([]);
    expect(data.makeup).toEqual({ available: 0, used: 0, max: 0 });
    expect(data.history).toEqual([]);

    const partial = normalizeSignInData({ todaySigned: true } as SignInData);
    expect(partial.todaySigned).toBe(true);
    expect(partial.calendar).toEqual([]);
  });

  it("非法时区 / 非法日期键被丢弃，合法值保留", () => {
    expect(
      normalizeSignInData({
        businessTimeZone: "Mars/Olympus",
        todayKey: "2026-02-30",
      } as SignInData).businessTimeZone
    ).toBeUndefined();
    expect(
      normalizeSignInData({
        businessTimeZone: "Mars/Olympus",
        todayKey: "2026-02-30",
      } as SignInData).todayKey
    ).toBeUndefined();

    const ok = normalizeSignInData({
      businessTimeZone: "Asia/Shanghai",
      todayKey: "2026-11-01",
    } as SignInData);
    expect(ok.businessTimeZone).toBe("Asia/Shanghai");
    expect(ok.todayKey).toBe("2026-11-01");
  });

  it("日历格 / 奖励 / 规则逐项兜底", () => {
    const data = normalizeSignInData({
      calendar: [
        { date: "2026-13-01", day: 8, status: "signed" },
        { date: 123, day: "x", status: "bogus" },
      ],
      rewards: [{ day: 8, kind: "bogus", label: null }],
      rules: ["规则一", 5],
    } as unknown as SignInData);

    // 非法日期键保留（不丢格），补签筛选会再校验；非法 day 回落 0
    expect(data.calendar[0].date).toBe("2026-13-01");
    expect(data.calendar[0].day).toBe(8);
    expect(data.calendar[0].status).toBe("signed");
    expect(data.calendar[1].date).toBe("");
    expect(data.calendar[1].day).toBe(0);
    expect(data.calendar[1].status).toBe("future");
    expect(data.rewards[0].kind).toBe("points");
    expect(data.rewards[0].label).toBe("");
    expect(data.rules).toEqual(["规则一"]);
  });

  it("缺失字段的真实渲染不出现 undefined / NaN", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createStreakStatePlugin()]);
    const broken = {
      todaySigned: undefined,
      streak: undefined,
      maxStreak: null,
    } as unknown as SignInData;
    const h = mountCard(Wrapped, { data: broken, callbacks: {} });

    const text = h.container.textContent ?? "";
    expect(text).toContain("0天连签");
    expect(text).toContain("最高 0 天");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("NaN");

    h.unmount();
  });
});

/**
 * P1-2 · 领取记录展示走业务日键
 *
 * 旧实现 `new Date(at).toLocaleDateString()`：SSR 与浏览器时区不同会差一天，
 * 且输出格式随 locale 漂移。
 */
describe("P1-2 · 领取记录按业务时区展示 DayKey", () => {
  const at = Date.UTC(2026, 9, 31, 17, 30); // UTC 10-31 / 东八区 11-01

  it("businessTimeZone=UTC 显示 2026-10-31", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createRewardHistoryPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({
        businessTimeZone: "UTC",
        history: [{ id: "h1", day: 7, label: "50 积分", at }],
      }),
      callbacks: {},
    });
    const text = h.container.textContent ?? "";
    expect(text).toContain("2026-10-31");
    expect(text).not.toContain("2026/10/31");
    h.unmount();
  });

  it("businessTimeZone=Asia/Shanghai 显示 2026-11-01", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createRewardHistoryPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({
        businessTimeZone: "Asia/Shanghai",
        history: [{ id: "h1", day: 7, label: "50 积分", at }],
      }),
      callbacks: {},
    });
    expect(h.container.textContent ?? "").toContain("2026-11-01");
    h.unmount();
  });
});

/**
 * P2-9 · 奖励预告排序
 *
 * 旧实现先 slice 后渲染（未排序）：服务端乱序时会把远期奖励挤进前 N 条，
 * 甚至漏掉最近可领的奖励。
 */
describe("P2-9 · 奖励预告按 day 升序后截断", () => {
  it("乱序 rewards 仍先展示最近的天数", () => {
    const Wrapped = withSignInPlugins(SignInCore, [
      createRewardPreviewPlugin({ limit: 2 }),
    ]);
    const h = mountCard(Wrapped, {
      data: baseData({
        streak: 7,
        rewards: [
          { day: 30, kind: "gift", label: "day-30" },
          { day: 8, kind: "points", label: "day-8" },
          { day: 9, kind: "coupon", label: "day-9" },
        ],
      }),
      callbacks: {},
    });
    const text = h.container.textContent ?? "";
    expect(text).toContain("day-8");
    expect(text).toContain("day-9");
    expect(text).not.toContain("day-30");
    h.unmount();
  });
});

/**
 * P2-5 / P2-9 · 规则折叠的 defaultOpen 与 a11y
 */
describe("P2-5 · RuleExpand defaultOpen 与 aria 关联", () => {
  it("defaultOpen 生效，按钮 aria-expanded / aria-controls 正确", async () => {
    const Wrapped = withSignInPlugins(SignInCore, [
      createRuleExpandPlugin({ defaultOpen: true }),
    ]);
    const h = mountCard(Wrapped, {
      data: baseData({ rules: ["每日签到得积分", "连续 7 天额外奖励"] }),
      callbacks: {},
    });
    const toggle = () =>
      h.q('[data-testid="si-rule-toggle"]') as HTMLButtonElement;

    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    const panelId = toggle().getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    // useId 产出的 id 含冒号，不能用 `#id` 选择器，改用属性选择器
    const panel = h.container.querySelector(`[id="${panelId}"]`);
    expect(panel?.tagName).toBe("UL");
    expect(panel?.querySelectorAll("li").length).toBe(2);

    await h.click('[data-testid="si-rule-toggle"]');
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(h.container.querySelector(`[id="${panelId}"]`)).toBeNull();

    h.unmount();
  });

  it("defaultOpen=false 时初始折叠，点击展开", async () => {
    const Wrapped = withSignInPlugins(SignInCore, [createRuleExpandPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({ rules: ["规则一"] }),
      callbacks: {},
    });
    const toggle = () =>
      h.q('[data-testid="si-rule-toggle"]') as HTMLButtonElement;
    expect(toggle().getAttribute("aria-expanded")).toBe("false");

    await h.click('[data-testid="si-rule-toggle"]');
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    expect(h.container.querySelectorAll("li").length).toBe(1);

    h.unmount();
  });
});

/**
 * P2-4 · transformData 钩子必须真实执行
 *
 * 旧实现只在类型里声明 transformData，运行时从未调用，插件的契约是空的。
 */
describe("P2-4 · transformData 钩子链生效", () => {
  it("插件 transformData 返回值参与渲染", () => {
    const probe = {
      name: "TransformProbe",
      priority: 0,
      enabled: true,
      hooks: {
        transformData: (_ctx: unknown, data: SignInData) => ({
          ...data,
          streak: 42,
        }),
      },
    } as unknown as SignInPlugin;

    const Wrapped = withSignInPlugins(SignInCore, [
      probe,
      createStreakStatePlugin(),
    ]);
    const h = mountCard(Wrapped, { data: baseData({ streak: 7 }), callbacks: {} });
    // 旧实现会显示 7；钩子生效后是 42
    expect(h.container.textContent ?? "").toContain("42天连签");
    h.unmount();
  });
});

/**
 * P2-9 · 日历格可读文案（读屏用户能听到状态）
 */
describe("P2-9 · 日历格 aria-label", () => {
  const cells: DayCell[] = [
    cell({ date: "2026-11-01", day: 1, status: "signed", reward: { day: 1, kind: "points", label: "10 积分" } }),
    cell({ date: "2026-11-02", day: 2, status: "today" }),
    cell({ date: "2026-11-03", day: 3, status: "missed", canMakeup: true }),
  ];

  it("CalendarStrip 每格有 role=img 与状态 aria-label", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createCalendarStripPlugin()]);
    const h = mountCard(Wrapped, { data: baseData({ calendar: cells }), callbacks: {} });
    const labels = Array.from(
      h.container.querySelectorAll('[role="img"]')
    ).map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual([
      "2026-11-01 已签到",
      "2026-11-02 今天",
      "2026-11-03 漏签",
    ]);
    h.unmount();
  });

  it("CalendarGrid 复用同一份状态文案", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createCalendarGridPlugin()]);
    const h = mountCard(Wrapped, { data: baseData({ calendar: cells }), callbacks: {} });
    const labels = Array.from(
      h.container.querySelectorAll('[role="img"]')
    ).map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual([
      "2026-11-01 已签到",
      "2026-11-02 今天",
      "2026-11-03 漏签",
    ]);
    h.unmount();
  });

  it("Strip 与 Grid 同一状态取同一份 tokens 配色（P2-7 不漂移）", () => {
    const StripWrapped = withSignInPlugins(SignInCore, [createCalendarStripPlugin()]);
    const strip = mountCard(StripWrapped, {
      data: baseData({ calendar: cells }),
      callbacks: {},
    });
    const stripSignedBg = (strip.container.querySelector('[role="img"]') as HTMLElement)
      .style.background;
    strip.unmount();

    const GridWrapped = withSignInPlugins(SignInCore, [createCalendarGridPlugin()]);
    const grid = mountCard(GridWrapped, {
      data: baseData({ calendar: cells }),
      callbacks: {},
    });
    const gridSignedBg = (grid.container.querySelector('[role="img"]') as HTMLElement)
      .style.background;
    grid.unmount();

    expect(stripSignedBg).toBe(gridSignedBg);
    expect(stripSignedBg).not.toBe("");
  });
});

/**
 * P2-9 · 倒计时长周期用天单位（跨夜 tick 已在 cross-day.test.tsx 覆盖）
 */
describe("P2-9 · 倒计时文案不再出现「51小时0分」", () => {
  it("跨多天时按「n天m小时」展示", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createCountdownPlugin()]);
    const nextResetAt = Date.now() + 2 * 86_400_000 + 3 * 3_600_000 + 40 * 60_000;
    const h = mountCard(Wrapped, {
      data: baseData({ todaySigned: true, nextResetAt }),
      callbacks: {},
    });
    const text = h.container.textContent ?? "";
    expect(text).toMatch(/2天3小时/);
    expect(text).not.toMatch(/51小时/);
    h.unmount();
  });
});
