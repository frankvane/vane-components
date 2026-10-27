import { describe, expect, it, vi } from "vitest";
import { createPluginBus } from "../src/bus/PluginBus";

describe("createPluginBus", () => {
  it("emit/on 基本发布订阅", () => {
    const bus = createPluginBus();
    const handler = vi.fn();
    bus.on("sku:change", handler);
    bus.emit("sku:change", { id: 1 });
    expect(handler).toHaveBeenCalledWith({ id: 1 });
  });

  it("返回取消订阅函数", () => {
    const bus = createPluginBus();
    const handler = vi.fn();
    const off = bus.on("a", handler);
    off();
    bus.emit("a");
    expect(handler).not.toHaveBeenCalled();
  });

  it("once 只触发一次", () => {
    const bus = createPluginBus();
    const handler = vi.fn();
    bus.once("a", handler);
    bus.emit("a");
    bus.emit("a");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("单个 handler 抛错不影响其他 handler", () => {
    const bus = createPluginBus();
    const bad = vi.fn(() => {
      throw new Error("boom");
    });
    const good = vi.fn();
    bus.on("a", bad);
    bus.on("a", good);
    expect(() => bus.emit("a")).not.toThrow();
    expect(good).toHaveBeenCalled();
  });

  it("数据共享 get/set/delete/has/getAll/clear", () => {
    const bus = createPluginBus();
    bus.setData("k", 1);
    expect(bus.getData("k")).toBe(1);
    expect(bus.hasData("k")).toBe(true);
    expect(bus.getAll()).toEqual({ k: 1 });
    bus.deleteData("k");
    expect(bus.hasData("k")).toBe(false);
    bus.setData("x", 2);
    bus.clear();
    expect(bus.getAll()).toEqual({});
  });

  it("setData 通知该键的订阅方（消费方靠它感知数据变化）", () => {
    const bus = createPluginBus();
    const handler = vi.fn();
    bus.on("sku.price", handler);

    bus.setData("sku.price", 100);
    expect(handler).toHaveBeenCalledWith(100);

    // 值没变不重复通知：避免订阅方 forceUpdate 打成死循环
    bus.setData("sku.price", 100);
    expect(handler).toHaveBeenCalledTimes(1);

    bus.setData("sku.price", 90);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith(90);

    // 别的键不该惊动这个订阅
    bus.setData("other", 1);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("deleteData 通知订阅方，载荷为 undefined", () => {
    const bus = createPluginBus();
    const handler = vi.fn();
    bus.on("coupon.applied", handler);
    bus.setData("coupon.applied", { code: "C10" });
    bus.deleteData("coupon.applied");

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith(undefined);

    // 本来就不存在时删除，不该发通知
    bus.deleteData("coupon.applied");
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("写入后订阅方读到的是新值（顺序：先落库再通知）", () => {
    const bus = createPluginBus();
    let seen: unknown;
    bus.on("qty", () => {
      seen = bus.getData("qty");
    });
    bus.setData("qty", 3);
    expect(seen).toBe(3);
  });
});
