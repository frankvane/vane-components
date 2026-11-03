import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createAnnouncementPlugin } from "vane-activity/custom-plugins/AnnouncementPlugin";
import { createActivityHeaderPlugin } from "vane-activity/custom-plugins/ActivityHeaderPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * AnnouncementPlugin：公告条，落在 renderHeader 槽，位于头部横幅之上。
 * priority 8 > ActivityHeaderPlugin 的 5 —— 同槽默认公告在上、横幅在下，不用写 order。
 *
 * 跑马灯是纯 CSS（条目复制一份 + translateX(-50%)），没有任何 setInterval；
 * 悬停会暂停，系统开了「减少动态效果」时自动静止。
 * 条目来自 data.announcements，插件 config 的 items 只做无数据时的兜底。
 *
 * 进度 53% 来自任务加权 (1 + 0.6 + 0) / 3。
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  announcements: [
    "8.1-8.7 全场券 5 折起，先领券再下单",
    "每日 20:00 抽 20 元无门槛券，限前 1000 名",
    "邀请好友下单再得 10 元红包，上不封顶",
  ],
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 0.6, status: "available" },
    { id: "t3", title: "邀请 1 位好友", progress: 0, status: "locked" },
  ],
  rewards: [{ id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️" }],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createAnnouncementPlugin({ label: "公告", speedSec: 18 }),
  createActivityHeaderPlugin({ subtitle: "连续签到 7 天，最高领 20 元会员券", icon: "☀️" }),
  createProgressFxPlugin(),
  createTaskListPlugin(),
]);

export const meta = {
  slug: "announcement",
  title: "公告条 AnnouncementPlugin",
  group: "plugin",
  plugins: ["AnnouncementPlugin", "ActivityHeaderPlugin", "ProgressFxPlugin", "TaskListPlugin"],
  intro: "纯 CSS 跑马灯播报多条公告，悬停暂停；与头部横幅同槽，靠 priority 定在横幅之上。",
};

export default function Stage() {
  return <Activity data={data} />;
}
