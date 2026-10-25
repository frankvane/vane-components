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
});
