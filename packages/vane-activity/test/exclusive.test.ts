import { describe, expect, it } from "vitest";
import { resolveExclusivePlugins } from "../src/components/ActivityPlugin/exclusive";
import type { ActivityPlugin } from "../src/components/ActivityPlugin/plugins/types";
import { createTaskListPlugin } from "../src/custom-plugins/TaskListPlugin";
import { createTaskTabsPlugin } from "../src/custom-plugins/TaskTabsPlugin";
import { createRewardClaimPlugin } from "../src/custom-plugins/RewardClaimPlugin";
import { createRedeemCodePlugin } from "../src/custom-plugins/RedeemCodePlugin";

function makePlugin(
  name: string,
  priority: number,
  exclusiveSlots?: string[]
): ActivityPlugin {
  return {
    name,
    version: "0.0.0",
    priority,
    ...(exclusiveSlots ? { exclusiveSlots } : {}),
    hooks: {},
  } as unknown as ActivityPlugin;
}

describe("resolveExclusivePlugins", () => {
  it("无独占声明时全部保留", () => {
    const plugins = [
      makePlugin("A", 10),
      makePlugin("B", 20),
      makePlugin("C", 30),
    ];
    const { kept, dropped } = resolveExclusivePlugins(plugins);
    expect(kept).toEqual(plugins);
    expect(dropped).toEqual([]);
  });

  it("同槽位独占冲突：低 priority 者被整体丢弃", () => {
    const winner = makePlugin("RewardClaim", 30, ["renderRewards"]);
    const loser = makePlugin("CouponStack", 29, ["renderRewards"]);
    const other = makePlugin("TaskList", 20);
    const { kept, dropped } = resolveExclusivePlugins([other, loser, winner]);
    expect(kept.map((p) => p.name)).toEqual(["TaskList", "RewardClaim"]);
    expect(dropped).toEqual([
      { name: "CouponStack", slot: "renderRewards", winner: "RewardClaim" },
    ]);
  });

  it("保持调用方传入的相对顺序（胜出者留在其原位置）", () => {
    const a = makePlugin("A", 10, ["renderRules"]);
    const b = makePlugin("B", 39, ["renderRules"]);
    const { kept } = resolveExclusivePlugins([a, b]);
    // b priority 更高 → b 胜出；kept 保持原相对顺序，只剩 b
    expect(kept.map((p) => p.name)).toEqual(["B"]);
  });

  it("未声明独占的插件可与独占者共存于同槽位", () => {
    const exclusive = makePlugin("Modal", 39, ["renderRules"]);
    const coexist = makePlugin("Accordion", 40); // priority 更高但不声明独占
    const { kept, dropped } = resolveExclusivePlugins([exclusive, coexist]);
    expect(kept.map((p) => p.name)).toEqual(["Modal", "Accordion"]);
    expect(dropped).toEqual([]);
  });

  it("一个插件声明多个独占槽位：任一冲突即整体丢弃", () => {
    const first = makePlugin("First", 50, ["renderProgress", "renderOverlay"]);
    const second = makePlugin("Second", 40, ["renderOverlay"]);
    const { kept, dropped } = resolveExclusivePlugins([first, second]);
    expect(kept.map((p) => p.name)).toEqual(["First"]);
    expect(dropped).toEqual([
      { name: "Second", slot: "renderOverlay", winner: "First" },
    ]);
  });

  it("三个独占者竞争同槽位：只留 priority 最高者，丢弃两条记录", () => {
    const a = makePlugin("A", 10, ["renderRewards"]);
    const b = makePlugin("B", 29, ["renderRewards"]);
    const c = makePlugin("C", 30, ["renderRewards"]);
    const { kept, dropped } = resolveExclusivePlugins([a, b, c]);
    expect(kept.map((p) => p.name)).toEqual(["C"]);
    expect(dropped).toHaveLength(2);
    expect(dropped.every((d) => d.winner === "C")).toBe(true);
  });

  it("真实插件：TaskList(20) 与 TaskTabs(22) 同装时任务清单只留 TaskTabs", () => {
    const list = createTaskListPlugin() as unknown as ActivityPlugin;
    const tabs = createTaskTabsPlugin() as unknown as ActivityPlugin;
    const { kept, dropped } = resolveExclusivePlugins([list, tabs]);
    expect(kept.map((p) => p.name)).toEqual(["TaskTabsPlugin"]);
    expect(dropped).toEqual([
      { name: "TaskListPlugin", slot: "renderTasks", winner: "TaskTabsPlugin" },
    ]);
  });

  it("真实插件：RedeemCode 未声明独占，与独占 renderRewards 的 RewardClaim 共存", () => {
    const claim = createRewardClaimPlugin() as unknown as ActivityPlugin;
    const redeem = createRedeemCodePlugin() as unknown as ActivityPlugin;
    const { kept, dropped } = resolveExclusivePlugins([claim, redeem]);
    expect(kept.map((p) => p.name).sort()).toEqual([
      "RedeemCodePlugin",
      "RewardClaimPlugin",
    ]);
    expect(dropped).toEqual([]);
  });
});
