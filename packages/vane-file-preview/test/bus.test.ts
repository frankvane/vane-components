/**
 * P2 · 总线契约
 *
 * 直接用内核的 `createPluginBus()`。迁移前这个文件测的是自建 PluginBus（已删），
 * 现在测的是**我们实际依赖的那份实现** —— 领域包只声明同形的接口，不自己实现，
 * 所以这里要盯住内核的真实行为（尤其是「一个订阅者抛错会不会拖垮其他订阅者」，
 * 那正是旧实现里被 try/catch 吞掉、事后很难查的一类问题）。
 */
import { describe, it, expect, vi } from "vitest";
import { createPluginBus } from "vane-plugin-core";

describe("PluginBus 事件", () => {
  it("emit 会送达所有订阅者", () => {
    const bus = createPluginBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.on("ping", a);
    bus.on("ping", b);

    bus.emit("ping", { n: 1 });
    expect(a).toHaveBeenCalledWith({ n: 1 });
    expect(b).toHaveBeenCalledWith({ n: 1 });
  });

  it("on 返回的取消函数能摘掉订阅", () => {
    const bus = createPluginBus();
    const fn = vi.fn();
    const off = bus.on("ping", fn);
    bus.emit("ping");
    expect(fn).toHaveBeenCalledTimes(1);

    off();
    bus.emit("ping");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("off 按 handler 摘，不影响同事件的其它订阅者", () => {
    const bus = createPluginBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.on("ping", a);
    bus.on("ping", b);

    bus.off("ping", a);
    bus.emit("ping");
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("once 只触发一次", () => {
    const bus = createPluginBus();
    const fn = vi.fn();
    bus.once("ping", fn);
    bus.emit("ping");
    bus.emit("ping");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("没有订阅者时 emit 不抛错", () => {
    const bus = createPluginBus();
    expect(() => bus.emit("nobody-listens")).not.toThrow();
  });

  it("一个订阅者抛错不拖垮其他订阅者", () => {
    const bus = createPluginBus();
    const bad = vi.fn(() => {
      throw new Error("boom");
    });
    const good = vi.fn();
    bus.on("ping", bad);
    bus.on("ping", good);

    // 内核会 catch 并 warn；关键是 good 仍然被调用
    expect(() => bus.emit("ping")).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });
});

describe("PluginBus 共享数据", () => {
  it("setData / getData 往返", () => {
    const bus = createPluginBus();
    bus.setData("page", 3);
    expect(bus.getData<number>("page")).toBe(3);
  });

  it("hasData / deleteData / getAll / clear", () => {
    const bus = createPluginBus();
    bus.setData("a", 1);
    bus.setData("b", 2);
    expect(bus.hasData("a")).toBe(true);

    bus.deleteData("a");
    expect(bus.hasData("a")).toBe(false);
    expect(bus.getAll()).toEqual({ b: 2 });

    bus.clear();
    expect(bus.getAll()).toEqual({});
  });

  it("两个总线实例互不干扰（每个宿主一套）", () => {
    const one = createPluginBus();
    const two = createPluginBus();
    one.setData("x", 1);
    expect(two.getData("x")).toBeUndefined();
  });
});
