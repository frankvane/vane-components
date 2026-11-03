/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 属性 / 事件 / 方法 / 特性 / 坑位），与插件一同发布；
 *  2. `create.tsx`   —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
import type { ActivityPlugin } from "vane-activity";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";
import { createRuleExpandPlugin } from "vane-activity/custom-plugins/RuleExpandPlugin";
import { createCountdownTimerPlugin } from "vane-activity/custom-plugins/CountdownTimerPlugin";
import { createMilestoneBarPlugin } from "vane-activity/custom-plugins/MilestoneBarPlugin";
import { createCouponStackPlugin } from "vane-activity/custom-plugins/CouponStackPlugin";
import { createRuleModalPlugin } from "vane-activity/custom-plugins/RuleModalPlugin";
import { createConfettiPlugin } from "vane-activity/custom-plugins/ConfettiPlugin";
import { createActivityHeaderPlugin } from "vane-activity/custom-plugins/ActivityHeaderPlugin";
import { createProgressRingPlugin } from "vane-activity/custom-plugins/ProgressRingPlugin";
import { createClaimToastPlugin } from "vane-activity/custom-plugins/ClaimToastPlugin";
import { createShareBoostPlugin } from "vane-activity/custom-plugins/ShareBoostPlugin";
import { createLeaderboardPlugin } from "vane-activity/custom-plugins/LeaderboardPlugin";
import { createAnnouncementPlugin } from "vane-activity/custom-plugins/AnnouncementPlugin";
import { createCheckinCalendarPlugin } from "vane-activity/custom-plugins/CheckinCalendarPlugin";
import { createTaskTabsPlugin } from "vane-activity/custom-plugins/TaskTabsPlugin";
import { createJackpotPlugin } from "vane-activity/custom-plugins/JackpotPlugin";
import { createRedeemCodePlugin } from "vane-activity/custom-plugins/RedeemCodePlugin";

export type PluginGroup = "core" | "display" | "info" | "social";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  core: "核心闭环",
  display: "进度与氛围",
  info: "规则说明",
  social: "社交与反馈",
};

/** 工坊左侧分组的展示顺序 */
export const GROUP_ORDER: PluginGroup[] = ["core", "display", "info", "social"];

/** 插件的三类能力：属性 / 事件 / 方法（doc.json 的三件结构） */
export interface PluginProp {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface PluginEvent {
  name: string;
  when: string;
  description: string;
}

export interface PluginMethod {
  name: string;
  signature: string;
  description: string;
}

export interface PluginDocShape {
  name: string;
  description: string;
  since?: string;
  /** 属性（工厂配置）：旧字段名 config 已统一为 props */
  props?: PluginProp[];
  events?: PluginEvent[];
  methods?: PluginMethod[];
  /** methods 为空时的补充说明（如「只读取 ctx.tasks」） */
  methodsNote?: string;
  features?: string[];
  useCases?: string[];
  notes?: string[];
}

export interface PluginInfo {
  /** 目录名，同时是插件 name，如 TaskListPlugin */
  dir: string;
  /** 工厂名，如 createTaskListPlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /**
   * 演示装配参数。**同一份对象**既喂给下面的 make()，也写进插件工坊生成的可复制源码，
   * 所以「勾选后跑起来的组件」与「复制走的代码」不会出现参数不一致。
   */
  args: Record<string, unknown>;
  /** 演示用配置；勾选后用它装配 */
  make: () => ActivityPlugin;
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
  /** 装配参数（可省略）。make 必须原样把它交给工厂，生成源码时也读它 */
  args?: Record<string, unknown>;
  // 工厂签名各不相同，这里只做「把 args 原样透传」的中转，故用 any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  make: (args: any) => ActivityPlugin;
};

const DEFS: Def[] = [
  // ---------- core：任务与奖励闭环 ----------
  { dir: "TaskListPlugin", group: "core", make: (a) => createTaskListPlugin(a) },
  { dir: "TaskTabsPlugin", group: "core", make: (a) => createTaskTabsPlugin(a) },
  { dir: "RewardClaimPlugin", group: "core", make: (a) => createRewardClaimPlugin(a) },
  {
    dir: "RedeemCodePlugin",
    group: "core",
    args: { prefix: "VANE" },
    make: (a) => createRedeemCodePlugin(a),
  },
  { dir: "JackpotPlugin", group: "core", make: (a) => createJackpotPlugin(a) },
  // ---------- display：进度与氛围 ----------
  { dir: "ActivityHeaderPlugin", group: "display", make: (a) => createActivityHeaderPlugin(a) },
  { dir: "AnnouncementPlugin", group: "display", make: (a) => createAnnouncementPlugin(a) },
  { dir: "ProgressFxPlugin", group: "display", make: (a) => createProgressFxPlugin(a) },
  { dir: "ProgressRingPlugin", group: "display", make: (a) => createProgressRingPlugin(a) },
  { dir: "CheckinCalendarPlugin", group: "display", make: (a) => createCheckinCalendarPlugin(a) },
  { dir: "CountdownTimerPlugin", group: "display", make: (a) => createCountdownTimerPlugin(a) },
  { dir: "MilestoneBarPlugin", group: "display", make: (a) => createMilestoneBarPlugin(a) },
  { dir: "ConfettiPlugin", group: "display", make: (a) => createConfettiPlugin(a) },
  { dir: "CouponStackPlugin", group: "display", make: (a) => createCouponStackPlugin(a) },
  // ---------- info：规则说明 ----------
  { dir: "RuleExpandPlugin", group: "info", make: (a) => createRuleExpandPlugin(a) },
  { dir: "RuleModalPlugin", group: "info", make: (a) => createRuleModalPlugin(a) },
  // ---------- social：社交与反馈 ----------
  { dir: "ClaimToastPlugin", group: "social", make: (a) => createClaimToastPlugin(a) },
  { dir: "ShareBoostPlugin", group: "social", make: (a) => createShareBoostPlugin(a) },
  { dir: "LeaderboardPlugin", group: "social", make: (a) => createLeaderboardPlugin(a) },
];

export const PLUGINS: PluginInfo[] = DEFS.map((def) => {
  const doc = docOf(def.dir);
  const args = def.args ?? {};
  return {
    dir: def.dir,
    // dir 本身以 Plugin 结尾（如 TaskListPlugin），工厂名 = create + dir，别再拼一个 Plugin
    factory: `create${def.dir}`,
    group: def.group,
    priority: priorityOf(def.dir),
    summary: doc.description,
    doc,
    args,
    make: () => def.make(args),
  };
}).sort(
  (a, b) =>
    GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || b.priority - a.priority
);

/** 目录名 → 插件信息（逐项示例按 meta.plugins 反查 API 表用） */
export const PLUGIN_BY_DIR = new Map(PLUGINS.map((p) => [p.dir, p]));

/** 默认勾选：核心闭环 2 个 + ProgressFx —— 其余逐个勾上玩，直观感受每个插件的长相与代价 */
export const DEFAULT_ON = ["TaskListPlugin", "RewardClaimPlugin", "ProgressFxPlugin"];
