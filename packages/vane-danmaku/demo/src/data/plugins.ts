/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 坑位），由迁移脚本生成；
 *  2. `create.ts(x)` —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
import type { DanmakuPlugin } from "vane-danmaku";
import {
  createSensitiveFilterPlugin,
  createFanBadgePlugin,
  createPinnedTopPlugin,
  createCmdParsePlugin,
  createSafeZonePlugin,
  createDedupPlugin,
  createRateLimitPlugin,
  createKeywordHighlightPlugin,
  createKeywordBlockPlugin,
  createUserMutePlugin,
  createEmojiRenderPlugin,
  createAtMentionPlugin,
  createGiftComboPlugin,
  createLangFilterPlugin,
  createAuditLogPlugin,
  createStylePresetPlugin,
  createTrackStrategyPlugin,
  createSpeedControlPlugin,
  createColorPolicyPlugin,
  createSettingsPanelPlugin,
  createFilterTogglePlugin,
  createCommandInputPlugin,
  createStatsBarPlugin,
} from "vane-danmaku/custom-plugins";

export type PluginGroup = "content" | "emphasis" | "interaction" | "layout" | "control";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  content: "内容治理 · content",
  emphasis: "视觉强调 · emphasis",
  interaction: "互动指令 · interaction",
  layout: "轨道策略 · layout",
  control: "控制层 · control",
};

export const GROUP_ORDER: PluginGroup[] = [
  "content",
  "emphasis",
  "interaction",
  "layout",
  "control",
];

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
  /** 目录名，同时是插件 name，如 SensitiveFilterPlugin */
  dir: string;
  /** 工厂名，如 createSensitiveFilterPlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 演示用配置；勾选后用它装配 */
  make: () => DanmakuPlugin;
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
  make: () => DanmakuPlugin;
};

const DEFS: Def[] = [
  // ---------- content 内容治理 ----------
  {
    dir: "SensitiveFilterPlugin",
    group: "content",
    make: () =>
      createSensitiveFilterPlugin({ words: ["广告", "代刷", "违规", "政治敏感"], mode: "mask" }),
  },
  {
    dir: "KeywordBlockPlugin",
    group: "content",
    make: () => createKeywordBlockPlugin({ words: ["竞品", "违规"] }),
  },
  {
    dir: "LangFilterPlugin",
    group: "content",
    make: () => createLangFilterPlugin({ allow: ["cjk", "latin"] }),
  },
  { dir: "EmojiRenderPlugin", group: "content", make: () => createEmojiRenderPlugin() },
  { dir: "AtMentionPlugin", group: "content", make: () => createAtMentionPlugin() },
  { dir: "UserMutePlugin", group: "content", make: () => createUserMutePlugin({ users: ["bot"] }) },
  { dir: "DedupPlugin", group: "content", make: () => createDedupPlugin({ window: 5 }) },
  {
    dir: "RateLimitPlugin",
    group: "content",
    make: () => createRateLimitPlugin({ max: 3, window: 6 }),
  },
  { dir: "AuditLogPlugin", group: "content", make: () => createAuditLogPlugin() },

  // ---------- emphasis 视觉强调 ----------
  {
    dir: "PinnedTopPlugin",
    group: "emphasis",
    make: () => createPinnedTopPlugin({ minLevel: 20 }),
  },
  {
    dir: "KeywordHighlightPlugin",
    group: "emphasis",
    make: () => createKeywordHighlightPlugin({ keywords: ["福利", "抽奖", "高能"] }),
  },
  { dir: "GiftComboPlugin", group: "emphasis", make: () => createGiftComboPlugin() },
  { dir: "ColorPolicyPlugin", group: "emphasis", make: () => createColorPolicyPlugin() },
  { dir: "StylePresetPlugin", group: "emphasis", make: () => createStylePresetPlugin() },

  // ---------- interaction 互动指令 ----------
  {
    dir: "CmdParsePlugin",
    group: "interaction",
    make: () => createCmdParsePlugin(),
  },
  {
    dir: "FanBadgePlugin",
    group: "interaction",
    make: () =>
      createFanBadgePlugin({
        badges: {
          u1: { name: "老粉", level: 6, color: "#ff7a29" },
          u2: { name: "舰长", level: 12, color: "#5fd3c8" },
        },
      }),
  },

  // ---------- layout 轨道策略 ----------
  { dir: "TrackStrategyPlugin", group: "layout", make: () => createTrackStrategyPlugin() },
  {
    dir: "SpeedControlPlugin",
    group: "layout",
    make: () => createSpeedControlPlugin({ factor: 1 }),
  },

  // ---------- control 控制层 / 防遮挡 ----------
  {
    dir: "SafeZonePlugin",
    group: "control",
    make: () => createSafeZonePlugin({ reservedBands: { top: 0.18, bottom: 0.12 } }),
  },
  { dir: "SettingsPanelPlugin", group: "control", make: () => createSettingsPanelPlugin() },
  { dir: "FilterTogglePlugin", group: "control", make: () => createFilterTogglePlugin() },
  { dir: "CommandInputPlugin", group: "control", make: () => createCommandInputPlugin() },
  { dir: "StatsBarPlugin", group: "control", make: () => createStatsBarPlugin() },
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
 * 默认勾选：工坊初始就是一个「完整、好看、不挤」的弹幕面板。
 * 全选 23 个会把控制层 5 件 + 内容治理 9 件全部打开，部分强过滤插件会误伤基础样本，
 * 这里挑各分组代表插件，覆盖五区且无重复指标。
 */
export const DEFAULT_ON = [
  "SensitiveFilterPlugin",
  "KeywordHighlightPlugin",
  "PinnedTopPlugin",
  "FanBadgePlugin",
  "EmojiRenderPlugin",
  "AtMentionPlugin",
  "GiftComboPlugin",
  "ColorPolicyPlugin",
  "CmdParsePlugin",
  "SafeZonePlugin",
  "SettingsPanelPlugin",
  "FilterTogglePlugin",
  "CommandInputPlugin",
  "StatsBarPlugin",
];
