/**
 * 浏览器内自测（?selftest=1）
 *
 * 为什么需要它：本仓库的浏览器工具链（截图 / DOM 快照）在部分环境下不可用，
 * 靠肉眼看截图也验不出「未就绪素材到底能不能被选中」。这里把断言搬进真实浏览器：
 * 挂载真实组件 → 派发真实点击 → 读真实 DOM，结果写进 document.title 供外部读取。
 *
 * 注意：不能用 `React.act` —— 生产构建里它会直接抛错。派发原生事件后等一轮 tick，
 * React 的批处理更新自会提交。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { AssetLibraryCore, createAssetLibrary, withAssetLibraryPlugins } from "../../../src";
import type { AssetItem } from "../../../src";
import { createEmptyStatePlugin } from "../../../src/custom-plugins/EmptyStatePlugin";
import { createKindFilterPlugin } from "../../../src/custom-plugins/KindFilterPlugin";
import { createLightBoxPlugin } from "../../../src/custom-plugins/LightBoxPlugin";
import { createPaginationPlugin } from "../../../src/custom-plugins/PaginationPlugin";
import { createSearchPlugin } from "../../../src/custom-plugins/SearchPlugin";
import { createSelectAllPlugin } from "../../../src/custom-plugins/SelectAllPlugin";
import { auditAssets, columnCount } from "./audit-asset";

const IMG = (hue: number) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60"><rect width="80" height="60" fill="hsl(${hue} 60% 50%)"/></svg>`
  )}`;

/** 12 项：9 ready / 2 processing / 1 failed；第 4 项标题与 1、4、7、10 项标签含「教程」 */
const ITEMS: AssetItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t-${i + 1}`,
  kind: i === 4 ? "video" : "image",
  src: IMG(i * 29),
  title: i === 3 ? "教程素材" : `素材 ${i + 1}`,
  tags: i % 3 === 0 ? ["教程"] : ["实拍"],
  size: 1000 * (i + 1),
  width: 1600,
  height: 1200,
  createdAt: `2026-0${(i % 9) + 1}-10`,
  status: i >= 9 ? (i === 11 ? "failed" : "processing") : "ready",
}));

const Bare = createAssetLibrary([]);
const Full = withAssetLibraryPlugins(AssetLibraryCore, [
  createSearchPlugin({ debounce: 60 }),
  createKindFilterPlugin({}),
  createSelectAllPlugin({ selectLabel: "全选本页", clearLabel: "取消" }),
  createPaginationPlugin({ pageSizes: [6, 12] }),
  createEmptyStatePlugin({}),
  createLightBoxPlugin({}),
]);

/**
 * 探针插件：把 ctx 的写入口暴露成真实按钮。
 *
 * 为什么不用「往搜索框里塞 value + 派发 input」来驱动筛选：那是 React 合成事件
 * 的链路，浏览器里派发的非受信事件能不能触发 onChange 取决于 React 版本的实现细节，
 * 断言失败时分不清是组件的问题还是驱动方式的问题。用真实按钮点一下 ctx.setQuery，
 * 测的才是「筛选 → 派生 → Core DOM」这条本包的链路；输入框的防抖属于 SearchPlugin
 * 自己的局部状态，另有单元测试与示例页覆盖。
 */
const Probe = withAssetLibraryPlugins(AssetLibraryCore, [
  createPaginationPlugin({ pageSizes: [6, 12] }),
  createEmptyStatePlugin({}),
  {
    name: "probe",
    version: "0.0.0",
    priority: 99,
    hooks: {
      renderToolbar: (ctx) => (
        <div data-probe-group>
          <button type="button" data-probe="hit" onClick={() => ctx.setQuery("教程")}>
            筛：教程
          </button>
          <button type="button" data-probe="miss" onClick={() => ctx.setQuery("绝对不存在的关键词")}>
            筛：无命中
          </button>
          <button type="button" data-probe="clear" onClick={() => ctx.clearFilters()}>
            清空条件
          </button>
        </div>
      ),
    },
  },
]);

/** 让 React 的被动 effect 跑完 —— flushSync 只刷渲染，不刷 effect */
const tick = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

interface MountOptions {
  width?: number;
  /** 给了 parent 就用静态定位挂进去（几何体检需要真实文档流高度） */
  parent?: HTMLElement;
}

async function mount(ui: React.ReactElement, options: MountOptions = {}) {
  const { width = 900, parent } = options;
  const host = document.createElement("div");
  host.style.cssText = parent
    ? `width:${width}px;background:#121110`
    : `position:fixed;left:0;top:0;width:${width}px;background:#121110`;
  (parent ?? document.body).appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  await tick();

  return {
    host,
    root,
    q: <T extends Element = HTMLElement>(sel: string) => host.querySelector(sel) as T | null,
    all: <T extends Element = HTMLElement>(sel: string) =>
      Array.from(host.querySelectorAll(sel)) as T[],
    click: async (el: Element | null) => {
      if (!el) throw new Error("元素不存在");
      flushSync(() => (el as HTMLElement).click());
      await tick();
    },
    done: async () => {
      flushSync(() => root.unmount());
      host.remove();
    },
  };
}

export interface SelfTestResult {
  total: number;
  passed: number;
  failed: string[];
}

export async function runSelfTest(): Promise<SelfTestResult> {
  const failed: string[] = [];
  let total = 0;
  const ok = (name: string, cond: boolean) => {
    total += 1;
    // 同步写入计数：卡住时能看出停在第几项
    document.title = `SELFTEST RUNNING ${total}`;
    if (!cond) failed.push(name);
  };

  // ---- 1. 裸 Core 结构 ----
  {
    const t = await mount(<Bare items={ITEMS} pageSize={12} />);
    const root = t.q(".vc-asset");
    const grid = t.q(".vc-asset__grid");
    const bg = root ? getComputedStyle(root).backgroundColor : "";
    ok("结构：容器自带不透明背景（ADR-13 不继承宿主）", !!bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent");
    ok("结构：网格 role=listbox", grid?.getAttribute("role") === "listbox");
    ok("结构：渲染 12 张卡", t.all(".vc-asset-card").length === 12);
    ok(
      "结构：卡片 role=option + aria-selected",
      t
        .all(".vc-asset-card")
        .every((c) => c.getAttribute("role") === "option" && c.hasAttribute("aria-selected"))
    );
    ok("结构：网格列数由容器宽度推导（≥2 列）", !!grid && columnCount(grid) >= 2);
    ok(
      "结构：roving tabindex —— 只有一张卡可 Tab 到",
      t.all('.vc-asset-card[tabindex="0"]').length === 1
    );
    await t.done();
  }

  // ---- 2. 选择语义 ----
  {
    const t = await mount(<Bare items={ITEMS} pageSize={12} />);
    const cards = t.all(".vc-asset-card");
    await t.click(cards[0]);
    ok("选择：点第一张 → data-selected=true", cards[0].dataset.selected === "true");
    await t.click(cards[1]);
    ok("选择：多选累加（两张都选中）", t.all('.vc-asset-card[data-selected="true"]').length === 2);
    await t.click(cards[0]);
    ok("选择：再点一次取消", cards[0].dataset.selected === "false");

    const proc = t.q('.vc-asset-card[data-status="processing"]');
    await t.click(proc);
    ok("选择：processing 素材点不动", proc?.dataset.selected === "false");
    const bad = t.q('.vc-asset-card[data-status="failed"]');
    await t.click(bad);
    ok("选择：failed 素材点不动", bad?.dataset.selected === "false");
    ok("选择：不可选项有 aria-disabled", proc?.getAttribute("aria-disabled") === "true");
    await t.done();
  }

  // ---- 3. 单选 / 上限 ----
  {
    const t = await mount(<Bare items={ITEMS} pageSize={12} multiple={false} />);
    const cards = t.all(".vc-asset-card");
    await t.click(cards[0]);
    await t.click(cards[1]);
    ok(
      "单选：multiple=false 时替换而不是累加",
      t.all('.vc-asset-card[data-selected="true"]').length === 1
    );
    await t.done();
  }
  {
    const t = await mount(<Bare items={ITEMS} pageSize={12} maxSelected={2} />);
    const cards = t.all(".vc-asset-card");
    await t.click(cards[0]);
    await t.click(cards[1]);
    await t.click(cards[2]);
    ok("上限：maxSelected=2 时第 3 张被拦", t.all('.vc-asset-card[data-selected="true"]').length === 2);
    ok("上限：被拦的卡片标 data-blocked=true", cards[2].dataset.blocked === "true");
    await t.click(cards[0]);
    ok(
      "上限：已选项仍可取消（不被上限锁死）",
      t.all('.vc-asset-card[data-selected="true"]').length === 1
    );
    await t.done();
  }

  // ---- 4. 键盘导航 ----
  {
    const t = await mount(<Bare items={ITEMS} pageSize={12} />);
    const first = t.all(".vc-asset-card")[0];
    first.focus();
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    const focused = document.activeElement as HTMLElement | null;
    ok(
      "键盘：→ 把焦点移到下一张卡",
      focused !== first && focused?.classList.contains("vc-asset-card") === true
    );
    ok("键盘：移动焦点不等于选中", first.dataset.selected === "false");
    focused?.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await tick();
    ok("键盘：Space 才选中", focused?.dataset.selected === "true");
    await t.done();
  }

  // ---- 5. 插件：分页 / 全选 ----
  {
    const t = await mount(<Full items={ITEMS} pageSize={6} />);
    ok("分页：pageSize=6 时只渲染 6 张", t.all(".vc-asset-card").length === 6);
    ok("搜索：插件渲染出 input[type=search]", !!t.q('input[type="search"]'));

    const selectAllBtn = t
      .all<HTMLButtonElement>(".vc-asset-toolbar button")
      .find((b) => (b.textContent ?? "").includes("全选"));
    ok("全选：按钮存在且文案带数量", /全选本页（\d+）/.test(selectAllBtn?.textContent ?? ""));
    await t.click(selectAllBtn ?? null);
    ok(
      "全选：只选当前页就绪项（本页 6 项全 ready）",
      t.all('.vc-asset-card[data-selected="true"]').length === 6
    );
    await t.done();
  }

  // ---- 6. 过滤链路与空态分叉 ----
  {
    const t = await mount(<Probe items={ITEMS} pageSize={6} />);
    ok("过滤：初始分页 6 张", t.all(".vc-asset-card").length === 6);

    await t.click(t.q('[data-probe="hit"]'));
    // 12 项里 t-1/t-4/t-7/t-10 命中「教程」（标签 + 标题），且只剩 4 项时不受分页影响
    const hit = t.all(".vc-asset-card").length;
    ok(`过滤：query=教程 → 4 项（实际 ${hit}）`, hit === 4);

    await t.click(t.q('[data-probe="clear"]'));
    const reset = t.all(".vc-asset-card").length;
    ok(`过滤：清空条件回到分页 6 张（实际 ${reset}）`, reset === 6);

    await t.click(t.q('[data-probe="miss"]'));
    const emptyEl = t.q(".vc-asset__empty");
    // 失败时把现场写进名字：空态节点缺失 vs 原因不对，是两件事
    const evidence = emptyEl
      ? `reason=${emptyEl.getAttribute("data-reason")}`
      : `无空态节点，卡片 ${t.all(".vc-asset-card").length} 张`;
    ok(
      `空态：筛空给 data-reason=filtered（${evidence}）`,
      emptyEl?.getAttribute("data-reason") === "filtered"
    );
    await t.done();
  }
  {
    const Empty = withAssetLibraryPlugins(AssetLibraryCore, [createEmptyStatePlugin({})]);
    const t = await mount(<Empty items={[]} />);
    const emptyEl = t.q(".vc-asset__empty");
    ok("空态：空库渲染 .vc-asset__empty", !!emptyEl);
    ok("空态：data-reason=empty", emptyEl?.getAttribute("data-reason") === "empty");
    await t.done();
  }

  // ---- 7. 大图浮层 ----
  {
    const t = await mount(<Full items={ITEMS.slice(0, 4)} pageSize={4} />);
    const first = t.all(".vc-asset-card")[0];
    first.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await tick();
    const box = t.q(".vc-asset-lightbox");
    ok(`浮层：双击打开 .vc-asset-lightbox（${box ? "已开到" : "没打开"}）`, !!box);
    ok(`浮层：role=dialog（${box?.getAttribute("role") ?? "无节点"}）`, box?.getAttribute("role") === "dialog");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await tick();
    ok("浮层：Esc 关闭", !t.q(".vc-asset-lightbox"));
    await t.done();
  }

  // ---- 8. 插件沙箱隔离 ----
  {
    const Bomb = withAssetLibraryPlugins(AssetLibraryCore, [
      {
        name: "bomb",
        version: "1.0.0",
        priority: 10,
        hooks: {
          renderToolbar() {
            throw new Error("插件炸了");
          },
        },
      },
      createPaginationPlugin({}),
    ]);
    const t = await mount(<Bomb items={ITEMS} pageSize={6} />);
    ok("沙箱：单个插件抛错不影响整墙渲染", t.all(".vc-asset-card").length === 6);
    ok("沙箱：其它插件的槽位仍在（分页器还在）", !!t.q(".vc-asset-pager"));
    await t.done();
  }

  // ---- 9. 几何体检（真实文档流里量） ----
  {
    const scope = document.createElement("div");
    document.body.appendChild(scope);
    const card = document.createElement("div");
    card.className = "scn-card";
    card.dataset.scenario = "selftest";
    const stageBox = document.createElement("div");
    stageBox.className = "scn-stage";
    card.appendChild(stageBox);
    scope.appendChild(card);

    const t = await mount(<Full items={ITEMS} pageSize={12} />, { parent: stageBox });
    const issues = auditAssets(scope);
    ok("几何体检：无溢出 / 零尺寸 / 0 列 / 缺空态", issues.length === 0);
    if (issues.length) console.warn("[selftest] audit issues", issues);

    await t.done();
    scope.remove();
  }

  // ---- 10. 演示台外壳（放在最后：lazy 页面此时一定已挂载，顺带证明当前路由没崩） ----
  {
    const navItems = document.querySelectorAll(".side .nav-item").length;
    ok(`外壳：主导航 ≥3 项（实际 ${navItems}）`, navItems >= 3);
    const main = document.querySelector("#main");
    const text = (main?.textContent ?? "").trim();
    ok(`外壳：主内容区已渲染（${text.length} 字）`, text.length > 40);
    ok("外壳：没有落进错误兜底页", document.querySelector(".crash") === null);

    // 路由自检：同一条命令可以扫全部页面，页面渲染坏了会直接体现在标题里
    const hash = location.hash.replace(/^#/, "") || "/";
    if (hash.startsWith("/demo/")) {
      const stage = document.querySelectorAll(".demo .plate-body").length;
      ok(`路由 ${hash}：示例页舞台已挂载（${stage}）`, stage === 1);
    } else if (hash.startsWith("/plugins")) {
      const checks = document.querySelectorAll(".ws-check").length;
      ok(`路由 ${hash}：插件目录 20 条（${checks}）`, checks === 20);
    } else if (hash.startsWith("/scenarios")) {
      const cards = document.querySelectorAll(".scn-card").length;
      ok(`路由 ${hash}：场景卡 ≥4 张（${cards}）`, cards >= 4);
    } else {
      ok(`路由 ${hash}：总览 hero 已渲染`, !!document.querySelector(".hp-hero"));
    }
  }

  return { total, passed: total - failed.length, failed };
}

/** 供 main.tsx 调用：跑完把结论写进 document.title，便于外部（无截图时）读取 */
export async function runSelfTestToTitle(): Promise<void> {
  // 先落一个「已启动」标记：便于区分「根本没跑」与「跑了一半卡住」
  document.title = "SELFTEST RUNNING";
  try {
    const r = await runSelfTest();
    document.title =
      r.failed.length === 0
        ? `SELFTEST OK ${r.passed}/${r.total}`
        : `SELFTEST FAIL ${r.passed}/${r.total} :: ${r.failed.join(" | ")}`;
  } catch (e) {
    document.title = `SELFTEST ERROR :: ${(e as Error).message}`;
  }
}
