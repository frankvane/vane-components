/**
 * 浏览器内自测（?selftest=1）
 *
 * 为什么需要它：本仓库的浏览器工具链（截图 / DOM 快照）在部分环境下不可用，
 * 靠肉眼看截图也验不出「推进按钮是否真的挪了列」。这里把断言搬进真实浏览器：
 * 挂载真实组件 → 派发真实点击 → 读真实 DOM，结果写进 document.title 供外部读取。
 *
 * 注意：不能用 React.act() —— 生产构建里 React.act 直接抛错。
 * 派发原生事件后等一轮 tick，React 的批处理更新自会提交。
 *
 * import 用相对路径指回 src（而非 "vane-candidate" 包名）：本文件同时被
 * vitest（test/selftest.dom.test.tsx）复用，测试环境没有 demo 的包名 alias。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { CandidateCore, withPlugins } from "../../../src";
import type { Candidate, StageConfig } from "../../../src";
import { createScorePlugin } from "../../../src/custom-plugins/ScorePlugin";
import { createDupCheckPlugin } from "../../../src/custom-plugins/DupCheckPlugin";
import { createTagPlugin } from "../../../src/custom-plugins/TagPlugin";
import { createOfferPlugin } from "../../../src/custom-plugins/OfferPlugin";
import { createStarPlugin } from "../../../src/custom-plugins/StarPlugin";
import { createStageFlowPlugin } from "../../../src/custom-plugins/StageFlowPlugin";
import { createNotePlugin } from "../../../src/custom-plugins/NotePlugin";
import { createInterviewSlotPlugin } from "../../../src/custom-plugins/InterviewSlotPlugin";
import { createRejectTplPlugin } from "../../../src/custom-plugins/RejectTplPlugin";
import { createFilterPlugin } from "../../../src/custom-plugins/FilterPlugin";
import { createSearchPlugin } from "../../../src/custom-plugins/SearchPlugin";
import { createBatchOpPlugin } from "../../../src/custom-plugins/BatchOpPlugin";
import { createViewSwitchPlugin } from "../../../src/custom-plugins/ViewSwitchPlugin";
import { createArchivePoolPlugin } from "../../../src/custom-plugins/ArchivePoolPlugin";
import { createExportPlugin } from "../../../src/custom-plugins/ExportPlugin";
import { createStatsPlugin } from "../../../src/custom-plugins/StatsPlugin";
import { createActivityLogPlugin } from "../../../src/custom-plugins/ActivityLogPlugin";
import { createRecommendSortPlugin } from "../../../src/custom-plugins/RecommendSortPlugin";
import { createContactMaskPlugin } from "../../../src/custom-plugins/ContactMaskPlugin";
import { SAMPLE_CANDIDATES, SAMPLE_STAGES } from "../data/sample";
import { auditCandidate } from "./audit-candidate";

/** 让 React 的被动 effect（useEffect）跑完 —— flushSync 只刷渲染，不刷 effect */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

async function mount(ui: React.ReactElement) {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:0;top:0;width:1280px;background:#fff";
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  await tick();
  return {
    host,
    root,
    q: (sel: string) => host.querySelector(sel) as HTMLElement | null,
    qa: (sel: string) => Array.from(host.querySelectorAll(sel)) as HTMLElement[],
    click: async (sel: string) => {
      const el = host.querySelector(sel) as HTMLElement | null;
      if (!el) throw new Error(`找不到元素 ${sel}`);
      flushSync(() => el.click());
      await tick();
    },
    clickText: async (sel: string, text: string) => {
      const el = (Array.from(host.querySelectorAll(sel)) as HTMLElement[]).find((e) =>
        e.textContent?.includes(text)
      );
      if (!el) throw new Error(`找不到含「${text}」的 ${sel}`);
      flushSync(() => el.click());
      await tick();
    },
  };
}

type Mounted = Awaited<ReturnType<typeof mount>>;

/** 候选人卡片当前所在的阶段列 key */
function columnOf(t: Mounted, id: string): string | null {
  return (
    t.host
      .querySelector(`.vcd-card[data-candidate-id="${id}"]`)
      ?.closest("[data-stage-key]")
      ?.getAttribute("data-stage-key") ?? null
  );
}

/** 给非受控 input/select 赋值并派发原生事件（React 的受控追踪能读到新值） */
function setNativeValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

/** 提交浮层里的表单（React onSubmit 监听冒泡的 submit） */
function submitForm(input: HTMLInputElement) {
  const form = input.closest("form");
  if (!form) throw new Error("找不到所属表单");
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

/** 全家桶装配：19 个官方插件一次装满 */
function makeFullBoard() {
  return withPlugins(CandidateCore, [
    createScorePlugin({}),
    createDupCheckPlugin({}),
    createTagPlugin({}),
    createOfferPlugin({}),
    createStarPlugin({}),
    createStageFlowPlugin({}),
    createNotePlugin({}),
    createInterviewSlotPlugin({}),
    createRejectTplPlugin({}),
    createFilterPlugin({}),
    createSearchPlugin({}),
    createBatchOpPlugin({}),
    createViewSwitchPlugin({}),
    createArchivePoolPlugin({}),
    createExportPlugin({}),
    createStatsPlugin({}),
    createActivityLogPlugin({}),
    createRecommendSortPlugin({}),
    createContactMaskPlugin({}),
  ]) as unknown as React.ComponentType<{
    data?: Candidate[];
    stages?: StageConfig[];
    containerStyle?: React.CSSProperties;
  }>;
}

const BOARDS = {
  flow: withPlugins(CandidateCore, [createStageFlowPlugin()]),
  note: withPlugins(CandidateCore, [createNotePlugin({ authorName: "自测" })]),
  filter: withPlugins(CandidateCore, [createFilterPlugin()]),
  pool: withPlugins(CandidateCore, [createArchivePoolPlugin()]),
  sort: withPlugins(CandidateCore, [createRecommendSortPlugin({ by: "score", desc: true })]),
  mask: withPlugins(CandidateCore, [createContactMaskPlugin({})]),
  view: withPlugins(CandidateCore, [createViewSwitchPlugin()]),
  reject: withPlugins(CandidateCore, [createRejectTplPlugin()]),
  search: withPlugins(CandidateCore, [createSearchPlugin()]),
  tags: withPlugins(CandidateCore, [createTagPlugin()]),
  log: withPlugins(CandidateCore, [createActivityLogPlugin()]),
  slot: withPlugins(CandidateCore, [createInterviewSlotPlugin()]),
  star: withPlugins(CandidateCore, [createStarPlugin({ pinTop: false })]),
  batch: withPlugins(CandidateCore, [createBatchOpPlugin()]),
};

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

  // ---- 1. 全家桶装配：19 个插件一次装满 ----
  {
    const Board = makeFullBoard();
    const t = await mount(
      <Board data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />
    );
    ok("装配：渲染出 6 个阶段列", t.qa(".vcd-column").length === 6);
    ok("装配：看板 10 张卡（c-011 已归档被滤出）", t.qa(".vcd-card").length === 10);
    ok("徽章：匹配分胶囊渲染（92分）", t.host.textContent?.includes("92分") === true);
    ok("徽章：Offer 已发出 徽章渲染", t.host.textContent?.includes("Offer 已发出") === true);
    ok("徽章：疑似重复 警示渲染（c-010 × c-001）", t.host.textContent?.includes("疑似重复") === true);
    ok("工具栏：搜索框渲染", !!t.q('[aria-label="搜索候选人"]'));
    ok("工具栏：人才库入口带计数（1）", t.host.textContent?.includes("人才库（1）") === true);
    ok("工具栏：导出按钮渲染", !!t.q('[aria-label="导出候选人列表为 CSV"]'));
    ok("统计：列头计数徽章渲染（已投递 3 人）", !!t.q('[aria-label="已投递 3 人"]'));
    ok("页脚：漏斗统计渲染", t.q(".vcd-footer")?.textContent?.includes("漏斗") === true);
    ok("几何体检：全家桶无溢出/零尺寸/塌列", auditCandidate(t.host).length === 0);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 2. 阶段流转 ----
  {
    const t = await mount(
      <BOARDS.flow data={SAMPLE_CANDIDATES.slice(0, 5)} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />
    );
    ok("流转：初始 c-001 在 interview 列", columnOf(t, "c-001") === "interview");
    await t.click('[aria-label="将 陈知远 推进到下一阶段"]');
    ok("流转：点 ▶ 后 c-001 移到 offer 列", columnOf(t, "c-001") === "offer");
    ok("流转：总卡数不变（5）", t.qa(".vcd-card").length === 5);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 3. 备注 ----
  {
    const t = await mount(<BOARDS.note data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    await t.click('[aria-label="陈知远 的备注（1 条）"]');
    ok("备注：浮层打开（备注 · 陈知远）", !!t.q('[role="dialog"][aria-label="备注 · 陈知远"]'));
    const input = t.q('[aria-label="备注内容"]') as HTMLInputElement;
    input.value = "自测备注A";
    submitForm(input);
    await tick();
    ok("备注：提交后浮层出现新备注", t.host.textContent?.includes("自测备注A") === true);
    ok("备注：按钮角标计数 +1（2 条）", !!t.q('[aria-label="陈知远 的备注（2 条）"]'));
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 4. 筛选 ----
  {
    const t = await mount(<BOARDS.filter data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    setNativeValue(t.q('[aria-label="按阶段筛选"]') as HTMLSelectElement, "interview");
    await tick();
    ok("筛选：选 interview 后看板只剩 2 张卡", t.qa(".vcd-card").length === 2);
    await t.clickText("button", "清除筛选");
    ok("筛选：清除后恢复全量 11 张卡（本板未装 ArchivePool，归档者仍在）", t.qa(".vcd-card").length === 11);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 5. 归档池 ----
  {
    const t = await mount(<BOARDS.pool data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    ok("归档池：初始看板 10 张卡", t.qa(".vcd-card").length === 10);
    await t.click('[aria-label="归档 赵启明 到人才库"]');
    ok("归档池：归档后看板少一人（9）", t.qa(".vcd-card").length === 9);
    await t.clickText(".vcd-toolbar button", "人才库");
    ok("归档池：人才库浮层出现", !!t.q('[role="dialog"][aria-label="人才库（1）"]'));
    await t.click('[aria-label="恢复 何静姝 到看板"]');
    ok("归档池：恢复后看板回来一人（10）", t.qa(".vcd-card").length === 10);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 6. 推荐排序 ----
  {
    const t = await mount(<BOARDS.sort data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    const first = t.q('[data-stage-key="applied"] .vcd-card')?.getAttribute("data-candidate-id");
    ok("排序：score 降序时 applied 列首卡是 81 分的 c-009", first === "c-009");
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 7. 联系方式脱敏 ----
  {
    const t = await mount(<BOARDS.mask data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    ok("脱敏：手机号以 138****5678 出现", t.host.textContent?.includes("138****5678") === true);
    ok("脱敏：完整手机号不再出现", t.host.textContent?.includes("13812345678") === false);
    ok("脱敏：邮箱以 z***n@example.com 出现", t.host.textContent?.includes("z***n@example.com") === true);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 8. 视图切换 ----
  {
    const t = await mount(<BOARDS.view data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    await t.clickText("button", "列表");
    ok("视图切换：列表模式出现 role=table", !!t.q('[role="table"]'));
    ok("视图切换：表行数 = 候选人 11 + 表头", t.qa('[role="table"] [role="row"]').length === 12);
    await t.clickText("button", "看板");
    ok("视图切换：切回看板后 role=table 消失", !t.q('[role="table"]'));
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 9. 婉拒模板 ----
  {
    const t = await mount(<BOARDS.reject data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    await t.click('[aria-label="婉拒 王雨桐"]');
    ok("婉拒：浮层打开（婉拒 · 王雨桐）", !!t.q('[role="dialog"][aria-label="婉拒 · 王雨桐"]'));
    await t.clickText("button", "确认婉拒");
    ok("婉拒：确认后王雨桐流转到 rejected", columnOf(t, "c-004") === "rejected");
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 10. 搜索 ----
  {
    const t = await mount(<BOARDS.search data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    ok("搜索：初始 11 张卡（全量含归档）", t.qa(".vcd-card").length === 11);
    setNativeValue(t.q('[aria-label="搜索候选人"]') as HTMLInputElement, "全栈");
    await tick();
    ok("搜索：关键词「全栈」后只剩 1 张卡", t.qa(".vcd-card").length === 1);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 11. 标签管理 ----
  {
    const t = await mount(<BOARDS.tags data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    await t.click('[aria-label="王雨桐 的标签管理"]');
    ok("标签：管理浮层打开（标签管理 · 王雨桐）", !!t.q('[role="dialog"][aria-label="标签管理 · 王雨桐"]'));
    const input = t.q('[aria-label="新标签名称"]') as HTMLInputElement;
    input.value = "白名单";
    submitForm(input);
    await tick();
    ok("标签：提交后浮层出现新标签", t.host.textContent?.includes("白名单") === true);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 12. 操作日志 ----
  {
    const t = await mount(<BOARDS.log data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    await t.clickText(".vcd-footer button", "操作日志");
    ok(
      "操作日志：浮层打开并含历史流转记录",
      !!t.q('[role="dialog"][aria-label="操作日志"]') &&
        (t.q('[role="dialog"]')?.textContent?.includes("阶段流转") ?? false)
    );
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 13. 面试安排 ----
  {
    const t = await mount(<BOARDS.slot data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    await t.click('[aria-label="安排 王雨桐 的面试"]');
    ok("面试安排：浮层打开（安排面试 · 王雨桐）", !!t.q('[role="dialog"][aria-label="安排面试 · 王雨桐"]'));
    await t.clickText('[role="dialog"] button', "周三 10:00");
    ok("面试安排：选时间槽后卡片正文出现面试信息", t.host.textContent?.includes("面试：周三 10:00") === true);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 14. 星标 ----
  {
    const t = await mount(<BOARDS.star data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    await t.click('[aria-label="星标 王雨桐"]');
    ok("星标：点击后切换为已星标（可取消）", !!t.q('[aria-label="取消星标 王雨桐"]'));
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 15. 批量操作 ----
  {
    const t = await mount(<BOARDS.batch data={SAMPLE_CANDIDATES} stages={SAMPLE_STAGES} containerStyle={{ width: 1280 }} />);
    await t.clickText("button", "批量");
    ok("批量：进入选择模式后卡片出现复选框", !!t.q('[aria-label="选择 陈知远"]'));
    await t.clickText("button", "全选");
    ok("批量：全选后批量流转下拉亮起（已选 10）", t.host.textContent?.includes("已选 10") === true);
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  return { total, passed: total - failed.length, failed };
}

/** 供 demo.config 调用：跑完把结论写进 document.title，便于外部（无截图时）读取 */
export async function runSelfTestToTitle(): Promise<void> {
  // 先落一个「已启动」标记：便于区分「根本没跑」与「跑了一半卡住」
  document.title = "SELFTEST RUNNING";
  try {
    const r = await runSelfTest();
    document.title =
      r.failed.length === 0
        ? `SELFTEST PASS ${r.passed}/${r.total}`
        : `SELFTEST FAIL ${r.failed.length}/${r.total} :: ${r.failed.join(" | ")}`;
  } catch (e) {
    document.title = `SELFTEST ERROR :: ${(e as Error).message}`;
  }
}
