import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createCheckinCalendarPlugin } from "vane-activity/custom-plugins/CheckinCalendarPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * CheckinCalendarPlugin：签到日历，落在 renderProgress 槽，与进度条同槽共存。
 *
 * 靠 order 定上下：日历 order 0 在上、进度条 order 1 在下（order 升序优先，
 * 同 order 才比 priority，所以想稳定版式就显式写 order）。
 *
 * data.checkin = { days: 7, done: 3 } 表示 7 天里已签 3 天，
 * todayIndex 缺省等于 done，于是第 4 格显示虚线橙框「今」，按钮可点；
 * 不传 onCheckin 时点按钮走组件内乐观 +1（签满 7 天后按钮变「已完成」）。
 *
 * 进度仍是 53%：任务加权 (1 + 0.6 + 0) / 3。
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  checkin: { days: 7, done: 3 },
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 0.6, status: "available" },
    { id: "t3", title: "邀请 1 位好友", progress: 0, status: "locked" },
  ],
  rewards: [{ id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️" }],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createCheckinCalendarPlugin({ title: "连续签到 · 7 天", order: 0 }),
  createProgressFxPlugin({ order: 1 }),
  createTaskListPlugin(),
]);

export const meta = {
  slug: "checkin",
  title: "签到日历 CheckinCalendarPlugin",
  group: "plugin",
  intro: "N 格三态日历（已签 / 今日 / 未开始），点「今日签到」乐观 +1；与进度条同槽靠 order 定序。",
};

export default function Stage() {
  return <Activity data={data} />;
}
