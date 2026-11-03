import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "interview-slot",
  title: "面试安排",
  group: "action",
  plugin: "InterviewSlotPlugin",
  intro: "「安排面试」入口打开浮层：从时间槽 / 面试官 / 形式中点选保存到 candidate.interview。",
  why: "约面是高频且琐碎的动作：可选项收敛成按钮，点两下完成，不用手填表单。",
  plugs: [
    {
      fn: "createInterviewSlotPlugin",
      cfg: `{ slots: ["周二 14:00", "周三 10:00", "周四 16:00"], interviewers: ["王工", "李总监"], modes: ["onsite", "video"] }`,
      why: "已安排的卡片正文出现 📅 面试信息条；再次点按钮是「改期」。",
    },
  ],
  props: [],
  note: "保存经 ctx.updateCandidate；「取消面试安排」把 interview 字段清回 undefined。",
};

export default makeStage("InterviewSlotPlugin");
