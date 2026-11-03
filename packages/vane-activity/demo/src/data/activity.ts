/**
 * 演示用活动数据（插件工坊 / 场景卡共用一份，避免手抄漂移）
 *
 * 进度由任务完成度加权求得（见内核 computeProgress）：
 *  - sampleActivity：(1 + 0.6 + 0) / 3 ≈ 0.53 → 5 元券(0.5) 可领、其余未达阈值；
 *  - fullActivity：三项全完成 → 1.0 → 终极大礼包(1) 可领，并触发 100% 庆祝浮层。
 */
import type { ActivityData } from "vane-activity";

export const sampleActivity: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  // TaskTabsPlugin 的分组定义；任务的 group 字段对应 key
  taskGroups: [
    { key: "daily", label: "每日", icon: "📅" },
    { key: "growth", label: "成长", icon: "🌱" },
    { key: "invite", label: "邀请", icon: "🤝" },
  ],
  tasks: [
    {
      id: "t1",
      title: "每日签到",
      desc: "连续签到领积分",
      progress: 1,
      status: "completed",
      group: "daily",
      actionLabel: "已签到",
    },
    {
      id: "t2",
      title: "浏览会场 3 个商品",
      desc: "了解活动好物",
      progress: 0.6,
      status: "available",
      group: "growth",
      actionLabel: "去浏览",
      rewardId: "r1",
    },
    {
      id: "t3",
      title: "邀请 1 位好友",
      desc: "助力解锁终极大奖",
      progress: 0,
      status: "locked",
      group: "invite",
      actionLabel: "去邀请",
      rewardId: "r2",
    },
  ],
  rewards: [
    { id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️", desc: "浏览达标即可领取" },
    { id: "r2", title: "20 元会员券", threshold: 0.9, icon: "💎", desc: "邀请好友后解锁" },
    { id: "r3", title: "终极大礼包", threshold: 1, icon: "🎁", desc: "全部任务完成发放" },
  ],
  rules: [
    { title: "活动时间", content: "2024.07.01 - 2024.07.07，逾期任务与奖励失效。" },
    {
      title: "领取规则",
      content: "奖励按总体进度阈值解锁，达标后点击「领取」发放至账户；券类奖励有效期 7 天。",
    },
    {
      title: "特别说明",
      content: "邀请任务需好友完成注册并首单，视为有效助力；异常账号不予发放。",
    },
  ],
  // 社交类插件（ShareBoostPlugin / LeaderboardPlugin）读取这两块；
  // 不传时 ShareBoost 回退 config 默认值、Leaderboard 显示「暂无排行数据」。
  endTime: "2026-11-10T23:59:59+08:00",
  share: {
    total: 3,
    used: 1,
    helpers: [
      { id: "u1", name: "阿柚", avatar: "🍊" },
      { id: "u2", name: "小满", avatar: "🌾" },
    ],
  },
  leaderboard: [
    { id: "u1", name: "阿柚", score: 1280, avatar: "🍊" },
    { id: "me", name: "我", score: 960, avatar: "🙋", isMe: true },
    { id: "u2", name: "小满", score: 910, avatar: "🌾" },
    { id: "u3", name: "大白", score: 640, avatar: "🐻" },
  ],
  // AnnouncementPlugin / CheckinCalendarPlugin 读取这两块
  announcements: [
    "8.1-8.7 全场券 5 折起，先领券再下单",
    "每日 20:00 抽 20 元无门槛券，限前 1000 名",
    "邀请好友下单再得 10 元红包，上不封顶",
  ],
  checkin: { days: 7, done: 3 },
};

export const fullActivity: ActivityData = {
  ...sampleActivity,
  // 三项全完成 → 加权进度 = (1 + 1 + 1) / 3 = 1.0 → 100%，触发庆祝浮层与终极大奖领取。
  // （注意：进度按任务完成度加权，只有全部任务 completed 才会到 100%；
  //  若仅把部分任务置 completed，进度会停在 <1 而永不触发庆祝。）
  tasks: sampleActivity.tasks.map((t) => ({
    ...t,
    progress: 1,
    status: "completed",
  })),
};
