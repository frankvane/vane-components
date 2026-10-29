/**
 * 本包 demo 的配置（外壳唯一允许差异的地方：品牌文案 + 导航 + 路由 + 页脚）
 *
 * 外壳本身由 scripts/sync-demo-shell.mjs 从 templates/demo-shell 生成。
 */
import { lazy } from "react";
import type { DemoShellConfig } from "./shell/DemoShell";
import { DEMOS, DEMO_GROUPS } from "./demos/registry";
import type { DemoEntry } from "./demos/registry";
import { GROUP_META } from "./demos/types";
import { DemoPage } from "./demos/DemoPage";
import { PLUGINS } from "./data/plugins";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const PluginsPage = lazy(() =>
  import("./pages/PluginsPage").then((m) => ({ default: m.PluginsPage }))
);
const ScenariosPage = lazy(() =>
  import("./pages/ScenariosPage").then((m) => ({ default: m.ScenariosPage }))
);

export const demoConfig: DemoShellConfig<DemoEntry> = {
  pkg: "vane-comment",
  brand: "v",
  subtitle: "评论区 / plugin index",
  nav: [
    { to: "/", label: "总览", hint: "overview" },
    { to: "/plugins", label: "插件工坊", hint: `${PLUGINS.length} plugins` },
    { to: "/scenarios", label: "场景示例", hint: "4 plates" },
  ],
  routes: [
    { path: "/", element: <HomePage /> },
    { path: "/plugins", element: <PluginsPage /> },
    { path: "/scenarios", element: <ScenariosPage /> },
  ],
  crumb: (pathname) => {
    if (pathname.startsWith("/plugins")) return "workshop · 插件工坊";
    if (pathname.startsWith("/scenarios")) return "plates · 场景示例";
    // /demo/* 的面包屑由外壳统一生成，这里只处理应用级页面
    return "index · 总览";
  },
  demos: {
    label: "逐项示例",
    groups: DEMO_GROUPS.map((g) => ({ key: g, label: GROUP_META[g].label })),
    entries: DEMOS,
    detail: (entry, order) => <DemoPage entry={entry} order={order} />,
  },
  footer: [`${PLUGINS.length} PLUGINS · 4 PLATES`, `${DEMOS.length} DEMOS · COMMENT CORE`],
};
