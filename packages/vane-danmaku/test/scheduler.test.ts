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
