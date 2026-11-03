import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";

/**
 * 单插件聚焦：只挂 ProgressFxPlugin。
 *
 * 进度不是拍脑袋写的数字，而是「任务完成度的加权平均」（内核 computeProgress）：
 *   progress = Σ(task.progress × task.weight) / Σ(task.weight)
 *
 * 下面的数据三项任务全部 progress = 1、weight 取默认 1，所以：
 *   (1×1 + 1×1 + 1×1) / (1 + 1 + 1) = 3 / 3 = 1.0 → 界面显示 100%
 * 只有到 1.0 才会渲染那条「🎉 进度达成 100%」庆祝浮层（停在 0.99 也不弹）。
 *
 * 把三项 progress 改成 1 / 0.6 / 0 试试：(1 + 0.6 + 0) / 3 ≈ 0.53 → 界面显示 53%。
 *
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 1, status: "completed" },
    { id: "t3", title: "邀请 1 位好友", progress: 1, status: "completed" },
  ],
  rewards: [],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [createProgressFxPlugin()]);

export const meta = {
  slug: "progressfx",
  title: "进度特效 ProgressFxPlugin",
  group: "plugin",
  plugins: ["ProgressFxPlugin"],
  intro:
    "顶部进度条 + 百分比数字。本例三项任务全完成 → 3/3 = 100%，弹出庆祝浮层；把任务进度改成 1/0.6/0 就是 53%。",
};

export default function Stage() {
  return <Activity data={data} />;
}
