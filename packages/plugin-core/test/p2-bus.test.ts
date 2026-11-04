import { describe, expect, it, vi } from "vitest";
import { createPluginBus } from "../src/bus/PluginBus";

describe("P2-1 once 异常也注销", () => {
  it("handler 抛错后再次 emit 不再调用", () => {
    const bus = createPluginBus();
    const handler = vi.fn(() => {
      throw new Error("boom");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    bus.once("a", handler);
    bus.emit("a"); // 抛错由 emit 捕获
    bus.emit("a");
    expect(handler).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("P2-4 getAll 防原型键", () => {
  it("__proto__ 作为普通数据键返回，不污染对象原型", () => {
    const bus = createPluginBus();
    bus.setData("__proto__", { polluted: true });
    const all = bus.getAll();
    expect(Object.keys(all)).toContain("__proto__");
    expect(Object.getPrototypeOf(all)).toBeNull();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("P2-7 总线写入重入保护", () => {
  it("A→B→A 联动写入超过深度阈值时中断并告警，不栈溢出", () => {
    const bus = createPluginBus();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    bus.on("a", (value: number) => bus.setData("b", value + 1));
    bus.on("b", (value: number) => bus.setData("a", value + 1));
    bus.setData("a", 0);
    expect(warn).toHaveBeenCalled();
    expect(typeof bus.getData("a")).toBe("number");
    warn.mockRestore();
  });
});
