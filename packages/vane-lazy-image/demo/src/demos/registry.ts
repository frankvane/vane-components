/**
 * 示例目录（registry 范式，对应 sku 的 demos/registry.ts）
 *
 * 两个 glob 指向同一批文件：一份拿组件、一份拿源码 —— 展示的代码就是正在跑的那份。
 * 组合 / 高级的元信息（标题、描述、构成、源码）从 plugin-catalog 的 COMBOS / ADVANCED
 * 取，避免导航层与数据层各写一份「有哪些 demo」的逻辑；registry 是唯一的查询入口。
 * 场景类的 3 个虚拟滚动 demo 单独登记（它们已在 ScenariosPage 内联渲染，这里补上单页入口）。
 */
import { lazy } from "react";
import type { ComponentType } from "react";
import { COMBOS, ADVANCED } from "../data/plugin-catalog";
import type { DemoEntry, DemoGroup, DemoStageProps } from "./types";

// 懒加载模块 + 同一批文件的 ?raw 源码
const comboMods = import.meta.glob("../combos/*.tsx", { eager: false });
const comboSrc = import.meta.glob<string>("../combos/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});
const advMods = import.meta.glob("../advanced/*.tsx", { eager: false });
const advSrc = import.meta.glob<string>("../advanced/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});
const scnMods = import.meta.glob("../scenarios/*.tsx", { eager: false });
const scnSrc = import.meta.glob<string>("../scenarios/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

function stageOf(
  mods: Record<string, () => Promise<any>>,
  src: Record<string, string>,
  file: string
): { Stage: ComponentType<DemoStageProps>; source: string } {
  const loader = mods[`../${file}`];
  const Stage = loader
    ? lazy(() => loader().then((m) => ({ default: m.default })))
    : (() => null);
  return { Stage, source: src[`../${file}`] ?? "" };
}

const comboEntries: DemoEntry[] = COMBOS.map((c) => {
  const file = `combos/${c.component}.tsx`;
  const { Stage, source } = stageOf(comboMods, comboSrc, file);
  return {
    meta: {
      slug: c.id,
      title: c.title,
      group: "combo",
      description: c.description,
      plugins: c.plugins,
      code: c.code,
    },
    Stage,
    file: `${c.component}.tsx`,
    source,
  };
});

const advancedEntries: DemoEntry[] = ADVANCED.map((a) => {
  const file = `advanced/${a.component}.tsx`;
  const { Stage, source } = stageOf(advMods, advSrc, file);
  return {
    meta: {
      slug: a.id,
      title: a.title,
      group: "advanced",
      description: a.description,
    },
    Stage,
    file: `${a.component}.tsx`,
    source,
  };
});

// 场景类：3 个虚拟滚动 demo（其余场景由 ScenariosPage 的 catalog 驱动，不在此登记）
const SCENARIO_DEMOS: Array<{ slug: string; title: string; file: string }> = [
  {
    slug: "virtual-vertical",
    title: "虚拟滚动 · 纵向列表",
    file: "scenarios/VirtualVerticalListDemo.tsx",
  },
  {
    slug: "virtual-horizontal",
    title: "虚拟滚动 · 横向列表",
    file: "scenarios/VirtualHorizontalListDemo.tsx",
  },
  {
    slug: "virtual-grid",
    title: "虚拟滚动 · 网格",
    file: "scenarios/VirtualGridDemo.tsx",
  },
];

const scenarioEntries: DemoEntry[] = SCENARIO_DEMOS.map((s) => {
  const { Stage, source } = stageOf(scnMods, scnSrc, s.file);
  return {
    meta: { slug: s.slug, title: s.title, group: "scenario" },
    Stage,
    file: s.file.split("/").pop() as string,
    source,
  };
});

export const DEMOS: DemoEntry[] = [
  ...comboEntries,
  ...advancedEntries,
  ...scenarioEntries,
];

export const DEMO_GROUPS: DemoGroup[] = ["combo", "advanced", "scenario"];

export function demosOf(group: DemoGroup): DemoEntry[] {
  return DEMOS.filter((d) => d.meta.group === group);
}

export function findDemo(slug: string): DemoEntry | undefined {
  return DEMOS.find((d) => d.meta.slug === slug);
}
