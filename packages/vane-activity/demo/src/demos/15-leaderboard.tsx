import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createLeaderboardPlugin } from "vane-activity/custom-plugins/LeaderboardPlugin";
import { createShareBoostPlugin } from "vane-activity/custom-plugins/ShareBoostPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * LeaderboardPlugin + ShareBoostPlugin：两个底部社交插件同槽共存。
 * 排序规则是「order 升序 → priority 降序」，这里显式写 order：
 * 榜单 order 0 在上、助力 order 1 在下 —— 以后调 priority 也不会打乱版式。
 *
 * 榜单数据来自 data.leaderboard，按 score 降序取前 3；isMe 行浅橙底 + 「我」标签。
 * 若把 isMe 那条的 score 改到第 4 名以下，插件会自动在底部用虚线补一行真实名次。
 *
 * 进度 53% 来自任务加权 (1 + 0.6 + 0) / 3。
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 0.6, status: "available" },
    { id: "t3", title: "邀请 1 位好友", progress: 0, status: "locked" },
  ],
  rewards: [{ id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️" }],
  rules: [],
  leaderboard: [
    { id: "u1", name: "阿柚", score: 1280, avatar: "🍊" },
    { id: "me", name: "我", score: 960, avatar: "🙋", isMe: true },
    { id: "u2", name: "小满", score: 910, avatar: "🌾" },
    { id: "u3", name: "大白", score: 640, avatar: "🐻" },
  ],
  share: { total: 3, used: 1, helpers: [{ id: "u1", name: "阿柚", avatar: "🍊" }] },
};

const Activity = withPlugins(ActivityCore, [
  createTaskListPlugin(),
  createLeaderboardPlugin({ title: "好友积分榜", topN: 3, order: 0 }),
  createShareBoostPlugin({ title: "邀请好友助力", order: 1 }),
]);

export const meta = {
  slug: "leaderboard",
  title: "好友榜 LeaderboardPlugin",
  group: "plugin",
  plugins: ["LeaderboardPlugin", "ShareBoostPlugin", "TaskListPlugin"],
  intro: "前 3 名 + 我的名次高亮；与助力条同槽靠 order 定序，互不重影。",
};

export default function Stage() {
  return <Activity data={data} />;
}
