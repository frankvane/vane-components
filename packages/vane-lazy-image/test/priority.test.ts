import { describe, expect, it } from "vitest";
import {
  DOMAIN_PRIORITY_BASE,
  DOMAIN_PRIORITY_DEFAULT,
  toKernelPlugin,
  toKernelPlugins,
} from "../src/components/LazyLoadImagePlugin/plugins/priority";
import type { LazyImagePlugin } from "../src/components/LazyLoadImagePlugin/plugins/types";

function makePlugin(name: string, priority?: number): LazyImagePlugin {
  return { name, hooks: {}, ...(priority !== undefined ? { priority } : {}) };
}

describe("priority 适配（领域越小越优先 → 内核越大越优先）", () => {
  it("未声明 priority 时使用领域默认值 100 → 内核 900", () => {
    expect(toKernelPlugin(makePlugin("a")).priority).toBe(
      DOMAIN_PRIORITY_BASE - DOMAIN_PRIORITY_DEFAULT
    );
  });

  it("领域高优先级（小数字）转换为内核高优先级（大数字）", () => {
    // FetchLoaderPlugin 的 priority: 10 必须排在没有声明 priority 的插件之前
    const loader = toKernelPlugin(makePlugin("fetch-loader", 10));
    const normal = toKernelPlugin(makePlugin("blur-up"));
    expect(loader.priority!).toBeGreaterThan(normal.priority!);
  });

  it("单调性：领域 priority 越小，内核 priority 越大", () => {
    const high = toKernelPlugin(makePlugin("high", 0)).priority!;
    const mid = toKernelPlugin(makePlugin("mid", 50)).priority!;
    const low = toKernelPlugin(makePlugin("low", 200)).priority!;
    expect(high).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(low);
  });

  it("不改动传入的插件对象（纯函数）", () => {
    const original = makePlugin("a", 10);
    const converted = toKernelPlugin(original);
    expect(original.priority).toBe(10);
    expect(converted).not.toBe(original);
    expect(converted.priority).toBe(DOMAIN_PRIORITY_BASE - 10);
  });

  it("批量转换保持顺序", () => {
    const list = toKernelPlugins([makePlugin("a", 10), makePlugin("b")]);
    expect(list.map((p) => p.name)).toEqual(["a", "b"]);
  });
});
