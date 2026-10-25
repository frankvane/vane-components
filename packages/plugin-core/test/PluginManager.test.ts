import { describe, expect, it, vi } from "vitest";
import { createPluginManager } from "../src/manager/PluginManager";
import { resolveDependencyOrder } from "../src/dependency/DependencyResolver";
import type { Plugin, PluginContext } from "../src/types";

const ctx = {} as PluginContext;

const makePlugin = (name: string, extra: Partial<Plugin> = {}): Plugin => ({
  name,
  hooks: {},
  ...extra,
});

describe("resolveDependencyOrder", () => {
  it("依赖项排在前面", () => {
    const order = resolveDependencyOrder([
      makePlugin("a", { dependencies: ["b"] }),
      makePlugin("b"),
    ]).map((p) => p.name);
    expect(order).toEqual(["b", "a"]);
  });

  it("优先级不跨越依赖：高优先级依赖方仍排在其依赖之后", () => {
    const order = resolveDependencyOrder([
      makePlugin("dependent", { dependencies: ["base"], priority: 9 }),
      makePlugin("base", { priority: 1 }),
    ]).map((p) => p.name);
    expect(order).toEqual(["base", "dependent"]);
  });

  it("互不依赖时优先级高的先执行，平级保持注册顺序", () => {
    const order = resolveDependencyOrder([
      makePlugin("low", { priority: 1 }),
      makePlugin("high", { priority: 9 }),
      makePlugin("mid-a", { priority: 5 }),
      makePlugin("mid-b", { priority: 5 }),
    ]).map((p) => p.name);
    expect(order).toEqual(["high", "mid-a", "mid-b", "low"]);
  });

  it("循环依赖抛错", () => {
    expect(() =>
      resolveDependencyOrder([
        makePlugin("a", { dependencies: ["b"] }),
        makePlugin("b", { dependencies: ["a"] }),
      ])
    ).toThrow(/循环依赖/);
  });

  it("缺失依赖只告警不抛错", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const order = resolveDependencyOrder([makePlugin("a", { dependencies: ["ghost"] })]);
    expect(order.map((p) => p.name)).toEqual(["a"]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("createPluginManager", () => {
  it("register / getPlugin / has / unregister", () => {
    const m = createPluginManager();
    m.register(makePlugin("a"));
    expect(m.has("a")).toBe(true);
    expect(m.getPlugin("a")?.name).toBe("a");
    m.unregister("a");
    expect(m.has("a")).toBe(false);
  });

  it("enable / disable 控制是否参与钩子执行", async () => {
    const m = createPluginManager();
    const hook = vi.fn(() => undefined);
    m.register(makePlugin("a", { hooks: { onMount: hook } }));
    m.disable("a");
    await m.executeHook("onMount", ctx);
    expect(hook).not.toHaveBeenCalled();
    m.enable("a");
    await m.executeHook("onMount", ctx);
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it("priority 高的先执行", async () => {
    const m = createPluginManager();
    const calls: string[] = [];
    m.registerAll([
      makePlugin("low", { priority: 1, hooks: { onMount: () => void calls.push("low") } }),
      makePlugin("high", { priority: 9, hooks: { onMount: () => void calls.push("high") } }),
    ]);
    await m.executeHook("onMount", ctx);
    expect(calls).toEqual(["high", "low"]);
  });

  it("钩子返回 false 中断链", async () => {
    const m = createPluginManager();
    const second = vi.fn();
    m.registerAll([
      makePlugin("first", { priority: 10, hooks: { onMount: () => false } }),
      makePlugin("second", { priority: 1, hooks: { onMount: second } }),
    ]);
    const result = await m.executeHook("onMount", ctx);
    expect(result).toBe(false);
    expect(second).not.toHaveBeenCalled();
  });

  it("onMount 返回的清理函数在 clear 时逆序执行", async () => {
    const m = createPluginManager();
    const order: string[] = [];
    m.registerAll([
      makePlugin("a", { hooks: { onMount: () => () => order.push("cleanup-a") } }),
      makePlugin("b", { hooks: { onMount: () => () => order.push("cleanup-b") } }),
    ]);
    await m.executeHook("onMount", ctx);
    expect(order).toEqual([]);
    m.clear();
    expect(order).toEqual(["cleanup-b", "cleanup-a"]);
  });

  it("领域钩子返回函数走短路语义，不注册为清理", async () => {
    const m = createPluginManager();
    m.register(makePlugin("p", { hooks: { customHook: () => () => "cleanup" } }));
    expect(await m.executeHook("customHook", ctx)).toBeTypeOf("function");
    m.clear(); // 不应把领域钩子的返回值当清理执行
  });

  it("钩子返回其他值短路返回", async () => {
    const m = createPluginManager();
    m.register(makePlugin("p", { hooks: { onMount: () => "value" } }));
    expect(await m.executeHook("onMount", ctx)).toBe("value");
  });

  it("插件抛错被隔离并记录，其他插件继续执行", async () => {
    const m = createPluginManager();
    const after = vi.fn();
    m.registerAll([
      makePlugin("bad", {
        priority: 10,
        hooks: {
          onMount: () => {
            throw new Error("boom");
          },
        },
      }),
      makePlugin("good", { hooks: { onMount: after } }),
    ]);
    await m.executeHook("onMount", ctx);
    expect(after).toHaveBeenCalled();
    expect(m.getErrors()).toHaveLength(1);
    expect(m.getErrors()[0].plugin).toBe("bad");
  });

  it("异步钩子超时被沙箱拦截", async () => {
    const m = createPluginManager({ timeout: 20 });
    m.register(
      makePlugin("slow", {
        hooks: {
          onMount: () =>
            new Promise((resolve) => {
              setTimeout(resolve, 200);
            }),
        },
      })
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await m.executeHook("onMount", ctx);
    expect(m.getErrors()).toHaveLength(1);
    expect(String(m.getErrors()[0].error)).toMatch(/超时/);
    warn.mockRestore();
  });

  it("clear 调用 destroy", () => {
    const m = createPluginManager();
    const destroy = vi.fn();
    m.register(makePlugin("a", { destroy }));
    m.clear();
    expect(destroy).toHaveBeenCalled();
    expect(m.getAllPlugins()).toHaveLength(0);
  });
});
