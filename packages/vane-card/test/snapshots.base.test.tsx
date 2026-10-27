/**
 * C0.6 → C2 行为基线（回归）
 *
 * 用途：迁移后用真实内核验证「清理计数 on=N/off=N」（R2 已修复），并保留总线协议
 * 静态映射作为文档基线，落盘到 test/fixtures/card-snapshots.json。
 *
 * 关键变化（相对迁移前）：
 *  - 旧快照 cleanupDefect.offAtUnmountUnderOldSystem = 0（leak）；
 *  - 新内核：onMount 返回值被登记为清理函数，clear() 时逆序执行 → off === on。
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { createPluginManager, createPluginBus } from "@vane/plugin-core";
import { BusKeys } from "../src/components/CardPlugin/plugins/BusKeys";
import { createSKUPlugin } from "../src/components/CardPlugin/custom-plugins";
import { createQuantityPlugin } from "../src/components/CardPlugin/custom-plugins";
import { createPriceCalculatorPlugin } from "../src/components/CardPlugin/custom-plugins";
import { createComparePricePlugin } from "../src/components/CardPlugin/custom-plugins";
import { createCouponRecommendPlugin } from "../src/components/CardPlugin/custom-plugins";
import { createOrderSummaryPlugin } from "../src/components/CardPlugin/custom-plugins";

const ROOT = process.cwd();
const CUSTOM_DIR = path.join(ROOT, "src/components/CardPlugin/custom-plugins");
const OUT = path.join(ROOT, "test/fixtures/card-snapshots.json");

/** 扫描每个插件源码，把 BusKeys.X 归类为「写」（emit/setData）或「读」（on/getData/subscribe） */
function scanBusProtocol() {
  const protocol: Record<string, { writers: string[]; readers: string[] }> = {};
  const names = Object.keys(BusKeys) as Array<keyof typeof BusKeys>;
  for (const name of names) protocol[BusKeys[name]] = { writers: [], readers: [] };

  for (const dirName of readdirSync(CUSTOM_DIR)) {
    const f1 = path.join(CUSTOM_DIR, dirName, "index.ts");
    const f2 = path.join(CUSTOM_DIR, dirName, "index.tsx");
    const fp = existsSync(f1) ? f1 : existsSync(f2) ? f2 : null;
    if (!fp) continue;
    const src = readFileSync(fp, "utf-8");
    for (const name of names) {
      const value = BusKeys[name];
      const token = `BusKeys.${name}`;
      if (!src.includes(token)) continue;
      const lines = src.split("\n").filter((l) => l.includes(token));
      let isWriter = false;
      let isReader = false;
      for (const l of lines) {
        if (/\b(emit|setData)\s*(\?\.)?\s*\(/.test(l) && l.includes(token)) isWriter = true;
        if (/\b(on|getData)\s*(\?\.)?\s*\(/.test(l) && l.includes(token)) isReader = true;
        if (l.includes("setupForceUpdateOnBusKeys") && l.includes(token)) isReader = true;
      }
      if (isWriter && !protocol[value].writers.includes(dirName)) protocol[value].writers.push(dirName);
      if (isReader && !protocol[value].readers.includes(dirName)) protocol[value].readers.push(dirName);
    }
  }
  return protocol;
}

describe("C2 行为基线（R2 修复 + 总线协议）", () => {
  it("总线协议扫描 + R2 清理计数 on=N/off=N 并落盘", async () => {
    const busProtocol = scanBusProtocol();

    // —— 真实内核：5 个消费者插件 onMount 订阅总线，返回清理函数 ——
    const bus = createPluginBus();
    const offCalls = { count: 0 };
    const realOn = (bus as any).on.bind(bus);
    vi.spyOn(bus, "on").mockImplementation((...args: any[]) => {
      const realOff = realOn(...args);
      return () => {
        offCalls.count += 1;
        return realOff();
      };
    });

    const manager = createPluginManager();
    const consumers = [
      createSKUPlugin(),
      createQuantityPlugin(),
      createPriceCalculatorPlugin(),
      createComparePricePlugin(),
      createCouponRecommendPlugin(),
      createOrderSummaryPlugin(),
    ];
    manager.registerAll(consumers as any);

    const ctx: any = {
      bus,
      data: { price: 100, skuList: [{ id: "a", price: 100, stock: 5 }] },
      forceUpdate: vi.fn(),
      cardId: "c1",
      sharedData: new Map(),
      setState: () => {},
      state: {},
      getContainer: () => null,
    };

    await manager.executeHook("onMount", ctx);
    const registeredOn = (bus.on as any).mock.calls.length;

    // 卸载：内核 clear() 逆序执行 onMount 返回的清理函数 → bus.off 计数 == on 计数
    manager.clear();
    const offAtUnmount = offCalls.count;

    const snapshot = {
      source:
        "packages/vane-card/src（C2 迁移后：@vane/plugin-core 内核，旧自研系统已删除）",
      generatedBy: "test/snapshots.base.test.tsx",
      slotOrder: {
        segments: [
          "headerPosition==='before' 的插件（按 config.order 升序）",
          "children（卡片主体）",
          "overlay（所有 renderOverlay 插件，按 config.order 升序 → priority 降序）",
          "headerPosition!=='before' 的插件（按 config.order 升序，默认）",
          "footer（所有 renderFooter 插件，按 config.order 升序 → priority 降序）",
        ],
        sortRule:
          "config.order 升序影响渲染位置；priority 降序为同级 tiebreak（内核 renderPluginSlot 规则，旧版仅 order、且 overlay/footer 不排序）",
        note: "与内核 composeSlots 的 before-header→children→overlay→after-header→footer 一致",
      },
      priceArea: {
        hook: "renderPriceArea",
        slotImpl: "包内领域槽 slots.tsx（renderDomainSlot）",
        participants: ["PriceCalculatorPlugin", "ComparePricePlugin", "CouponRecommendPlugin"],
        sortRule: "config.order 升序 → priority 降序",
        risk: "R5：priceArea 是「插件 ↔ 复合组件」接缝，迁移时两边必须同时改，否则价格区静默变空",
      },
      busProtocol,
      cleanupDefect: {
        consumers: consumers.map((c) => c.name),
        registeredOn,
        offAtUnmount,
        r2Fixed: registeredOn > 0 && offAtUnmount === registeredOn,
        note: "R2 已修复：旧 withPlugins 丢弃 onMount 返回值（off=0）；新内核登记清理函数并在 clear() 逆序执行（off===on）",
      },
      gzipBaseline: {
        "dist/index.js": "≤36KB gzip（C0.7 基线 28.13KB，接内核后不得劣化）",
      },
    };

    // 默认「比对」提交在库里的基线；只有显式 UPDATE_SNAPSHOT=1 才重写。
    // 这样任一插件改了总线读写关系或槽位顺序，都会红而不是被静默覆盖。
    if (process.env.UPDATE_SNAPSHOT === "1") {
      writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
    } else {
      expect(existsSync(OUT), "缺少基线，请用 UPDATE_SNAPSHOT=1 生成").toBe(true);
      expect(JSON.parse(readFileSync(OUT, "utf-8"))).toEqual(snapshot);
    }

    // —— 断言 ——
    expect(Object.keys(busProtocol).length).toBe(6);
    expect(registeredOn).toBeGreaterThan(0);
    expect(offAtUnmount).toBe(registeredOn); // R2：卸载后 off == on
  });
});
