import { describe, it, expect, vi } from "vitest";
import type {
  DanmakuItem,
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../src/components/DanmakuPlugin/plugins/types";
import { createDedupPlugin } from "../src/custom-plugins/DedupPlugin";
import { createRateLimitPlugin } from "../src/custom-plugins/RateLimitPlugin";
import { createKeywordHighlightPlugin } from "../src/custom-plugins/KeywordHighlightPlugin";
import { createKeywordBlockPlugin } from "../src/custom-plugins/KeywordBlockPlugin";
import { createUserMutePlugin } from "../src/custom-plugins/UserMutePlugin";
import { createEmojiRenderPlugin } from "../src/custom-plugins/EmojiRenderPlugin";
import { createAtMentionPlugin } from "../src/custom-plugins/AtMentionPlugin";
import { createGiftComboPlugin } from "../src/custom-plugins/GiftComboPlugin";
import { createLangFilterPlugin } from "../src/custom-plugins/LangFilterPlugin";
import { createColorPolicyPlugin } from "../src/custom-plugins/ColorPolicyPlugin";
import { createSpeedControlPlugin } from "../src/custom-plugins/SpeedControlPlugin";
import { createStylePresetPlugin } from "../src/custom-plugins/StylePresetPlugin";
import { createTrackStrategyPlugin } from "../src/custom-plugins/TrackStrategyPlugin";
import { createAuditLogPlugin } from "../src/custom-plugins/AuditLogPlugin";
import { createCmdParsePlugin } from "../src/custom-plugins/CmdParsePlugin";

const ctx = {
  bus: { emit: () => {} },
  shared: new Map(),
  getSize: () => ({ width: 0, height: 0 }),
} as unknown as DanmakuPluginContext;

function item(partial: Partial<DanmakuItem> & { id: string; text: string }): DanmakuItem {
  return {
    mode: "scroll",
    time: 0,
    meta: {},
    ...partial,
  } as DanmakuItem;
}

function run(plugin: DanmakuPlugin, data: DanmakuData): DanmakuData {
  return plugin.hooks.transformData!(ctx, data);
}

describe("数据面插件 transformData", () => {
  it("DedupPlugin 去重同用户同文案", () => {
    const data: DanmakuData = {
      items: [
        item({ id: "1", text: "哈哈", meta: { userId: "u1" }, time: 0 }),
        item({ id: "2", text: "哈哈", meta: { userId: "u1" }, time: 2 }),
        item({ id: "3", text: "哈哈", meta: { userId: "u2" }, time: 3 }),
      ],
    };
    const out = run(createDedupPlugin({ window: 5 }), data);
    expect(out.items.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("RateLimitPlugin 单用户限流", () => {
    const data: DanmakuData = {
      items: Array.from({ length: 5 }, (_, i) =>
        item({ id: String(i), text: "刷", meta: { userId: "u1" }, time: i })
      ),
    };
    const out = run(createRateLimitPlugin({ max: 3, window: 10 }), data);
    expect(out.items).toHaveLength(3);
  });

  it("KeywordHighlightPlugin 生成彩色分段", () => {
    const data: DanmakuData = {
      items: [item({ id: "1", text: "福利抽奖进行中" })],
    };
    const out = run(createKeywordHighlightPlugin({ keywords: ["福利"] }), data);
    const hint = out.items[0].renderHint!;
    expect(hint.rich).toBeDefined();
    expect(hint.rich!.some((s) => s.text === "福利")).toBe(true);
  });

  it("KeywordBlockPlugin 硬屏蔽命中词", () => {
    const data: DanmakuData = {
      items: [
        item({ id: "1", text: "正常弹幕" }),
        item({ id: "2", text: "这是广告词" }),
      ],
    };
    const out = run(createKeywordBlockPlugin({ words: ["广告"] }), data);
    expect(out.items.map((i) => i.id)).toEqual(["1"]);
  });

  it("UserMutePlugin 静音用户（管理员豁免）", () => {
    const data: DanmakuData = {
      items: [
        item({ id: "1", text: "a", meta: { userId: "bad" } }),
        item({ id: "2", text: "b", meta: { userId: "bad", isAdmin: true } }),
      ],
    };
    const out = run(createUserMutePlugin({ users: ["bad"] }), data);
    expect(out.items.map((i) => i.id)).toEqual(["2"]);
  });

  it("EmojiRenderPlugin 短码转义", () => {
    const data: DanmakuData = { items: [item({ id: "1", text: ":rocket: 起飞" })] };
    const out = run(createEmojiRenderPlugin(), data);
    expect(out.items[0].text).toBe("🚀 起飞");
  });

  it("AtMentionPlugin 标记 @提及", () => {
    const data: DanmakuData = { items: [item({ id: "1", text: "@主播 你好" })] };
    const out = run(createAtMentionPlugin(), data);
    const hint = out.items[0].renderHint!;
    expect(hint.rich).toBeDefined();
    expect(hint.rich!.some((s) => s.text === "@主播")).toBe(true);
  });

  it("GiftComboPlugin 连击聚合", () => {
    const data: DanmakuData = {
      items: [
        item({ id: "1", text: "火箭 x1", meta: { userId: "u1" }, time: 0 }),
        item({ id: "2", text: "火箭 x1", meta: { userId: "u1" }, time: 1 }),
      ],
    };
    const out = run(createGiftComboPlugin(), data);
    expect(out.items).toHaveLength(1);
    expect(out.items[0].text).toBe("火箭 x2");
    expect(out.items[0].meta.combo).toBe(2);
  });

  it("LangFilterPlugin 按语种放行", () => {
    const data: DanmakuData = {
      items: [
        item({ id: "1", text: "你好世界" }),
        item({ id: "2", text: "abc!!!" }),
      ],
    };
    const out = run(createLangFilterPlugin({ allow: ["cjk"] }), data);
    expect(out.items.map((i) => i.id)).toEqual(["1"]);
  });

  it("ColorPolicyPlugin 角色着色", () => {
    const data: DanmakuData = {
      items: [
        item({ id: "1", text: "a", meta: { isAdmin: true } }),
        item({ id: "2", text: "b", meta: { level: 20 } }),
        item({ id: "3", text: "c", meta: { level: 1 } }),
      ],
    };
    const out = run(createColorPolicyPlugin(), data);
    expect(out.items[0].meta.color).toBe("#ff4d4f");
    expect(out.items[1].meta.color).toBe("#ffd54a");
    expect(out.items[2].meta.color).toBeUndefined();
  });

  it("SpeedControlPlugin 缩放并夹取时长", () => {
    const data: DanmakuData = { items: [item({ id: "1", text: "a", duration: 8 })] };
    const out = run(createSpeedControlPlugin({ factor: 2, maxDuration: 10 }), data);
    expect(out.items[0].duration).toBe(10); // 8*2=16 被夹到 10
  });

  it("StylePresetPlugin 补齐样式默认", () => {
    const data: DanmakuData = { items: [item({ id: "1", text: "a" })] };
    const out = run(createStylePresetPlugin({ fontWeight: 600 }), data);
    expect(out.items[0].meta.fontWeight).toBe(600);
    expect(out.items[0].meta.fontFamily).toBeDefined();
  });

  it("TrackStrategyPlugin 高等级钉顶轨", () => {
    const data: DanmakuData = {
      items: [
        item({ id: "1", text: "a", meta: { level: 20 } }),
        item({ id: "2", text: "b", meta: { level: 1 } }),
      ],
    };
    const out = run(createTrackStrategyPlugin(), data);
    expect(out.items[0].renderHint!.track).toBe(0);
    expect(out.items[1].renderHint?.track).toBeUndefined();
  });

  it("AuditLogPlugin 旁路审计不增删", () => {
    const onLog = vi.fn();
    const data: DanmakuData = { items: [item({ id: "1", text: "a" })] };
    const out = run(createAuditLogPlugin({ onLog }), data);
    expect(onLog).toHaveBeenCalledTimes(1);
    expect(out.items).toHaveLength(1);
  });

  it("AuditLogPlugin 同一 id 重复进入流水线只审计一次", () => {
    const onLog = vi.fn();
    const plugin = createAuditLogPlugin({ onLog });
    const data: DanmakuData = { items: [item({ id: "1", text: "a" })] };
    // transformData 会随播放时钟反复执行，同一实例必须按 id 去重
    run(plugin, data);
    run(plugin, data);
    expect(onLog).toHaveBeenCalledTimes(1);
  });

  it("CmdParsePlugin 同一条指令只广播一次且保持不渲染", () => {
    const emit = vi.fn();
    const busCtx = { ...ctx, bus: { emit } } as unknown as DanmakuPluginContext;
    const plugin = createCmdParsePlugin();
    const data: DanmakuData = { items: [item({ id: "c1", text: "/clear" })] };
    const transform = plugin.hooks.transformData!;
    const first = transform(busCtx, data) as DanmakuData;
    const second = transform(busCtx, data) as DanmakuData;
    expect(emit).toHaveBeenCalledTimes(1);
    expect(first.items).toHaveLength(0);
    expect(second.items).toHaveLength(0);
  });
});
