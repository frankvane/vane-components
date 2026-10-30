/**
 * 本包 demo 的配置（外壳唯一允许差异的地方：品牌文案 + 导航 + 路由 + 页脚）
 *
 * 外壳本身（骨架 / 顶栏 / 侧栏 / 逐项示例导航 / 兜底）由
 * `node scripts/sync-demo-shell.mjs` 从 packages/templates/demo-shell 生成，
 * 新包创建时已自动跑过；改了外壳模板要重跑，别手改生成物。
 */
import { lazy } from "react";
import type { DemoShellConfig } from "./shell/DemoShell";
import { DEMOS, DEMO_GROUPS } from "./demos/registry";
import type { DemoEntry } from "./demos/registry";
import { GROUP_META } from "./demos/types";
import { DemoPage } from "./demos/DemoPage";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));

export const demoConfig: DemoShellConfig<DemoEntry> = {
  pkg: "vane-coupon",
  brand: "C",
  subtitle: "优惠券 / plugin index",
  nav: [{ to: "/", label: "总览", hint: "overview" }],
  routes: [{ path: "/", element: <HomePage /> }],
  crumb: () => "index · 总览",
  demos: {
    label: "逐项示例",
    groups: DEMO_GROUPS.map((g) => ({ key: g, label: GROUP_META[g].label })),
    entries: DEMOS,
    detail: (entry, order) => <DemoPage entry={entry} order={order} />,
  },
  footer: [`14 PLUGINS · ${DEMOS.length} DEMOS`, "STATE MACHINE CORE"],
};
