import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createRuleExpandPlugin } from "vane-activity/custom-plugins/RuleExpandPlugin";

/**
 * 单插件聚焦：只挂 RuleExpandPlugin。
 * 渲染「活动规则」可折叠面板：折叠态按行数截断长文，点击展开并同步 aria-expanded。
 * rules 也支持纯字符串（整段文字不分条）或 { title, content } 分条结构，本例用后者。
 *
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  tasks: [],
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

const Activity = withPlugins(ActivityCore, [createRuleExpandPlugin()]);

export const meta = {
  slug: "ruleexpand",
  title: "规则折叠 RuleExpandPlugin",
  group: "plugin",
  intro:
    "只挂 RuleExpandPlugin 时，活动只剩「活动规则」可折叠面板：折叠态按行数截断长文，点击展开并同步 aria-expanded。",
};

export default function Stage() {
  return <Activity data={data} />;
}
