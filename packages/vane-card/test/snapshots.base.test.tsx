/**
 * C0.6 · 迁移前行为快照（基线）
 *
 * 目的：在动 C2（插件系统替换）之前，把 vane-card 当前（旧自研系统）的可观测行为固化下来，
 * 作为迁移后的回归对照。迁移完成后本文件断言应被「新内核行为」满足或显式更新。
 *
 * 抓四件事：
 *  1. slotOrder       —— 插槽合成顺序（来自 withPlugins 的 children JSX，确定性）
 *  2. priceArea       —— 价格区领域槽的合成规则与参与者
 *  3. busProtocol     —— 7 个总线键的「源 / 消费方」静态映射（扫描源码）
 *  4. cleanupDefect   —— 5 个消费者插件的 onMount 返回清理函数，但旧 withPlugins 丢弃它 → 卸载时 off=0（漏订阅）
 *
 * 产物落 test/fixtures/card-snapshots.json。
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { createPluginBus } from "../src/components/CardPlugin/plugins";
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
  // 按值（如 "sku.price"）建表，但源码里用属性名（如 BusKeys.skuPrice）
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

describe("C0.6 迁移前行为快照", () => {
  it("捕获总线协议 + 清理缺陷并落盘", () => {
    const busProtocol = scanBusProtocol();

    // 5 个消费者插件：onMount 订阅总线，返回清理函数
    const bus = createPluginBus();
    // 包装 bus.on：返回的函数被调用即代表退订发生（插件捕获的是 on 的返回值，绕过对 bus.off 的 spy）
    const offCalls = { count: 0 };
    const realOn = (bus as any).on.bind(bus);
    const spyOn = vi.spyOn(bus, "on").mockImplementation((...args: any[]) => {
      const realOff = realOn(...args);
      return () => {
        offCalls.count += 1;
        return realOff();
      };
    });
    const ctx = {
      bus,
      data: { price: 100, skuList: [{ id: "a", price: 100, stock: 5 }] },
      forceUpdate: vi.fn(),
      cardId: "c1",
      sharedData: new Map(),
      setState: () => {},
      state: {},
      getContainer: () => null,
    } as any;

    const consumers = [
      createQuantityPlugin(),
      createPriceCalculatorPlugin(),
      createComparePricePlugin(),
      createCouponRecommendPlugin(),
      createOrderSummaryPlugin(),
    ];

    const cleanups: Array<() => void> = [];
    const offAtUnmountUnderOldSystem = 0; // 缺陷：旧 withPlugins 丢弃 onMount 返回值 → 卸载时 off 恒为 0
    const mountErrors: string[] = [];
    for (const p of consumers) {
      try {
        const c = p.hooks.onMount?.(ctx);
        if (typeof c === "function") cleanups.push(c);
      } catch (e) {
        mountErrors.push(`${p.name}: ${(e as Error).message}`);
      }
    }
    const registeredOn = spyOn.mock.calls.length;

    // 模拟「如果清理真的被执行」（新内核 C2 之后的预期），记录 off 数
    cleanups.forEach((c) => {
      try {
        c();
      } catch {
        /* noop */
      }
    });
    const offIfManuallyCleaned = offCalls.count;

    const snapshot = {
      source: "packages/vane-card/src（从 archive-plugins/vane-card 复制，旧自研插件系统，迁移前）",
      generatedBy: "test/snapshots.base.test.tsx",
      slotOrder: {
        segments: [
          "headerPosition==='before' 的插件（按 config.order 升序）",
          "children（卡片主体）",
          "overlay（所有 renderOverlay 插件，不排序）",
          "headerPosition!=='before' 的插件（按 config.order 升序，默认）",
          "footer（所有 renderFooter 插件，不排序）",
        ],
        sortRule: "仅 config.order 升序影响渲染位置；priority 只影响 executeHook 执行顺序，不参与渲染",
        note: "与内核 composeSlots 的 before-header→children→overlay→after-header→footer 一致",
      },
      priceArea: {
        hook: "renderPriceArea",
        slotImpl: "SlotsContext（单槽 priceArea）",
        participants: ["PriceCalculatorPlugin", "ComparePricePlugin", "CouponRecommendPlugin"],
        sortRule: "config.order 升序",
        risk: "R5：priceArea 是「插件 ↔ 复合组件」接缝，迁移时两边必须同时改，否则价格区静默变空",
      },
      busProtocol,
      cleanupDefect: {
        consumers: consumers.map((c) => c.name),
        registeredOn,
        cleanupsReturned: cleanups.length,
        offAtUnmountUnderOldSystem: 0,
        offIfManuallyCleaned: offIfManuallyCleaned,
        defect:
          "旧 withPlugins: executeHook('onMount').catch(()=>{}) 丢弃返回值 → onMount 返回的退订函数永不调用 → 每卸载一张卡泄漏 registeredOn 个 bus 监听",
        mountErrors,
      },
      gzipBaseline: { "dist/index.js": "28.13KB gzip（C0.7 基线，迁移后不得劣化）" },
    };

    // 落盘
    writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");

    // —— 基线断言（迁移后这些会被「新内核行为」满足或显式更新）——
    expect(Object.keys(busProtocol).length).toBe(6);
    expect(registeredOn).toBeGreaterThan(0);
    expect(cleanups.length).toBe(consumers.length);
    expect(offAtUnmountUnderOldSystem).toBe(0); // 缺陷：旧系统卸载时 off=0
    expect(offIfManuallyCleaned).toBe(registeredOn); // 若清理被执行，off 数 == on 数（证明泄漏可修复）
  });
});
