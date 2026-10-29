/**
 * 本包 demo 的配置（外壳唯一允许差异的地方：品牌文案 + 导航 + 路由 + 页脚）
 *
 * 外壳本身由 scripts/sync-demo-shell.mjs 从 templates/demo-shell 生成。
 *
 * 注意：本包的 demos/registry 是「一插件一文件」的 {id,file,Module} 结构（没有 meta.group），
 * 这里做一次适配：把插件分组映射成侧栏的折叠分组，让导航形状与其它包一致。
 */
import { lazy } from "react";
import type { DemoShellConfig } from "./shell/DemoShell";
import { DEMOS } from "./demos/registry";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  PLUGIN_COUNT,
  getPlugin,
} from "./data/plugin-catalog";
import { SAMPLE_COUNT } from "./data/samples";
import { DemoDetailPage } from "./pages/DemoDetailPage";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const DemosPage = lazy(() => import("./pages/DemosPage").then((m) => ({ default: m.DemosPage })));
const WorkshopPage = lazy(() =>
  import("./pages/WorkshopPage").then((m) => ({ default: m.WorkshopPage }))
);
const ScenariosPage = lazy(() =>
  import("./pages/ScenariosPage").then((m) => ({ default: m.ScenariosPage }))
);

/** 外壳需要的最小条目形状（本包 registry 的 DemoEntry 是 {id,file,Module}，这里做适配） */
interface ShellEntry {
  meta: { slug: string; title: string; group: string };
  file: string;
}

const demoEntries: ShellEntry[] = DEMOS.map((d) => {
  const plugin = getPlugin(d.id);
  return {
    meta: { slug: d.id, title: plugin?.title ?? d.id, group: plugin?.group ?? "other" },
    file: d.file,
  };
});

export const demoConfig: DemoShellConfig<ShellEntry> = {
  pkg: "vane-file-preview",
  brand: "F",
  subtitle: "文件预览 / plugin index",
  nav: [
    { to: "/", label: "总览", hint: "overview" },
    { to: "/demos", label: "示例目录", hint: `${PLUGIN_COUNT} modules` },
    { to: "/workshop", label: "插件工坊", hint: `${PLUGIN_COUNT} plugins` },
    { to: "/scenarios", label: "场景示例", hint: `${SAMPLE_COUNT} samples` },
  ],
  routes: [
    { path: "/", element: <HomePage /> },
    { path: "/demos", element: <DemosPage /> },
    { path: "/workshop", element: <WorkshopPage /> },
    { path: "/scenarios", element: <ScenariosPage /> },
  ],
  crumb: (pathname) => {
    if (pathname.startsWith("/demos")) return "demos · 示例目录";
    if (pathname.startsWith("/workshop")) return "workshop · 插件工坊";
    if (pathname.startsWith("/scenarios")) return "scenario · 场景示例";
    // /demo/* 的面包屑由外壳统一生成
    return "index · 索引";
  },
  demos: {
    // registry 的 DemoEntry 用 id/file，外壳需要 meta.slug/title/group：
    // 这里就地适配，分组沿用 catalog 的插件分组，导航形状与其它包一致。
    label: "逐项示例",
    groups: GROUP_ORDER.map((g) => ({ key: g, label: GROUP_LABELS[g].label })),
    entries: demoEntries,
    detail: (entry) => <DemoDetailPage id={entry.meta.slug} />,
  },
  footer: [
    `${PLUGIN_COUNT} PLUGINS · ${SAMPLE_COUNT} SAMPLES`,
    `${DEMOS.length} DEMOS · FILE PREVIEW`,
  ],
};
