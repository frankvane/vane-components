import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterAll, describe, expect, it } from "vitest";
import { ActivityCore, withPlugins } from "../src";
import type { ActivityData } from "../src";
import { createTaskTabsPlugin } from "../src/custom-plugins/TaskTabsPlugin";
import { createCheckinCalendarPlugin } from "../src/custom-plugins/CheckinCalendarPlugin";
import { createJackpotPlugin } from "../src/custom-plugins/JackpotPlugin";
import { createRedeemCodePlugin } from "../src/custom-plugins/RedeemCodePlugin";

/**
 * 第三批插件的「真实挂载 + 真实交互」单测（happy-dom）。
 *
 * 只断言用户能看到的东西：页签切换后还剩哪几条任务、签到后连续天数是否 +1、
 * 抽一次后剩余次数是否 -1、兑换码三层校验的文案是否按顺序出现。
 * 不 mock 组件内部状态，也不读实现细节。
 */

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

/** 等待一轮宏任务；用 act 包住异步更新，避免测试输出 act 告警噪声 */
const tick = () =>
  act(async () => {
    await new Promise<void>((r) => setTimeout(r, 0));
  });

type Mounted = {
  host: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
  text: () => string;
  qa: (sel: string) => HTMLElement[];
  q: (sel: string) => HTMLElement | null;
  click: (el: HTMLElement | null) => Promise<void>;
  type: (el: HTMLInputElement, value: string) => Promise<void>;
  unmount: () => void;
};

async function mount(ui: React.ReactElement): Promise<Mounted> {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(ui));
  await tick();
  return {
    host,
    root,
    text: () => host.textContent ?? "",
    qa: (sel) => Array.from(host.querySelectorAll<HTMLElement>(sel)),
    q: (sel) => host.querySelector<HTMLElement>(sel),
    click: async (el) => {
      if (!el) throw new Error("目标元素不存在");
      await act(async () => {
        el.click();
        // 让 async 处理函数里的 await 继续执行完，再统一 flush
        await new Promise<void>((r) => setTimeout(r, 0));
      });
      await tick();
    },
    type: async (el, value) => {
      // React 监听的是原生 input 事件，必须用原型上的 value setter 绕过受控值缓存
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      await act(async () => {
        setter?.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await tick();
    },
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

const baseData = (extra: Partial<ActivityData> = {}): ActivityData => ({
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场", progress: 0.6, status: "available" },
  ],
  rewards: [{ id: "r1", title: "5 元券", threshold: 0.5 }],
  rules: [],
  ...extra,
});

afterAll(() => {
  document.body.innerHTML = "";
});

describe("TaskTabsPlugin", () => {
  const Activity = withPlugins(ActivityCore, [createTaskTabsPlugin({ defaultTab: "daily" })]);

  const data = baseData({
    taskGroups: [
      { key: "daily", label: "每日" },
      { key: "growth", label: "成长" },
      { key: "invite", label: "邀请" },
    ],
    tasks: [
      { id: "d1", title: "每日签到", progress: 1, status: "completed", group: "daily" },
      { id: "g1", title: "收藏店铺", progress: 0.5, status: "available", group: "growth" },
      { id: "i1", title: "邀请好友", progress: 0, status: "locked", group: "invite" },
    ],
  });

  it("渲染全部页签 + 每组完成度，默认页签只显示本组任务", async () => {
    const m = await mount(<Activity data={data} />);
    const tabs = m.qa('[data-testid="task-tab"]');
    expect(tabs).toHaveLength(3);
    expect(tabs[0].textContent).toContain("1/1"); // 每日组已完成
    expect(tabs[1].textContent).toContain("0/1");

    const rows = m.qa('[data-testid="activity-task"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("每日签到");
    m.unmount();
  });

  it("点击页签切换分组，任务行随之替换", async () => {
    const m = await mount(<Activity data={data} />);
    const tabs = m.qa('[data-testid="task-tab"]');
    await m.click(tabs[1]);
    let rows = m.qa('[data-testid="activity-task"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("收藏店铺");

    await m.click(m.qa('[data-testid="task-tab"]')[0]); // 「全部」不存在，回到第 1 个页签
    rows = m.qa('[data-testid="activity-task"]');
    expect(rows[0].textContent).toContain("每日签到");
    m.unmount();
  });
});

describe("CheckinCalendarPlugin", () => {
  const Activity = withPlugins(ActivityCore, [createCheckinCalendarPlugin()]);

  it("渲染 7 格 + 连续天数，点签到后乐观 +1", async () => {
    const m = await mount(<Activity data={baseData({ checkin: { days: 7, done: 3 } })} />);
    expect(m.qa('[data-testid="checkin-cell"]')).toHaveLength(7);
    expect(m.text()).toContain("已连续");
    expect(m.text()).toContain("3/7 天");

    const btn = m.qa("button").find((b) => b.textContent === "今日签到");
    expect(btn).toBeTruthy();
    await m.click(btn!);

    expect(m.text()).toContain("4/7 天");
    expect(m.qa("button").some((b) => b.textContent === "已签到")).toBe(true);
    m.unmount();
  });
});

describe("JackpotPlugin", () => {
  const Activity = withPlugins(ActivityCore, [createJackpotPlugin({ times: 2 })]);

  it("9 格（8 奖励 + 中心按钮），点一次剩余次数 -1 并进入抽取中", async () => {
    const m = await mount(<Activity data={baseData()} />);
    expect(m.qa('[data-testid="jackpot-cell"]')).toHaveLength(8);
    expect(m.text()).toContain("剩余 2 次");

    const btn = m.qa("button").find((b) => b.textContent === "抽一次");
    expect(btn).toBeTruthy();
    await m.click(btn!);

    expect(m.text()).toContain("剩余 1 次");
    expect(m.qa("button").some((b) => b.textContent === "抽取中")).toBe(true);
    m.unmount(); // 卸载即清理动画定时器
  });
});

describe("RedeemCodePlugin", () => {
  const onRedeem = (code: string) => code === "VANE-8888";
  const Activity = withPlugins(ActivityCore, [
    createRedeemCodePlugin({ prefix: "VANE", minLength: 8, onRedeem }),
  ]);

  it("三层校验按顺序报错，命中正确码则成功并清空输入", async () => {
    const m = await mount(<Activity data={baseData()} />);
    const submit = () => m.click(m.qa("button").find((b) => b.textContent === "兑换")!);
    const input = () => m.q("input") as HTMLInputElement;

    await submit();
    expect(m.text()).toContain("请输入兑换码");

    await m.type(input(), "VANE-1");
    await submit();
    expect(m.text()).toContain("兑换码至少 8 位");

    await m.type(input(), "CODE-8888");
    await submit();
    expect(m.text()).toContain("应以 VANE 开头");

    await m.type(input(), "VANE-9999");
    await submit();
    expect(m.text()).toContain("兑换码无效或已被使用");

    await m.type(input(), "  vane-8888 ");
    await submit();
    expect(m.text()).toContain("兑换成功，奖励已入账");
    expect(input().value).toBe("");
    m.unmount();
  });
});
