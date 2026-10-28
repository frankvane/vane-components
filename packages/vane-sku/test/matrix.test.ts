import { describe, expect, it } from "vitest";
import {
  buildAvailability,
  isSelectionComplete,
  matchVariant,
} from "../src/components/SkuPlugin/matrix";
import type {
  SkuAttribute,
  SkuVariant,
} from "../src/components/SkuPlugin/plugins/types";

/**
 * 组合矩阵 + 禁用推导（core 内置能力，纯函数）。
 *
 * 数据：颜色(red/blue) × 尺码(s/m/l)
 * 存在的变体：red-s / red-m / blue-s / blue-m
 * 不存在的组合：red-l / blue-l → 尺码 l 应恒为死路
 */
const attributes: SkuAttribute[] = [
  { name: "颜色", options: [{ id: "red", label: "红" }, { id: "blue", label: "蓝" }] },
  {
    name: "尺码",
    options: [
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
  },
];

const variants: SkuVariant[] = [
  { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, stock: 5 },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, stock: 3 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
  { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6 },
];

describe("buildAvailability 禁用推导", () => {
  it("未选择时，通往任何变体的选项都可选；无变体的选项被置灰", () => {
    const { disabledMap, availableCount } = buildAvailability(attributes, variants, {});

    // 尺码 l 在任何变体里都不存在 → 置灰
    expect(disabledMap["尺码"].has("l")).toBe(true);
    // 红/蓝/s/m 都至少通往一个变体
    expect(disabledMap["颜色"].has("red")).toBe(false);
    expect(disabledMap["颜色"].has("blue")).toBe(false);
    expect(disabledMap["尺码"].has("s")).toBe(false);
    expect(disabledMap["尺码"].has("m")).toBe(false);

    expect(availableCount["颜色"]).toBe(2);
    expect(availableCount["尺码"]).toBe(2);
  });

  it("选中蓝色后，不存在的「蓝+L」不影响；核心是 l 仍被置灰", () => {
    const { disabledMap } = buildAvailability(attributes, variants, { 颜色: "blue" });
    expect(disabledMap["尺码"].has("l")).toBe(true);
    expect(disabledMap["尺码"].has("s")).toBe(false);
  });

  it("ignoreOutOfStock=false 时，缺货变体也参与推导（选项不再因缺货被置灰）", () => {
    const withZero: SkuVariant[] = [
      ...variants,
      { sku: "red-l", attrValues: { 颜色: "red", 尺码: "l" }, stock: 0 },
    ];

    // 默认 ignoreOutOfStock=true：stock=0 视为不存在 → 选红后 l 仍置灰
    const ignored = buildAvailability(attributes, withZero, { 颜色: "red" });
    expect(ignored.disabledMap["尺码"].has("l")).toBe(true);

    // 关闭后：缺货变体也参与，l 可选
    const kept = buildAvailability(attributes, withZero, { 颜色: "red" }, {
      ignoreOutOfStock: false,
    });
    expect(kept.disabledMap["尺码"].has("l")).toBe(false);
  });

  it("空变体列表时所有选项都被置灰", () => {
    const { disabledMap, availableCount } = buildAvailability(attributes, [], {});
    expect(disabledMap["颜色"].size).toBe(2);
    expect(disabledMap["尺码"].size).toBe(3);
    expect(availableCount["颜色"]).toBe(0);
  });
});

describe("matchVariant / isSelectionComplete", () => {
  it("选全且命中则返回变体", () => {
    const v = matchVariant(variants, attributes, { 颜色: "red", 尺码: "m" });
    expect(v?.sku).toBe("red-m");
  });

  it("没选全返回 null", () => {
    expect(matchVariant(variants, attributes, { 颜色: "red" })).toBeNull();
  });

  it("选全但组合不存在返回 null（blue+l）", () => {
    expect(matchVariant(variants, attributes, { 颜色: "blue", 尺码: "l" })).toBeNull();
  });

  it("isSelectionComplete 只在所有属性都选了才为真", () => {
    expect(isSelectionComplete(attributes, { 颜色: "red" })).toBe(false);
    expect(isSelectionComplete(attributes, { 颜色: "red", 尺码: "m" })).toBe(true);
    expect(isSelectionComplete([], {})).toBe(false);
  });
});
