import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createRuleModalPlugin } from "vane-activity/custom-plugins/RuleModalPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * RuleModalPlugin：规则区只留一个「活动规则 ›」按钮，点击弹出模态窗看完整规则。
 *
 * 独占语义示范：RuleModal 与 RuleExpand 都声明独占 renderRules 槽位，
 * 同时挂载时只留 priority 高者（RuleExpand 40 > RuleModal 39）。
 * 想要弹窗形态，就别挂 RuleExpand——本例正是如此。
 *
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 0.6, status: "available" },
    { id: "t3", title: "邀请 1 位好友", progress: 0, status: "locked" },
  ],
  rewards: [],
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
};

const Activity = withPlugins(ActivityCore, [
  createRuleModalPlugin(), // 独占 renderRules（未挂 RuleExpand，所以由它接管）
  createTaskListPlugin(),
]);

export const meta = {
  slug: "rule-modal",
  title: "弹窗规则 RuleModalPlugin",
  group: "plugin",
  intro:
    "规则折叠的弹窗形态：入口只剩一个按钮，规则长文收进模态窗；与 RuleExpand 同槽独占。",
};

export default function Stage() {
  return <Activity data={data} />;
}
