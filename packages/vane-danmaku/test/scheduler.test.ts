import { describe, it, expect } from "vitest";
import { DanmakuScheduler, type RenderOptions } from "../src/components/DanmakuPlugin/render";
import type { DanmakuItem } from "../src/components/DanmakuPlugin/plugins/types";

const opts: RenderOptions = {
  trackHeight: 20,
  fontFamily: "sans-serif",
  baseFontSize: 16,
  opacity: 1,
  defaultDuration: 2,
  gap: 8,
  fadeMs: 450,
  topInset: 0,
  bottomInset: 0,
  accent: "#ff7a29",
  stroke: "rgba(0,0,0,0.85)",
};

const SIZE = { width: 800, height: 400 };

/** 10 条弹幕，时间均匀铺在 0..9 秒，单条飞 1 秒 */
function makeItems(): DanmakuItem[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `s${i}`,
    text: `第 ${i} 条弹幕`,
    mode: "scroll" as const,
    time: i,
    duration: 1,
    meta: {},
  }));
}

/** 以 0.1s 步长把时钟从 from 推进到 to，返回每一步的在飞条数 */
function run(s: DanmakuScheduler, items: DanmakuItem[], from: number, to: number, step = 0.1) {
  const counts: number[] = [];
  for (let t = from; t <= to + 1e-9; t = Math.round((t + step) * 1000) / 1000) {
    counts.push(s.tick(items, SIZE, t, true, opts, []).length);
  }
  return counts;
}

describe("DanmakuScheduler 激活/回收", () => {
  it("飞完的弹幕不会被下一帧重新激活（复活 bug 回归）", () => {
    const s = new DanmakuScheduler();
    const items = makeItems();
    // 时钟走到 11s：所有弹幕的 1s 飞行期都已结束
    run(s, items, 0, 11);
    const active = s.tick(items, SIZE, 11.1, true, opts, []);
    expect(active).toHaveLength(0);
  });

  it("同一时刻的在飞条数不随时钟推进单调膨胀", () => {
    const s = new DanmakuScheduler();
    const items = makeItems();
    const counts = run(s, items, 0, 11);
    // 每条只飞 1s、时间隔 1s → 稳态下最多同时 2 条（跨越边界的相邻两条）
    expect(Math.max(...counts)).toBeLessThanOrEqual(3);
  });

  it("时钟回绕后重新开一轮，弹幕会再次出现", () => {
    const s = new DanmakuScheduler();
    const items = makeItems();
    run(s, items, 0, 9.5);
    // 回绕到 0.2s：清场 + 重新按 time 激活
    const again = run(s, items, 0.2, 0.3);
    expect(again.some((n) => n > 0)).toBe(true);
  });

  it("运行期新注入的弹幕（time 落在过去）能立即激活", () => {
    const s = new DanmakuScheduler();
    const items = makeItems();
    run(s, items, 0, 5);
    const injected: DanmakuItem = {
      id: "cmd-1",
      text: "我刚发的弹幕",
      mode: "scroll",
      time: 0.2, // 时间戳比当前时钟早，但它是新 id
      duration: 1,
      meta: {},
    };
    const active = s.tick([...items, injected], SIZE, 5.1, true, opts, []);
    expect(active.map((a) => a.item.id)).toContain("cmd-1");
  });
});

/** 同一时刻到达的 n 条滚动弹幕 */
function burst(n: number, duration = 5): DanmakuItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `z${i}`,
    text: `同时到达 ${i}`,
    mode: "scroll" as const,
    time: 0,
    duration,
    meta: {},
  }));
}

describe("DanmakuScheduler 避让区 / 饱和策略", () => {
  it("同一时刻到达的弹幕不会叠在同一条轨上（初始 x 必须是入场位）", () => {
    const s = new DanmakuScheduler();
    const active = s.tick(burst(8), SIZE, 0, true, opts, []);
    expect(active).toHaveLength(8);
    // 8 条各占一轨；若初始 x=0，trackFree 会误判空轨，全部挤到 lo 轨
    expect(new Set(active.map((a) => a.track)).size).toBe(8);
  });

  it("避让区纵向压满整屏时仍能入场，且依然不叠轨（交给绘制期裁剪挖空）", () => {
    const s = new DanmakuScheduler();
    // 人物框：横向 200..600、纵向贯穿全部轨道 —— 没有一条「干净」轨可选
    const zones = [{ x: 200, y: 0, w: 400, h: SIZE.height }];
    const active = s.tick(burst(8), SIZE, 0, true, opts, zones);
    expect(active).toHaveLength(8);
    expect(new Set(active.map((a) => a.track)).size).toBe(8);
  });

  it("画布真的饱和时丢弃溢出条目，而不是挤进同一轨叠字", () => {
    const s = new DanmakuScheduler();
    // 只有 1 条轨道：同一时刻只容得下 1 条
    const size = { width: 800, height: opts.trackHeight };
    expect(s.tick(burst(5), size, 0, true, opts, [])).toHaveLength(1);
    // 等过 WAIT_MAX：排队的 4 条被丢弃
    s.tick(burst(5), size, DanmakuScheduler.WAIT_MAX + 0.1, true, opts, []);
    expect(s.activeCount).toBe(1);
    expect(s.droppedCount).toBe(4);
  });

  it("排队未超时的弹幕会在空轨出现时补位（吸收突发）", () => {
    const s = new DanmakuScheduler();
    const size = { width: 800, height: opts.trackHeight };
    const items: DanmakuItem[] = [
      { id: "first", text: "先来的", mode: "scroll", time: 0, duration: 0.5, meta: {} },
      { id: "second", text: "排队等下", mode: "scroll", time: 0.1, duration: 0.5, meta: {} },
    ];
    s.tick(items, size, 0, true, opts, []);
    s.tick(items, size, 0.1, true, opts, []); // second 无轨可入 → 排队
    const later = s.tick(items, size, 0.6, true, opts, []); // first 已飞完，second 补位
    expect(later.map((a) => a.item.id)).toContain("second");
    expect(s.droppedCount).toBe(0);
  });
});

describe("DanmakuScheduler 暂停语义", () => {
  it("暂停期间位置冻结（不回入场位），恢复后从暂停位置继续", () => {
    const s = new DanmakuScheduler();
    const items = makeItems();

    // 推进到 2.7s：s2 已入场并在飞行中
    s.tick(items, SIZE, 2.5, true, opts, []); // 激活 s2（初始在入场位）
    const live = s.tick(items, SIZE, 2.7, true, opts, []);
    const target = live.find((a) => a.item.id === "s2");
    expect(target).toBeTruthy();
    const xBefore = target!.x;
    expect(xBefore).toBeLessThan(SIZE.width); // 已经离开入场位

    // 暂停：外部时钟继续走到 4.7s，位置必须一动不动
    const p1 = s.tick(items, SIZE, 2.7, false, opts, []);
    const p2 = s.tick(items, SIZE, 4.7, false, opts, []);
    expect(p1.find((a) => a.item.id === "s2")!.x).toBeCloseTo(xBefore, 3);
    expect(p2.find((a) => a.item.id === "s2")!.x).toBeCloseTo(xBefore, 3);

    // 恢复：按 0.1s 继续推进，而不是把暂停的 2s 也算进去（后者会瞬移约 90px 以上）
    s.tick(items, SIZE, 4.8, true, opts, []); // 恢复帧本身不前进
    const resumed = s.tick(items, SIZE, 4.9, true, opts, []);
    const after = resumed.find((a) => a.item.id === "s2");
    expect(after).toBeTruthy();
    expect(xBefore - after!.x).toBeGreaterThan(0);
    expect(xBefore - after!.x).toBeLessThan(150);
  });
});

