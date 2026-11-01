import { describe, it, expect } from "vitest";
import { DanmakuScheduler, type RenderOptions } from "../src/components/DanmakuPlugin/render";
import type { DanmakuItem } from "../src/components/DanmakuPlugin/plugins/types";

/**
 * 同轨叠字回归测试。
 *
 * 两层根因，都是「看起来没问题、跑起来一堆字叠在一起」的典型：
 *  1. 新入场者的初始 x 若为 0，`trackFree` 会误判同轨空闲 → 同一帧到达的多条挤在一行；
 *  2. 屏幕速度是 `(宽 + 弹幕宽) / 时长`，越长的弹幕飞得越快 → 同轨后车会追尾前车，
 *     在画布中部压出「一个字一个字穿插」的乱码。修法是加追及判定（见 trackFree）。
 */

const opts: RenderOptions = {
  trackHeight: 28,
  fontFamily: "sans-serif",
  baseFontSize: 22,
  opacity: 1,
  defaultDuration: 8,
  gap: 24,
  fadeMs: 450,
  topInset: 44,
  bottomInset: 88,
  accent: "#ff7a29",
  stroke: "rgba(0,0,0,0.85)",
};

const SIZE = { width: 660, height: 420 };
const FRAMES = 12 * 60;

/** 逐帧推进，返回同轨同向的最大交叠像素 */
function worstOverlap(
  s: DanmakuScheduler,
  items: DanmakuItem[],
  zones: { x: number; y: number; w: number; h: number }[] = []
): { worst: number; maxActive: number } {
  let worst = 0;
  let maxActive = 0;
  for (let f = 0; f <= FRAMES; f++) {
    const active = s.tick(items, SIZE, f / 60, true, opts, zones);
    maxActive = Math.max(maxActive, active.length);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        if (a.track !== b.track || a.dir !== b.dir) continue;
        const overlap =
          Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        if (overlap > worst) worst = overlap;
      }
    }
  }
  return { worst, maxActive };
}

describe("DanmakuScheduler 同轨不叠字", () => {
  it("宽弹幕不会追尾前面的窄弹幕（速度 = 总路程 / 时长，越长越快）", () => {
    const s = new DanmakuScheduler();
    const items: DanmakuItem[] = [
      { id: "narrow", text: "短短短", mode: "scroll", time: 0, meta: {} },
      // 12 个字 + 同一时长 → 速度约为窄条的两倍，必定追上
      { id: "wide", text: "这是一条特别特别特别长的弹幕内容", mode: "scroll", time: 0.9, meta: {} },
    ];
    const { worst } = worstOverlap(s, items);
    expect(worst).toBe(0);
  });

  it("同一时刻到达的一批弹幕不会挤在同一行", () => {
    const s = new DanmakuScheduler();
    const items: DanmakuItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: `same-${i}`,
      text: `同时到达 ${i}`,
      mode: "scroll" as const,
      time: 0,
      meta: {},
    }));
    const { worst } = worstOverlap(s, items);
    expect(worst).toBe(0);
  });

  it("26 条混合流（scroll/reverse/top/bottom）+ 人物全高避让区，全程零交叠", () => {
    const s = new DanmakuScheduler();
    const base: [string, DanmakuItem["mode"], number][] = [
      ["前排围观！", "scroll", 0.2],
      ["这波操作太秀了", "scroll", 0.9],
      ["广告 加微信领福利", "scroll", 1.6],
      ["老粉来啦", "scroll", 2.3],
      ["代刷 等级秒到", "scroll", 3.0],
      ["主播 @主播 今天状态在线", "scroll", 3.7],
      ["欢迎 福利 抽奖进行中", "scroll", 4.2],
      ["管理员的置顶公告", "top", 4.6],
      ["高赞大佬发言", "scroll", 5.0],
      ["火箭 x1", "scroll", 5.6],
      ["弹幕护体", "scroll", 6.5],
      ["spam-bot 刷屏刷屏", "scroll", 7.0],
      ["这画质绝了", "scroll", 7.6],
      ["底部弹幕测试", "bottom", 8.1],
      ["反向弹幕", "reverse", 8.6],
      ["全程高能", "scroll", 9.4],
    ];
    const wave2: [string, number][] = [
      ["这段卡点太准了", 0.5],
      ["导演加个鸡腿", 1.4],
      ["镜头感绝了", 2.7],
      ["背景音乐叫啥", 3.4],
      ["慢动作好评", 4.8],
      ["这走位有点东西", 6.1],
      ["刚进来就赶上了", 7.3],
      ["已三连", 9.1],
      ["回放看起来", 10.4],
    ];
    const items: DanmakuItem[] = [
      ...base.map(([text, mode, time], i) => ({ id: `b${i}`, text, mode, time, meta: {} })),
      ...wave2.map(([text, time], i) => ({
        id: `w${i}`,
        text,
        mode: "scroll" as const,
        time,
        meta: {},
      })),
    ];
    // 人物矩形：横向只占一条，纵向压满全部轨道（最坏情况）
    const zones = [{ x: 310, y: 0, w: 105, h: SIZE.height }];
    const { worst, maxActive } = worstOverlap(s, items, zones);
    expect(worst).toBe(0);
    expect(maxActive).toBeGreaterThan(0);
  });
});
