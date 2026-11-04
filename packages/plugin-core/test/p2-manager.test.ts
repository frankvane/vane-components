import { describe, expect, it, vi } from "vitest";
import { createPluginManager } from "../src/manager/PluginManager";
import type { Plugin, PluginContext } from "../src/types";

const ctx = {} as PluginContext;
const makePlugin = (name: string, extra: Partial<Plugin> = {}): Plugin => ({
  name,
  hooks: {},
  ...extra,
});
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("P2-8 禁用依赖策略", () => {
  it("依赖被 disable 时依赖方一并跳过，enable 后恢复", async () => {
    const m = createPluginManager();
    const base = vi.fn();
    const dependent = vi.fn();
    m.register(makePlugin("base", { hooks: { onMount: base } }));
    m.register(
      makePlugin("app", { dependencies: ["base"], hooks: { onMount: dependent } })
    );

    m.disable("base");
    await m.executeHook("onMount", ctx);
    expect(base).not.toHaveBeenCalled();
    expect(dependent).not.toHaveBeenCalled();
    expect(
      m.getErrors().some((item) => item.plugin === "app" && String(item.error).includes("已停用"))
    ).toBe(true);

    m.enable("base");
    await m.executeHook("onMount", ctx);
    expect(base).toHaveBeenCalledTimes(1);
    expect(dependent).toHaveBeenCalledTimes(1);
  });

  it("缺失依赖仍照跑 + 告警（P1-4 红线不变）", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const m = createPluginManager();
    const hook = vi.fn();
    m.register(makePlugin("app", { dependencies: ["ghost"], hooks: { onMount: hook } }));
    await m.executeHook("onMount", ctx);
    expect(hook).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("P2-12 同名插件去重与旧实例销毁", () => {
  it("同名新实例注册时旧实例 destroy 被调用并告警，注册表只保留新实例", () => {
    const m = createPluginManager();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const oldDestroy = vi.fn();
    const newDestroy = vi.fn();
    m.register(makePlugin("dup", { destroy: oldDestroy }));
    m.register(makePlugin("dup", { destroy: newDestroy }));
    expect(oldDestroy).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    expect(m.getAllPlugins()).toHaveLength(1);
    expect(m.getPlugin("dup")?.destroy).toBe(newDestroy);
    warn.mockRestore();
  });

  it("同一对象重复注册不误销毁", () => {
    const m = createPluginManager();
    const destroy = vi.fn();
    const plugin = makePlugin("same", { destroy });
    m.register(plugin);
    m.register(plugin);
    expect(destroy).not.toHaveBeenCalled();
    expect(m.getAllPlugins()).toHaveLength(1);
  });
});

describe("P2-14 异步 destroy 可等待", () => {
  it("clear() 运行时返回 Promise，await 后异步 destroy 才完成", async () => {
    const m = createPluginManager();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const finished = vi.fn();
    m.register(makePlugin("slow", { destroy: () => gate.then(finished) }));

    const task = m.clear() as unknown as Promise<void>;
    await flush();
    // 旧行为：clear 同步返回，调用方无法知道 destroy 何时结束
    expect(finished).not.toHaveBeenCalled();

    release();
    await task;
    expect(finished).toHaveBeenCalledTimes(1);
    expect(m.getAllPlugins()).toHaveLength(0);
  });

  it("重装配时旧实例 destroy 完成后才启动新实例", async () => {
    const order: string[] = [];
    const m = createPluginManager();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const oldPlugin = makePlugin("same", {
      init: () => void order.push("init-old"),
      destroy: () => gate.then(() => void order.push("destroy-old")),
    });
    const newPlugin = makePlugin("same", {
      init: () => void order.push("init-new"),
    });

    m.register(oldPlugin);
    const aligning = (m as unknown as { align: (p: Plugin[], c: PluginContext) => Promise<void> }).align(
      [newPlugin],
      ctx
    );
    await flush();
    expect(order).toEqual(["init-old"]);
    expect(order).not.toContain("init-new");

    release();
    await aligning;
    expect(order).toEqual(["init-old", "destroy-old", "init-new"]);
  });
});
