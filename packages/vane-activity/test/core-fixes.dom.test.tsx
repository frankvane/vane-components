import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterAll, describe, expect, it, vi } from "vitest";
import { ActivityCore, withPlugins } from "../src";
import type { ActivityData, ActivityPlugin } from "../src";
import { createTaskListPlugin } from "../src/custom-plugins/TaskListPlugin";
import { createRewardClaimPlugin } from "../src/custom-plugins/RewardClaimPlugin";
import { createClaimToastPlugin } from "../src/custom-plugins/ClaimToastPlugin";
import { createJackpotPlugin } from "../src/custom-plugins/JackpotPlugin";

/**
 * P1-1 ~ P1-5 回归：
 * transformData 接线 / claim 守卫 / 抽奖服务端结果 / toast 独立计时 / 畸形数据不崩溃。
 */

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const tick = () =>
  act(async () => {
    await new Promise<void>((r) => setTimeout(r, 0));
  });
const wait = (ms: number) =>
  act(async () => {
    await new Promise<void>((r) => setTimeout(r, ms));
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
    qa: (sel: string) => Array.from(host.querySelectorAll<HTMLElement>(sel)),
    q: (sel: string) => host.querySelector<HTMLElement>(sel),
    click: async (el: HTMLElement | null) => {
      if (!el) throw new Error("目标元素不存在");
      await act(async () => {
        el.click();
        // 让 async 处理函数里的 await 继续执行完，再统一 flush
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

describe("P1-1 transformData 接线", () => {
  it("装配插件的 transformData 会真正执行并影响渲染", async () => {
    const filterPlugin: ActivityPlugin = {
      name: "test-transform-data",
      version: "0.0.1",
      hooks: {
        transformData: (_ctx, data) => ({
          ...data,
          tasks: data.tasks.filter((task) => task.id !== "t2"),
        }),
      },
    };
    const Activity = withPlugins(ActivityCore, [
      filterPlugin,
      createTaskListPlugin(),
    ]);

    const m = await mount(<Activity data={baseData()} />);
    const rows = m.qa('[data-testid="activity-task"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("每日签到");
    m.unmount();
  });
});

describe("P1-2 claim 守卫", () => {
  it("锁定/未知/重复领取不触发 onClaim；同 tick 领取两个奖励不丢 id", async () => {
    const onClaim = vi.fn();
    const probe: ActivityPlugin = {
      name: "test-claim-probe",
      version: "0.0.1",
      hooks: {
        renderRewards: (ctx) => (
          <div>
            <button
              data-testid="claim-probe"
              onClick={() => {
                ctx.claim("r-locked");
                ctx.claim("r-missing");
                ctx.claim("r1");
                ctx.claim("r2");
                ctx.claim("r1");
              }}
            >
              测试领取
            </button>
            <span data-testid="claimed-ids">{ctx.claimedIds.join(",")}</span>
          </div>
        ),
      },
    };
    const Activity = withPlugins(ActivityCore, [probe]);
    const data = baseData({
      rewards: [
        { id: "r1", title: "5 元券", threshold: 0.5 },
        { id: "r2", title: "10 元券", threshold: 0.5 },
        { id: "r-locked", title: "大奖", threshold: 1 },
      ],
    });

    const m = await mount(<Activity data={data} onClaim={onClaim} />);
    await m.click(m.q('[data-testid="claim-probe"]'));

    // r-locked（locked）、r-missing（不存在）、第二次 r1（in-flight）都不应回调
    expect(onClaim.mock.calls.map((call) => call[0])).toEqual(["r1", "r2"]);
    expect(m.q('[data-testid="claimed-ids"]')?.textContent).toBe("r1,r2");
    m.unmount();
  });
});

describe("P1-3 抽奖服务端结果", () => {
  it("drawResult 返回的剩余次数被采用，且不再本地 -1", async () => {
    const Activity = withPlugins(ActivityCore, [
      createJackpotPlugin({
        times: 2,
        drawResult: () => ({ index: 2, remaining: 1 }),
      }),
    ]);
    const m = await mount(<Activity data={baseData()} />);
    expect(m.text()).toContain("剩余 2 次");

    await m.click(m.qa("button").find((b) => b.textContent === "抽一次")!);
    expect(m.text()).toContain("剩余 1 次");
    expect(m.text()).not.toContain("剩余 0 次");
    m.unmount();
  });

  it("drawResult 抛错时展示失败文案并恢复按钮，不扣次数", async () => {
    const Activity = withPlugins(ActivityCore, [
      createJackpotPlugin({
        times: 2,
        drawResult: () => {
          throw new Error("network");
        },
      }),
    ]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const m = await mount(<Activity data={baseData()} />);

    await m.click(m.qa("button").find((b) => b.textContent === "抽一次")!);
    expect(m.text()).toContain("抽奖请求失败");
    expect(m.text()).toContain("剩余 2 次");
    expect(m.qa("button").some((b) => b.textContent === "抽一次")).toBe(true);
    warn.mockRestore();
    m.unmount();
  });
});

describe("P1-4 ClaimToast 独立计时", () => {
  it("连续两批领取时，第一批按时消失且不影响第二批", async () => {
    const Activity = withPlugins(ActivityCore, [
      createRewardClaimPlugin(),
      createClaimToastPlugin({ durationMs: 2000 }),
    ]);
    const data = baseData({
      rewards: [
        { id: "r1", title: "五元券", threshold: 0.5 },
        { id: "r2", title: "十元券", threshold: 0.5 },
      ],
    });

    const m = await mount(<Activity data={data} />);
    const buttons = () =>
      m.qa("button").filter((b) => b.textContent === "领取");
    await m.click(buttons()[0]);
    await wait(50); // 第一批仍在展示中，领取第二个奖励
    await m.click(buttons()[0]);

    expect(m.text()).toContain("已领取：五元券");
    expect(m.text()).toContain("已领取：十元券");

    // 轮询等待第一批（早 50ms 创建）先消失，避免固定 sleep 受 act 开销影响
    for (let i = 0; i < 80 && m.text().includes("已领取：五元券"); i++) {
      await wait(50);
    }
    expect(m.text()).not.toContain("已领取：五元券");
    expect(m.text()).toContain("已领取：十元券");

    for (let i = 0; i < 80 && m.text().includes("已领取：十元券"); i++) {
      await wait(50);
    }
    expect(m.text()).not.toContain("已领取：十元券");
    m.unmount();
  });
});

describe("P1-5 畸形数据", () => {
  it("data 缺 tasks/rewards 时渲染空态而不是崩溃", async () => {
    const Activity = withPlugins(ActivityCore, []);
    const m = await mount(
      <Activity data={{ title: "空活动" } as unknown as ActivityData} />
    );
    expect(m.text()).toContain("活动暂未开始");
    m.unmount();
  });

  it("tasks 为 null 时插件区也不崩溃", async () => {
    const Activity = withPlugins(ActivityCore, [createTaskListPlugin()]);
    const m = await mount(
      <Activity
        data={{ ...baseData(), tasks: null } as unknown as ActivityData}
      />
    );
    expect(m.text()).toContain("活动暂未开始");
    m.unmount();
  });
});
