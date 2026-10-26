/**
 * 布局等价性：新 `computeLayout` 必须复现旧 `WaterfallCore.calculateLayout` 的数字。
 *
 * 基准来自 `test/fixtures/layout-snapshots.json`，由旧算法逐行转写后取证生成
 * （脚本：`.workbuddy/scratch/wf-baseline/gen-snapshots.mjs`）。旧仓 `tsc -b` exit=2、
 * 依赖未安装，无法直接跑单测，因此只能"转写 + 对表"，这一点在 W0 已说明。
 */
import { describe, expect, it } from "vitest";
import fixture from "./fixtures/layout-snapshots.json";
import { computeLayout, computeScrollTopForItem } from "../src/components/WaterfallPlugin/layout";

const round = (n: number) => Number(n.toFixed(4));

const cases = fixture.cases as any[];
const byId = (id: string) => cases.find((c) => c.id === id)!;

describe("布局等价性（旧算法快照）", () => {
  for (const mode of ["shortest", "balanced", "sequential"] as const) {
    it(`列分配 · ${mode}`, () => {
      const c = byId(`alignment-${mode}`);
      const out = computeLayout({ ...c.input, containerWidth: fixture.containerWidth });

      expect(out.columns).toBe(3);
      expect(round(out.columnWidth)).toBe(c.expect.columnWidth);
      expect(out.columnHeights.map(round)).toEqual(c.expect.columnHeights);
      expect(round(out.totalHeight)).toBe(c.expect.totalHeight);
      expect([...out.positions.values()].map((p) => p.column)).toEqual(c.expect.columns);
      expect(
        [...out.positions.entries()].map(([index, p]) => ({
          index,
          x: round(p.x),
          y: round(p.y),
          column: p.column,
        }))
      ).toEqual(c.expect.positions);
    });
  }

  it("gap 与 padding 参与布局，左右留白不吞列宽", () => {
    const c = byId("gap-padding");
    const out = computeLayout({ ...c.input, containerWidth: fixture.containerWidth });

    expect(out.columns).toBe(2);
    expect(round(out.columnWidth)).toBe(c.expect.columnWidth);
    expect(out.columnHeights.map(round)).toEqual(c.expect.columnHeights);
    expect(round(out.totalHeight)).toBe(c.expect.totalHeight);
    expect(
      [...out.positions.entries()].map(([index, p]) => ({ index, x: round(p.x), y: round(p.y) }))
    ).toEqual(c.expect.positions);
  });

  it("totalHeight 与最高列的关系（旧版含末尾 rowGap，如实保留）", () => {
    const c = byId("total-height");
    const out = computeLayout({ ...c.input, containerWidth: fixture.containerWidth });

    expect(out.columnHeights.map(round)).toEqual(c.expect.columnHeights);
    expect(round(out.totalHeight)).toBe(c.expect.totalHeight);
    expect(round(Math.max(...out.columnHeights))).toBe(c.expect.maxColumnHeight);
    expect(round(out.totalHeight - Math.max(...out.columnHeights))).toBe(c.expect.trailingGap);
  });

  it("项高度变化后重排（图片加载完成）", () => {
    const c = byId("resize-relayout");
    const before = computeLayout({ ...c.input, heights: c.input.heightsBefore, containerWidth: fixture.containerWidth });
    const after = computeLayout({ ...c.input, heights: c.input.heightsAfter, containerWidth: fixture.containerWidth });

    expect(before.positions.size).toBe(4);
    expect([...before.positions.values()].map((p) => p.column)).toEqual(c.expect.before.columns);
    expect([...before.positions.values()].map((p) => round(p.y))).toEqual(c.expect.before.y);
    expect(round(before.totalHeight)).toBe(c.expect.totalHeightBefore);

    expect([...after.positions.values()].map((p) => p.column)).toEqual(c.expect.after.columns);
    expect([...after.positions.values()].map((p) => round(p.y))).toEqual(c.expect.after.y);
    expect(round(after.totalHeight)).toBe(c.expect.totalHeightAfter);
  });

  it("scrollToItem 的三种 block 滚动量", () => {
    const c = byId("scroll-to-item");
    const out = computeLayout({ ...c.input, containerWidth: fixture.containerWidth });
    const pos = out.positions.get(2)!;

    expect(round(pos.y)).toBe(c.expect.y);
    expect(round(computeScrollTopForItem(pos, 400, "start"))).toBe(c.expect.start);
    expect(round(computeScrollTopForItem(pos, 400, "center"))).toBe(c.expect.center);
    expect(round(computeScrollTopForItem(pos, 400, "end"))).toBe(c.expect.end);
  });

  it("items 置空后总高归零、无残影", () => {
    const c = byId("empty-items");
    const out = computeLayout({ ...c.input, containerWidth: fixture.containerWidth });

    expect(out.positions.size).toBe(0);
    expect(out.columnHeights.map(round)).toEqual(c.expect.columnHeights);
    expect(round(out.totalHeight)).toBe(c.expect.totalHeight);
  });
});
