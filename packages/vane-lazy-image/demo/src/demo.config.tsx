/**
 * 本包 demo 的配置（外壳唯一允许差异的地方：品牌文案 + 导航 + 路由 + 页脚）
 *
 * 外壳本身由 scripts/sync-demo-shell.mjs 从 templates/demo-shell 生成；
 * 侧栏可折叠分组、顶栏 guides/source、抽屉与遮罩都由外壳统一提供。
 */
import { lazy } from "react";
import type { DemoShellConfig } from "./shell/DemoShell";
import type { DemoEntry } from "./demos/types";
import { DEMOS, DEMO_GROUPS } from "./demos/registry";
import { GROUP_META } from "./demos/types";
import { DemoPage } from "./demos/DemoPage";
import { PLUGINS, COMBOS, ADVANCED } from "./data/plugin-catalog";
import { SCENARIOS } from "./scenarios/catalog";

const Home = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
const PluginDetail = lazy(() =>
  import("./pages/PluginDetail").then((m) => ({ default: m.PluginDetail }))
);
const CombosPage = lazy(() =>
  import("./pages/CombosPage").then((m) => ({ default: m.CombosPage }))
);
const AdvancedPage = lazy(() =>
  import("./pages/AdvancedPage").then((m) => ({ default: m.AdvancedPage }))
);
const ScenariosPage = lazy(() =>
  import("./pages/ScenariosPage").then((m) => ({ default: m.ScenariosPage }))
);
const WorkshopPage = lazy(() =>
  import("./pages/WorkshopPage").then((m) => ({ default: m.WorkshopPage }))
);
const GalleryPage = lazy(() =>
  import("./pages/GalleryPage").then((m) => ({ default: m.GalleryPage }))
);

export const demoConfig: DemoShellConfig<DemoEntry> = {
  pkg: "vane-lazy-image",
  brand: "V",
  subtitle: "图片懒加载 / plugin index",
  nav: [
    { to: "/", label: "总览", hint: "overview" },
    { to: "/workshop", label: "插件工坊", hint: `${PLUGINS.length} plugins` },
    { to: "/combos", label: "组合示例", hint: `${COMBOS.length} combos` },
    { to: "/advanced", label: "高级功能", hint: `${ADVANCED.length} advanced` },
    { to: "/scenarios", label: "场景示例", hint: `${SCENARIOS.length} plates` },
    { to: "/gallery", label: "商品图集", hint: "gallery" },
  ],
  routes: [
    { path: "/", element: <Home /> },
    { path: "/plugin/:id", element: <PluginDetail /> },
    { path: "/combos", element: <CombosPage /> },
    { path: "/combo/:id", element: <CombosPage /> },
    { path: "/advanced", element: <AdvancedPage /> },
    { path: "/advanced/:id", element: <AdvancedPage /> },
    { path: "/scenarios", element: <ScenariosPage /> },
    { path: "/workshop", element: <WorkshopPage /> },
    { path: "/gallery", element: <GalleryPage /> },
  ],
  crumb: (pathname) => {
    if (pathname.startsWith("/plugin/")) return "plugin · 插件详情";
    if (pathname.startsWith("/combo")) return "combo · 组合示例";
    if (pathname.startsWith("/advanced")) return "advanced · 高级功能";
    if (pathname.startsWith("/scenarios")) return "scenario · 场景示例";
    if (pathname.startsWith("/workshop")) return "workshop · 插件工坊";
    if (pathname.startsWith("/gallery")) return "gallery · 商品图集";
    // /demo/* 的面包屑由外壳统一生成
    return "index · 总览";
  },
  demos: {
    label: "逐项示例",
    groups: DEMO_GROUPS.map((g) => ({ key: g, label: GROUP_META[g].label })),
    entries: DEMOS,
    detail: (entry, order) => <DemoPage entry={entry} order={order} />,
  },
  footer: [
    `${PLUGINS.length} PLUGINS · ${SCENARIOS.length} PLATES`,
    `${DEMOS.length} DEMOS · D1-A / D2-A`,
  ],
};
