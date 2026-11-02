import { describe, expect, it } from "vitest";
import {
  computeProgress,
  resolveSnap,
  resolveSnapPixels,
} from "../src/components/ModalSheetPlugin/engine";

const VH = 800;

/** 标准三档：[0.25, 0.5, 1] → y = [0, 400, 600]，hiddenY = 800 */
const snapYs = resolveSnapPixels([0.25, 0.5, 1], {
  viewportH: VH,
  contentH: 0,
  detent: "default",
});

describe("resolveSnapPixels", () => {
  it("把比例档解析为 translateY（升序，index 0 = 最高档）", () => {
    expect(snapYs).toEqual([0, 400, 600]);
  });

  it("缺省时为单档全高", () => {
    expect(
      resolveSnapPixels(undefined, { viewportH: VH, contentH: 0, detent: "default" })
    ).toEqual([0]);
  });

  it("像素档直接使用", () => {
    expect(
      resolveSnapPixels([300], { viewportH: VH, contentH: 0, detent: "default" })
    ).toEqual([VH - 300]);
  });

  it("乱序输入会被排序", () => {
    expect(
      resolveSnapPixels([1, 0.25, 0.5], { viewportH: VH, contentH: 0, detent: "default" })
    ).toEqual([0, 400, 600]);
  });

  it("detent=content 时最高档夹到内容高", () => {
    expect(
      resolveSnapPixels([1], { viewportH: VH, contentH: 320, detent: "content" })
    ).toEqual([VH - 320]);
  });

  it("detent=full 时最高档为满视口", () => {
    expect(
      resolveSnapPixels([0.5], { viewportH: VH, contentH: 100, detent: "full" })
    ).toEqual([0]);
  });
});

describe("resolveSnap", () => {
  const base = {
    snapYs,
    hiddenY: VH,
    velocityThreshold: 500,
    closeThreshold: 0.6,
  };

  it("稳态最近档：中位附近吸附中间档", () => {
    expect(resolveSnap({ ...base, y: 380, velocity: 0 })).toEqual({
      type: "snap",
      index: 1,
    });
  });

  it("快速下滑直接关闭（速度超阈值）", () => {
    expect(resolveSnap({ ...base, y: 100, velocity: 600 })).toEqual({
      type: "close",
    });
  });

  it("上抛速度不触发关闭，走最近档", () => {
    expect(resolveSnap({ ...base, y: 300, velocity: -800 })).toEqual({
      type: "snap",
      index: 1,
    });
  });

  it("拖出比例超阈值关闭：从最低档（y=600）拖过 60% 距离", () => {
    // range = 800 - 0 = 800；600 > 0 + 800*0.6 = 480 → close
    expect(resolveSnap({ ...base, y: 500, velocity: 0 })).toEqual({
      type: "close",
    });
  });

  it("拖出未超阈值时回最近档", () => {
    expect(resolveSnap({ ...base, y: 470, velocity: 0 })).toEqual({
      type: "snap",
      index: 1,
    });
  });

  it("速度阈值优先于比例阈值", () => {
    // y=100（未超比例）但速度超阈值 → close
    expect(resolveSnap({ ...base, y: 100, velocity: 500 })).toEqual({
      type: "close",
    });
  });

  it("空档位列表直接关闭", () => {
    expect(resolveSnap({ ...base, snapYs: [], y: 0, velocity: 0 })).toEqual({
      type: "close",
    });
  });
});

describe("computeProgress", () => {
  const s = { hiddenY: VH, snapYs };

  it("完全展开 = 1", () => {
    expect(computeProgress({ ...s, y: 0 })).toBe(1);
  });

  it("完全关闭 = 0", () => {
    expect(computeProgress({ ...s, y: VH })).toBe(0);
  });

  it("中间档 = 比例值", () => {
    expect(computeProgress({ ...s, y: 400 })).toBeCloseTo(0.5);
  });

  it("越界钳制", () => {
    expect(computeProgress({ ...s, y: -50 })).toBe(1);
    expect(computeProgress({ ...s, y: VH + 50 })).toBe(0);
  });
});
