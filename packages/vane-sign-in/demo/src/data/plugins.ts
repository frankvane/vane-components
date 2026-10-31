/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 坑位），由迁移脚本生成；
 *  2. `create.ts(x)` —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
import type { SignInPlugin } from "vane-sign-in";
import {
  createStreakStatePlugin,
  createPointsBalancePlugin,
  createStatRowPlugin,
  createLevelBadgePlugin,
  createCountdownPlugin,
  createCalendarStripPlugin,
  createCalendarGridPlugin,
  createMakeupSlotPlugin,
  createRewardPreviewPlugin,
  createRewardClaimPlugin,
  createMilestonePlugin,
  createTodayCheckInPlugin,
  createSharePlugin,
  createRemindPlugin,
  createInvitePlugin,
  createRuleExpandPlugin,
  createRewardHistoryPlugin,
} from "vane-sign-in/custom-plugins";

export type PluginGroup = "header" | "calendar" | "rewards" | "actions" | "footer";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  header: "头部区 · header",
  calendar: "日历区 · calendar",
  rewards: "奖励区 · rewards",
  actions: "操作区 · actions",
  footer: "底部区 · footer",
};

export const GROUP_ORDER: PluginGroup[] = ["header", "calendar", "rewards", "actions", "footer"];

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
  /** 目录名，同时是插件 name，如 StreakStatePlugin */
  dir: string;
  /** 工厂名，如 createStreakStatePlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 演示用配置；勾选后用它装配 */
  make: () => SignInPlugin<unknown>;
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
  make: () => SignInPlugin<unknown>;
};

const DEFS: Def[] = [
  // ---------- header ----------
  { dir: "StreakStatePlugin", group: "header", make: () => createStreakStatePlugin() },
  { dir: "PointsBalancePlugin", group: "header", make: () => createPointsBalancePlugin() },
  { dir: "StatRowPlugin", group: "header", make: () => createStatRowPlugin() },
  { dir: "LevelBadgePlugin", group: "header", make: () => createLevelBadgePlugin() },
  { dir: "CountdownPlugin", group: "header", make: () => createCountdownPlugin() },

  // ---------- calendar ----------
  {
    dir: "CalendarStripPlugin",
    group: "calendar",
    make: () => createCalendarStripPlugin({ showRewardDot: true }),
  },
  { dir: "CalendarGridPlugin", group: "calendar", make: () => createCalendarGridPlugin() },
  { dir: "MakeupSlotPlugin", group: "calendar", make: () => createMakeupSlotPlugin() },

  // ---------- rewards ----------
  {
    dir: "RewardPreviewPlugin",
    group: "rewards",
    make: () => createRewardPreviewPlugin({ limit: 5 }),
  },
  { dir: "RewardClaimPlugin", group: "rewards", make: () => createRewardClaimPlugin() },
  { dir: "MilestonePlugin", group: "rewards", make: () => createMilestonePlugin() },

  // ---------- actions ----------
  { dir: "TodayCheckInPlugin", group: "actions", make: () => createTodayCheckInPlugin() },
  { dir: "SharePlugin", group: "actions", make: () => createSharePlugin() },
  { dir: "RemindPlugin", group: "actions", make: () => createRemindPlugin() },
  { dir: "InvitePlugin", group: "actions", make: () => createInvitePlugin() },

  // ---------- footer ----------
  {
    dir: "RuleExpandPlugin",
    group: "footer",
    make: () => createRuleExpandPlugin({ defaultOpen: true }),
  },
  { dir: "RewardHistoryPlugin", group: "footer", make: () => createRewardHistoryPlugin() },
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

/** 默认全选：工坊初始就是「一个完整可用的签到面板」 */
export const DEFAULT_ON = PLUGINS.map((p) => p.dir);
