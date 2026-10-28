/**
 * demo 共用的样例数据（不进 dist，仅演示站使用）
 *
 * 头像用内联 SVG data URI，避免演示站依赖外部图片资源（内网 / 离线也能跑）。
 */

const svg = (bg: string, letter: string) =>
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
      `<rect width="96" height="96" rx="48" fill="${bg}"/>` +
      `<text x="48" y="62" font-size="44" text-anchor="middle" fill="#fff" font-family="sans-serif">${letter}</text>` +
      `</svg>`
  );

export const AVATAR = svg("#2575fc", "F");

export const SAMPLE_USER = {
  id: "u_1",
  name: "Frank Vane",
  handle: "frankvane",
  bio: "把「旁边那一堆需求」拆成可勾选的插件。",
  stats: [
    { value: 1280, label: "关注" },
    { value: "12.4w", label: "粉丝" },
    { value: 4823, label: "获赞" },
    { value: 9, label: "作品" },
  ],
};

/** 内容区：根据 activeTab 渲染不同段落（TabSync 驱动） */
export const TAB_CONTENT: Record<string, string> = {
  works: "这里是「作品」区：图文卡片、视频、长文混排。",
  feeds: "这里是「动态」区：时间线式的短内容流。",
  about: "这里是「关于」区：简介、标签、外链。",
};

/** 社交外链（SocialLinks 演示用；图标用单/双字占位，不依赖图片资源） */
export const SAMPLE_LINKS = [
  { platform: "weibo", href: "https://weibo.com/" },
  { platform: "zhihu", href: "https://www.zhihu.com/" },
  { platform: "github", href: "https://github.com/" },
  { platform: "email", href: "mailto:frank@vane.dev" },
  { platform: "site", href: "https://vane.dev/" },
];

/** 兴趣标签（TagList 演示用） */
export const SAMPLE_TAGS = [
  "React",
  "TypeScript",
  "组件库",
  "设计系统",
  "可视化",
  "开源",
];

/** 作品网格（WorksGrid 演示用；coverColor 纯色占位，离线可跑） */
export const SAMPLE_WORKS = [
  { id: "w1", title: "vane-waterfall 重构笔记", coverColor: "#6a11cb", meta: "2.4w 阅读" },
  { id: "w2", title: "插件化架构实战", coverColor: "#2575fc", meta: "1.1w 点赞" },
  { id: "w3", title: "从 0 写一个组件库", coverColor: "#11998e", meta: "8.6k 收藏" },
  { id: "w4", title: "拖拽排序的 7 种实现", coverColor: "#ff7e5f", meta: "3 周前" },
  { id: "w5", title: "可视化排版台", coverColor: "#fc466b", meta: "团队协作" },
  { id: "w6", title: "暗色主题规范", coverColor: "#3a1c71", meta: "设计稿" },
];

/** 会员等级（MembershipBadge 演示用） */
export const SAMPLE_MEMBERSHIP = { level: 3 as 1 | 2 | 3 };

/** 直播状态（LiveStatus 演示用） */
export const SAMPLE_LIVE = { status: "live" as const, liveTitle: "前端架构夜聊" };

/** 联系信息（ContactCard 演示用；链接安全处理由插件负责） */
export const SAMPLE_CONTACT = {
  email: "frank@vane.dev",
  phone: "138-0000-0000",
  site: "https://vane.dev",
  address: "上海 · 徐汇",
};

/** 活跃度小结（ActivitySummary 演示用） */
export const SAMPLE_ACTIVITY = {
  lastActive: "2 小时前",
  postsThisMonth: 12,
  totalViews: "120w",
};

/** 成就 / 勋章墙（AchievementWall 演示用；glyph 单/双字占位，离线可跑） */
export const SAMPLE_ACHIEVEMENTS = [
  { id: "a1", title: "年度创作者", desc: "2025", glyph: "年", color: "#e0b34a" },
  { id: "a2", title: "万粉", desc: "粉丝破万", glyph: "万", color: "#2575fc" },
  { id: "a3", title: "开源之星", desc: "50+ repo", glyph: "星", color: "#11998e" },
  { id: "a4", title: "优质教程", desc: "官方推荐", glyph: "优", color: "#fc466b" },
  { id: "a5", title: "连续打卡", desc: "365 天", glyph: "勤", color: "#ff7e5f" },
  { id: "a6", title: "社区领袖", desc: "版主", glyph: "领袖", color: "#6a11cb" },
  { id: "a7", title: "早期用户", desc: "内测", glyph: "初", color: "#9aa7b5" },
  { id: "a8", title: "乐于助人", desc: "解答 1k+", glyph: "助", color: "#2ecc71" },
];
