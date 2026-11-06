/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 坑位），由迁移脚本生成；
 *  2. `create.ts(x)` —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
import type { CouponData, CouponPlugin } from "vane-coupon";
import {
  createAnalyticsPlugin,
  createChannelPlugin,
  createClaimStatePlugin,
  createCopyCodePlugin,
  createCountdownPlugin,
  createDetailLinkPlugin,
  createHistoryPlugin,
  createProgressPlugin,
  createQuotaPlugin,
  createRemindPlugin,
  createRuleExpandPlugin,
  createSharePlugin,
  createStackPlugin,
  createValidityPlugin,
} from "vane-coupon/custom-plugins";

/**
 * coupon 的四段视觉区（内核 composeSlots 口径）：
 *   before  → renderHeader(slotPosition:"before") 票面上方角标区
 *   info    → renderHeader(slotPosition:"after")  票面下方信息行
 *   footer  → renderFooter                         底部操作区
 *   behavior→ 无渲染（onMount / transformProps 等纯行为插件）
 */
export type PluginGroup = "before" | "info" | "footer" | "behavior";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  before: "票面上方 · before",
  info: "票面信息 · after",
  footer: "底部操作 · footer",
  behavior: "行为钩子 · 无渲染",
};

export const GROUP_ORDER: PluginGroup[] = ["before", "info", "footer", "behavior"];

export interface PluginDocShape {
  name: string;
  description: string;
  since?: string;
  tags?: string[];
  config?: Array<{ name: string; type: string; default: string; description: string }>;
  example?: string;
  features?: string[];
  useCases?: string[];
  notes?: string[];
}

export interface PluginInfo {
  /** 目录名，同时是插件 name，如 ClaimStatePlugin */
  dir: string;
  /** 工厂名，如 createClaimStatePlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 演示用配置；勾选后用它装配 */
  make: () => CouponPlugin;
}

const DOCS = import.meta.glob<PluginDocShape>("/src/custom-plugins/*/doc.json", {
  eager: true,
  import: "default",
});

const RAW = import.meta.glob<string>("/src/custom-plugins/*/create.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

const dirOf = (path: string) =>
  path.replace(/^.*\/custom-plugins\//, "").replace(/\/.*$/, "");

function priorityOf(dir: string): number {
  const path = Object.keys(RAW).find((p) => dirOf(p) === dir);
  const src = path ? RAW[path] : "";
  const m = /priority:\s*(\d+)/.exec(src);
  return m ? Number(m[1]) : 0;
}

function docOf(dir: string): PluginDocShape {
  const path = Object.keys(DOCS).find((p) => dirOf(p) === dir);
  return path ? DOCS[path] : { name: dir, description: "（缺少 doc.json）" };
}

type Def = {
  dir: string;
  group: PluginGroup;
  make: () => CouponPlugin;
};

const DEFS: Def[] = [
  // ---------- before（票面上方角标区） ----------
  { dir: "StackPlugin", group: "before", make: () => createStackPlugin() },
  { dir: "ChannelPlugin", group: "before", make: () => createChannelPlugin() },
  {
    dir: "CountdownPlugin",
    group: "before",
    make: () => createCountdownPlugin({ startAt: Date.now() + 3600_000 }),
  },

  // ---------- info（票面下方信息行） ----------
  { dir: "ValidityPlugin", group: "info", make: () => createValidityPlugin() },
  { dir: "QuotaPlugin", group: "info", make: () => createQuotaPlugin() },
  { dir: "ProgressPlugin", group: "info", make: () => createProgressPlugin() },
  { dir: "RuleExpandPlugin", group: "info", make: () => createRuleExpandPlugin() },
  { dir: "CopyCodePlugin", group: "info", make: () => createCopyCodePlugin() },
  { dir: "HistoryPlugin", group: "info", make: () => createHistoryPlugin() },
  { dir: "DetailLinkPlugin", group: "info", make: () => createDetailLinkPlugin() },

  // ---------- footer（底部操作区） ----------
  { dir: "ClaimStatePlugin", group: "footer", make: () => createClaimStatePlugin() },
  { dir: "SharePlugin", group: "footer", make: () => createSharePlugin() },
  { dir: "RemindPlugin", group: "footer", make: () => createRemindPlugin() },

  // ---------- behavior（无渲染） ----------
  { dir: "AnalyticsPlugin", group: "behavior", make: () => createAnalyticsPlugin() },
];

export const PLUGINS: PluginInfo[] = DEFS.map((def) => {
  const doc = docOf(def.dir);
  return {
    dir: def.dir,
    factory: `create${def.dir.replace(/Plugin$/, "")}Plugin`,
    group: def.group,
    priority: priorityOf(def.dir),
    summary: doc.description,
    doc,
    make: def.make,
  };
}).sort(
  (a, b) =>
    GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || b.priority - a.priority
);

/**
 * 默认勾选：工坊初始就是「一张完整、好看、不挤的券卡」。
 * 有效期 + 领取状态机必须同时在（联动降级才完整）；限量进度、规则、券码记录各留代表；
 * 渠道限定 / 详情链接 / 开抢提醒 / 埋点偏 niche，留给用户勾选探索。
 */
export const DEFAULT_ON = [
  "StackPlugin",
  "CountdownPlugin",
  "ValidityPlugin",
  "QuotaPlugin",
  "ProgressPlugin",
  "ClaimStatePlugin",
  "SharePlugin",
  "RuleExpandPlugin",
  "HistoryPlugin",
];

/** 工坊预览用样本券（字段齐全，时基在使用时取，避免模块顶层被耗尽） */
export function buildSampleCoupon(): CouponData {
  const now = Date.now();
  return {
    id: "c-demo-full",
    title: "家电焕新专享券",
    amount: 30,
    threshold: 299,
    stackable: true,
    total: 1000,
    claimed: 720,
    quota: 2,
    channels: ["仅 APP"],
    code: "VD-2026-88XK",
    validFrom: now - 3 * 86_400_000,
    validTo: now + 4 * 86_400_000,
    rules: [
      "全平台通用，可与店铺优惠叠加使用",
      "下单满 299 元可用，家电类目除外",
      "领取后 4 天内有效，过期自动作废",
      "每单限用 1 张，不找零、不兑现",
    ],
    history: [
      { at: now - 2 * 86_400_000, action: "领取成功" },
      { at: now - 6 * 3600_000, action: "设置开抢提醒" },
    ],
  };
}
