import { describe, it, expect, vi } from "vitest";
import { createSensitiveFilterPlugin } from "../src/custom-plugins/SensitiveFilterPlugin";
import { createPinnedTopPlugin } from "../src/custom-plugins/PinnedTopPlugin";
import { createCmdParsePlugin } from "../src/custom-plugins/CmdParsePlugin";
import { createFanBadgePlugin } from "../src/custom-plugins/FanBadgePlugin";
import type { DanmakuData, DanmakuPluginContext } from "../src/components/DanmakuPlugin/plugins/types";

function ctxStub(): DanmakuPluginContext {
  return {
    props: {} as any,
    data: { items: [] },
    bus: { emit: vi.fn() } as any,
    refs: {},
    state: {},
    setState: () => {},
    shared: new Map(),
    deviceInfo: {} as any,
    forceUpdate: () => {},
    getSize: () => ({ width: 0, height: 0 }),
    logger: console,
  } as DanmakuPluginContext;
}

describe("vane-danmaku 数据面插件", () => {
  it("SensitiveFilterPlugin 打码命中词", () => {
    const p = createSensitiveFilterPlugin({ words: ["广告", "代刷"], mode: "mask" });
    const data: DanmakuData = {
      items: [
        { id: "1", text: "正常弹幕", mode: "scroll", time: 0, meta: {} },
        { id: "2", text: "广告 加微信", mode: "scroll", time: 0, meta: {} },
      ],
    };
    const out = (p.hooks.transformData as any)(ctxStub(), data) as DanmakuData;
    expect(out.items[0].text).toBe("正常弹幕");
    expect(out.items[1].text).not.toContain("广告");
    expect(out.items[1].renderHint?.masked).toBe(true);
  });

  it("PinnedTopPlugin 高等级弹幕置顶 + 高赞环", () => {
    const p = createPinnedTopPlugin({ minLevel: 20 });
    const data: DanmakuData = {
      items: [
        { id: "1", text: "路人", mode: "scroll", time: 0, meta: { level: 1 } },
        { id: "2", text: "大佬", mode: "scroll", time: 0, meta: { level: 30 } },
      ],
    };
    const out = (p.hooks.transformData as any)(ctxStub(), data) as DanmakuData;
    expect(out.items[0].renderHint?.pinned).toBeUndefined();
    expect(out.items[1].renderHint?.pinned).toBe(true);
    expect(out.items[1].renderHint?.ring).toBe(true);
  });

  it("CmdParsePlugin 拦截指令并从渲染流移除 + 发事件", () => {
    const p = createCmdParsePlugin();
    const emit = vi.fn();
    const ctx = ctxStub();
    ctx.bus = { emit } as any;
    const data: DanmakuData = {
      items: [
        { id: "1", text: "普通弹幕", mode: "scroll", time: 0, meta: {} },
        { id: "2", text: "/clear", mode: "scroll", time: 0, meta: {} },
      ],
    };
    const out = (p.hooks.transformData as any)(ctx, data) as DanmakuData;
    expect(out.items).toHaveLength(1);
    expect(emit).toHaveBeenCalledWith("danmaku:command", expect.objectContaining({ type: "clear" }));
  });

  it("FanBadgePlugin 按 userId 富化粉丝牌", () => {
    const p = createFanBadgePlugin({
      badges: { u1: { name: "老粉", level: 6, color: "#ff7a29" } },
    });
    const data: DanmakuData = {
      items: [
        { id: "1", text: "x", mode: "scroll", time: 0, meta: { userId: "u1" } },
        { id: "2", text: "y", mode: "scroll", time: 0, meta: { userId: "u2" } },
      ],
    };
    const out = (p.hooks.transformData as any)(ctxStub(), data) as DanmakuData;
    expect(out.items[0].meta.fanBadge?.name).toBe("老粉");
    expect(out.items[1].meta.fanBadge).toBeUndefined();
  });
});
