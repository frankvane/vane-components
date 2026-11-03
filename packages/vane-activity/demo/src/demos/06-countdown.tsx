import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createCountdownTimerPlugin } from "vane-activity/custom-plugins/CountdownTimerPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * CountdownTimerPlugin：进度条下方多一行「距活动结束 x天HH:MM:SS」，每秒自走。
 * 截止时间可来自工厂配置，也可像本例一样放在 data.endTime（两者都没配就不渲染）。
 * 最后 1 小时进入紧急态（文字变警示色）。
 *
 * 与 ProgressFx 同槽共存（renderProgress 都不声明独占）：进度条在上、倒计时在下。
 *
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  endTime: "2026-12-31T23:59:59+08:00",
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 0.6, status: "available" },
    { id: "t3", title: "邀请 1 位好友", progress: 0, status: "locked" },
  ],
  rewards: [],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createCountdownTimerPlugin(),
  createTaskListPlugin(),
]);

export const meta = {
  slug: "countdown",
  title: "倒计时 CountdownTimerPlugin",
  group: "plugin",
  plugins: ["ProgressFxPlugin", "CountdownTimerPlugin", "TaskListPlugin"],
  intro:
    "进度条下方追加每秒自走的倒计时行，截止时间读 data.endTime；最后 1 小时变紧急色。",
};

export default function Stage() {
  return <Activity data={data} />;
}
