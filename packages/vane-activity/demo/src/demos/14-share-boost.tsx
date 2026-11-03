import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createShareBoostPlugin } from "vane-activity/custom-plugins/ShareBoostPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * ShareBoostPlugin：好友助力条（renderFooter 槽，活动最底部）。
 * 名额来自 data.share —— total 3 / used 2 / helpers 2 人，
 * 所以 3 段格子亮 2 段、文案「还差 1 人解锁下一档奖励」，按钮可点。
 *
 * 不传 onInvite 时点一下自己 +1（本地乐观态，无后端也能演示）；
 * 真实业务请传 onInvite 并回写 data.share.used，否则按钮点了没有视觉变化。
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
  share: {
    total: 3,
    used: 2,
    helpers: [
      { id: "u1", name: "阿柚", avatar: "🍊" },
      { id: "u2", name: "小满", avatar: "🌾" },
    ],
  },
};

const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createTaskListPlugin(),
  createShareBoostPlugin({ title: "邀请好友助力", maxAvatars: 5 }),
]);

export const meta = {
  slug: "share-boost",
  title: "好友助力 ShareBoostPlugin",
  group: "plugin",
  plugins: ["ShareBoostPlugin", "ProgressFxPlugin", "TaskListPlugin"],
  intro: "分段名额 + 头像堆 + 「还差 N 人」；满额按钮切深灰，不用 opacity 压字。",
};

export default function Stage() {
  return <Activity data={data} />;
}
