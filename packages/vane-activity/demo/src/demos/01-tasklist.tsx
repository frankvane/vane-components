import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * 单插件聚焦：只挂 TaskListPlugin。
 * 此时活动只剩「任务清单」区——每行展示标题 / 描述 / 进度与状态，并带「去完成」动作按钮。
 * 每行的小进度条读的是 task.progress：签到 100%、浏览 60%、邀请 0%（越权锁定的不显示）。
 *
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  tasks: [
    {
      id: "t1",
      title: "每日签到",
      desc: "连续签到领积分",
      progress: 1,
      status: "completed",
      actionLabel: "已签到",
    },
    {
      id: "t2",
      title: "浏览会场 3 个商品",
      desc: "了解活动好物",
      progress: 0.6,
      status: "available",
      actionLabel: "去浏览",
    },
    {
      id: "t3",
      title: "邀请 1 位好友",
      desc: "助力解锁终极大奖",
      progress: 0,
      status: "locked",
      actionLabel: "去邀请",
    },
  ],
  rewards: [],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [createTaskListPlugin()]);

export const meta = {
  slug: "tasklist",
  title: "任务清单 TaskListPlugin",
  group: "plugin",
  intro:
    "只挂 TaskListPlugin 时，活动只剩「任务清单」区：每行展示标题 / 描述 / 进度与状态，并带「去完成」动作按钮。",
};

export default function Stage() {
  return <Activity data={data} onTaskAction={(id) => console.log("task action", id)} />;
}
