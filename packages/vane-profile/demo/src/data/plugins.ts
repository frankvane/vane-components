/**
 * 插件注册表（插件工坊数据源）
 *
 * 三个来源各司其职，避免任何一处手抄漂移：
 *  1. `doc.json`     —— 文档（描述 / 配置表 / 特性 / 坑位），由迁移脚本生成；
 *  2. `create.ts(x)` —— 用 `?raw` 读源码，正则取 priority（工坊要按真实执行顺序展示）；
 *  3. 本文件的 `make` —— 唯一手写部分：给每个工厂一份「演示用配置」。
 */
import type { ProfilePlugin } from "vane-profile";
import {
  createBannerSlotPlugin,
  createStatRowPlugin,
  createTabSyncPlugin,
  createVerifyBadgePlugin,
  createFollowEchoPlugin,
  createBioSlotPlugin,
  createSocialLinksPlugin,
  createTagListPlugin,
  createWorksGridPlugin,
  createMembershipBadgePlugin,
  createQRSharePlugin,
  createLiveStatusPlugin,
  createContactCardPlugin,
  createActivitySummaryPlugin,
  createMessageButtonPlugin,
  createAchievementWallPlugin,
} from "vane-profile/custom-plugins";
import {
  AVATAR,
  SAMPLE_USER,
  SAMPLE_WORKS,
  SAMPLE_LINKS,
  SAMPLE_TAGS,
  SAMPLE_MEMBERSHIP,
  SAMPLE_LIVE,
  SAMPLE_CONTACT,
  SAMPLE_ACTIVITY,
  SAMPLE_ACHIEVEMENTS,
} from "./sample";

export type PluginGroup = "visual" | "data" | "interaction";

export const GROUP_LABEL: Record<PluginGroup, string> = {
  visual: "视觉",
  data: "数据",
  interaction: "交互与状态",
};

export const GROUP_ORDER: PluginGroup[] = ["visual", "data", "interaction"];

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
  /** 目录名，同时是插件 name，如 BannerSlot */
  dir: string;
  /** 工厂名，如 createBannerSlotPlugin */
  factory: string;
  group: PluginGroup;
  /** 取自源码 priority 字段 */
  priority: number;
  summary: string;
  doc: PluginDocShape;
  /** 演示用配置；勾选后用它装配 */
  make: () => ProfilePlugin<unknown>;
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

const TABS = [
  { id: "works", label: "作品" },
  { id: "feeds", label: "动态" },
  { id: "about", label: "关于" },
];

type Def = {
  dir: string;
  group: PluginGroup;
  make: () => ProfilePlugin<unknown>;
};

const DEFS: Def[] = [
  // ---------- visual ----------
  {
    dir: "BannerSlot",
    group: "visual",
    make: () =>
      createBannerSlotPlugin({
        gradient: ["#6a11cb", "#2575fc"],
        avatar: AVATAR,
        avatarRound: true,
        height: 160,
        overlay: SAMPLE_USER.name,
      }),
  },
  {
    dir: "VerifyBadge",
    group: "visual",
    make: () => createVerifyBadgePlugin({ type: "personal" }),
  },

  // ---------- data ----------
  {
    dir: "StatRow",
    group: "data",
    make: () => createStatRowPlugin({ items: SAMPLE_USER.stats }),
  },
  {
    dir: "BioSlot",
    group: "data",
    make: () =>
      createBioSlotPlugin({
        name: SAMPLE_USER.name,
        subtitle: "前端工程师 · 组件库作者",
        bio: SAMPLE_USER.bio,
        location: "上海",
        joinDate: "2021 加入",
      }),
  },
  {
    dir: "TagList",
    group: "data",
    make: () => createTagListPlugin({ tags: SAMPLE_TAGS }),
  },

  // ---------- interaction ----------
  {
    dir: "TabSync",
    group: "interaction",
    make: () => createTabSyncPlugin({ tabs: TABS }),
  },
  {
    dir: "FollowEcho",
    group: "interaction",
    make: () => createFollowEchoPlugin({ size: "md" }),
  },

  // ---------- visual (extra) ----------
  {
    dir: "SocialLinks",
    group: "visual",
    make: () => createSocialLinksPlugin({ links: SAMPLE_LINKS }),
  },
  {
    dir: "WorksGrid",
    group: "visual",
    make: () => createWorksGridPlugin({ items: SAMPLE_WORKS, tab: "works" }),
  },

  // ---------- visual (extra) ----------
  {
    dir: "MembershipBadge",
    group: "visual",
    make: () => createMembershipBadgePlugin(SAMPLE_MEMBERSHIP),
  },
  {
    dir: "QRShare",
    group: "visual",
    make: () => createQRSharePlugin({ url: "https://vane.dev/u/frankvane" }),
  },
  {
    dir: "AchievementWall",
    group: "visual",
    make: () =>
      createAchievementWallPlugin({
        items: SAMPLE_ACHIEVEMENTS,
        tab: "about",
        title: "成就",
      }),
  },

  // ---------- data (extra) ----------
  {
    dir: "LiveStatus",
    group: "data",
    make: () => createLiveStatusPlugin(SAMPLE_LIVE),
  },
  {
    dir: "ContactCard",
    group: "data",
    make: () => createContactCardPlugin(SAMPLE_CONTACT),
  },
  {
    dir: "ActivitySummary",
    group: "data",
    make: () => createActivitySummaryPlugin(SAMPLE_ACTIVITY),
  },

  // ---------- interaction (extra) ----------
  {
    dir: "MessageButton",
    group: "interaction",
    make: () => createMessageButtonPlugin({}),
  },
];

export const PLUGINS: PluginInfo[] = DEFS.map((def) => {
  const doc = docOf(def.dir);
  return {
    dir: def.dir,
    factory: `create${def.dir}Plugin`,
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

/** 默认勾选：够看出「一个可用的主页」，又不互相干扰 */
export const DEFAULT_ON = [
  "BannerSlot",
  "StatRow",
  "TabSync",
  "VerifyBadge",
  "FollowEcho",
  "BioSlot",
  "SocialLinks",
  "TagList",
  "WorksGrid",
  "MembershipBadge",
  "QRShare",
  "LiveStatus",
  "ContactCard",
  "ActivitySummary",
  "MessageButton",
  "AchievementWall",
];
