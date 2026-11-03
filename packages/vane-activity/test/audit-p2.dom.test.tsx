import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterAll, describe, expect, it } from "vitest";
import { ActivityCore, withPlugins } from "../src";
import type { ActivityData, ActivityPlugin } from "../src";
import { computeProgress, deriveRewardStatus } from "../src/components/ActivityPlugin/domain";
import { createRuleModalPlugin } from "../src/custom-plugins/RuleModalPlugin";
import { createCountdownTimerPlugin } from "../src/custom-plugins/CountdownTimerPlugin";
import { createTaskTabsPlugin } from "../src/custom-plugins/TaskTabsPlugin";
import { createRedeemCodePlugin } from "../src/custom-plugins/RedeemCodePlugin";
import { createLeaderboardPlugin } from "../src/custom-plugins/LeaderboardPlugin";

/**
 * P1-6 / P2 回归：
 * RuleModal 无障碍（Esc + 焦点还原）、domain 脏权重与阈值、空任务规则槽、
 * 倒计时结束态、Tabs 键盘导航、兑换码异步回执、排行榜脏数据。
 */

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const tick = () =>
  act(async () => {
    await new Promise<void>((r) => setTimeout(r, 0));
  });

const baseData = (extra: Partial<ActivityData> = {}): ActivityData => ({
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场", progress: 0.6, status: "available" },
  ],
  rewards: [{ id: "r1", title: "5 元券", threshold: 0.5 }],
  rules: [],
  ...extra,
});

async function mount(ui: React.ReactElement) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(ui));
  await tick();
  return {
    host,
    text: () => host.textContent ?? "",
    q: (sel: string) => host.querySelector<HTMLElement>(sel),
    qa: (sel: string) => Array.from(host.querySelectorAll<HTMLElement>(sel)),
    click: async (el: HTMLElement | null) => {
      if (!el) throw new Error("目标元素不存在");
      await act(async () => {
        el.click();
        await new Promise<void>((r) => setTimeout(r, 0));
      });
      await tick();
    },
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

afterAll(() => {
  document.body.innerHTML = "";
});

describe("P2-1 领域派生：脏权重 / 脏阈值", () => {
  it("权重 NaN / 0 / 负数回退为 1，进度不产生 NaN", () => {
    const tasks = [
      { id: "a", title: "a", progress: 1, status: "completed" as const, weight: Number.NaN },
      { id: "b", title: "b", progress: 0, status: "available" as const, weight: 0 },
      { id: "c", title: "c", progress: 0, status: "available" as const, weight: -2 },
    ];
    expect(computeProgress(tasks)).toBeCloseTo(1 / 3);
    expect(computeProgress([])).toBe(0);
  });

  it("进度夹取到 [0,1]，越界 progress 不放大", () => {
    const tasks = [
      { id: "a", title: "a", progress: 2, status: "completed" as const },
      { id: "b", title: "b", progress: -1, status: "available" as const },
    ];
    expect(computeProgress(tasks)).toBe(0.5);
  });

  it("阈值 NaN 按 1（锁定）；越界阈值夹取后判定", () => {
    const base = { id: "r", title: "券" };
    expect(deriveRewardStatus({ ...base, threshold: Number.NaN }, 0.9, false)).toBe("locked");
    expect(deriveRewardStatus({ ...base, threshold: 2 }, 1, false)).toBe("claimable");
    expect(deriveRewardStatus({ ...base, threshold: -1 }, 0, false)).toBe("claimable");
    expect(deriveRewardStatus({ ...base, threshold: 0.5 }, 0.5, false)).toBe("claimable");
    expect(deriveRewardStatus({ ...base, threshold: 0.5 }, 0.5, true)).toBe("claimed");
  });
});

describe("P2-3 规则槽不依赖任务", () => {
  it("空任务活动仍然渲染规则槽", async () => {
    const rulesProbe: ActivityPlugin = {
      name: "test-rules-probe",
      version: "0.0.1",
      hooks: {
        renderRules: () => <div data-testid="rules-probe">规则内容</div>,
      },
    };
    const Activity = withPlugins(ActivityCore, [rulesProbe]);
    const m = await mount(
      <Activity data={baseData({ tasks: [], rules: "活动规则" })} />
    );
    expect(m.text()).toContain("活动暂未开始");
    expect(m.q('[data-testid="rules-probe"]')).not.toBeNull();
    expect(m.q(".va-rules")).not.toBeNull();
    m.unmount();
  });
});

describe("P1-6 RuleModal 无障碍", () => {
  it("打开后焦点进入弹窗、Esc 关闭并还原到触发按钮、滚动锁恢复", async () => {
    const Activity = withPlugins(ActivityCore, [createRuleModalPlugin()]);
    const m = await mount(<Activity data={baseData({ rules: "每人限领一次" })} />);

    const trigger = m.qa("button").find((b) => b.textContent?.includes("活动规则"));
    expect(trigger).toBeTruthy();
    await m.click(trigger!);

    const dialog = m.q('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
    // 初始焦点落在关闭按钮
    expect(document.activeElement?.getAttribute("aria-label")).toBe("关闭");

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await tick();

    expect(m.q('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);
    m.unmount();
  });
});

describe("P2-6 / P2-16 倒计时", () => {
  it("已过期展示「已结束」；未过期挂载后才显示时间", async () => {
    const Activity = withPlugins(ActivityCore, [
      createCountdownTimerPlugin({ endTime: Date.now() - 1000 }),
    ]);
    const m = await mount(<Activity data={baseData()} />);
    const timer = m.q('[role="timer"]');
    expect(timer).not.toBeNull();
    expect(timer!.textContent).toBe("已结束");
    expect(m.text()).not.toContain("--:--:--");
    m.unmount();
  });

  it("未来截止时间显示 hh:mm:ss，而不是加载占位", async () => {
    const Activity = withPlugins(ActivityCore, [
      createCountdownTimerPlugin({ endTime: Date.now() + 60_000 }),
    ]);
    const m = await mount(<Activity data={baseData()} />);
    const timer = m.q('[role="timer"]');
    expect(timer!.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
    m.unmount();
  });
});

describe("P2-11 TaskTabs 键盘导航", () => {
  it("ArrowRight 选中并聚焦下一个页签，End 到最后一个", async () => {
    const Activity = withPlugins(ActivityCore, [createTaskTabsPlugin()]);
    const data = baseData({
      taskGroups: [
        { key: "daily", label: "每日" },
        { key: "grow", label: "成长" },
        { key: "social", label: "社交" },
      ],
      tasks: [
        { id: "t1", title: "每日签到", progress: 1, status: "completed", group: "daily" },
        { id: "t2", title: "浏览会场", progress: 0.6, status: "available", group: "grow" },
        { id: "t3", title: "邀请好友", progress: 0, status: "available", group: "social" },
      ],
    });
    const m = await mount(<Activity data={data} />);

    const tabs = m.qa('[data-testid="task-tab"]');
    expect(tabs).toHaveLength(3);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");

    const press = async (key: string) => {
      await act(async () => {
        tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });
      await tick();
    };

    await press("ArrowRight");
    const next = m.qa('[data-testid="task-tab"]')[1];
    expect(next.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(next);
    expect(m.text()).toContain("浏览会场");

    await act(async () => {
      next.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    });
    await tick();
    const last = m.qa('[data-testid="task-tab"]')[2];
    expect(last.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(last);
    m.unmount();
  });
});

describe("P2-13 兑换码异步", () => {
  it("等待期间禁用提交并显示「兑换中」，resolve 后显示成功", async () => {
    let release: (ok: boolean) => void = () => {};
    const gate = new Promise<boolean>((resolve) => {
      release = resolve;
    });
    const Activity = withPlugins(ActivityCore, [
      createRedeemCodePlugin({ onRedeem: () => gate }),
    ]);
    const m = await mount(<Activity data={baseData()} />);

    const input = m.q("input") as HTMLInputElement;
    const setValue = (value: string) => {
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        setter?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };
    setValue("VANE-8888");

    await m.click(m.qa("button").find((b) => b.textContent === "兑换")!);
    expect(m.text()).toContain("兑换中");
    expect((m.q("button[type=submit]") as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      release(true);
      await new Promise<void>((r) => setTimeout(r, 0));
    });
    await tick();
    expect(m.text()).toContain("兑换成功");
    expect((m.q("button[type=submit]") as HTMLButtonElement).disabled).toBe(false);
    m.unmount();
  });

  it("onRedeem 抛错时显示失败文案并恢复提交", async () => {
    const Activity = withPlugins(ActivityCore, [
      createRedeemCodePlugin({
        onRedeem: async () => {
          throw new Error("network");
        },
      }),
    ]);
    const m = await mount(<Activity data={baseData()} />);

    const input = m.q("input") as HTMLInputElement;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "VANE-8888");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await m.click(m.qa("button").find((b) => b.textContent === "兑换")!);
    expect(m.text()).toContain("兑换失败，请稍后重试");
    expect((m.q("button[type=submit]") as HTMLButtonElement).disabled).toBe(false);
    m.unmount();
  });
});

describe("P2-9 / P2-10 排行榜脏数据", () => {
  it("过滤非对象条目、补默认字段，排序与参与人数正确", async () => {
    const Activity = withPlugins(ActivityCore, [createLeaderboardPlugin({ topN: 2 })]);
    const dirty = [
      null,
      { id: "a", name: "甲", score: 10 },
      { name: "乙" },
      { id: "c", name: "丙", score: "abc" },
    ] as unknown as ActivityData["leaderboard"];
    const m = await mount(<Activity data={baseData({ leaderboard: dirty })} />);

    expect(m.text()).toContain("共 3 人参与");
    expect(m.text()).toContain("甲");
    expect(m.text()).toContain("乙");
    // 只展示 top2；分数非法按 0，排最后被截掉
    expect(m.qa("ol li")).toHaveLength(2);
    expect(m.text()).not.toContain("丙");
    m.unmount();
  });

  it("非数组 leaderboard 渲染空态而不是崩溃", async () => {
    const Activity = withPlugins(ActivityCore, [createLeaderboardPlugin()]);
    const m = await mount(
      <Activity
        data={baseData({ leaderboard: "bad" as unknown as ActivityData["leaderboard"] })}
      />
    );
    expect(m.text()).toContain("暂无排行数据");
    m.unmount();
  });
});

describe("P2-5 配置夹取", () => {
  it("Leaderboard topN 非法值回退到 3，不再切出空榜", async () => {
    const Activity = withPlugins(ActivityCore, [
      createLeaderboardPlugin({ topN: Number.NaN }),
    ]);
    const m = await mount(
      <Activity
        data={baseData({
          leaderboard: [
            { id: "a", name: "甲", score: 10 },
            { id: "b", name: "乙", score: 9 },
            { id: "c", name: "丙", score: 8 },
            { id: "d", name: "丁", score: 7 },
          ],
        })}
      />
    );
    expect(m.qa("ol li")).toHaveLength(3);
    m.unmount();
  });
});
