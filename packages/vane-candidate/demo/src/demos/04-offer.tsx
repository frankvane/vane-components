import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "offer",
  title: "Offer 状态徽章",
  group: "badge",
  plugin: "OfferPlugin",
  intro: "candidate.offer 存在时显示状态胶囊：审批中灰 / 已发出蓝 / 已接受绿 / 已婉拒红。",
  why: "Offer 阶段的候选人需要和普通候选人区分开，薪资信息藏在悬停提示里不占版面。",
  plugs: [
    {
      fn: "createOfferPlugin",
      cfg: `{}`,
      why: "纯展示插件：四态配色内置，labels 可整体替换文案。",
    },
  ],
  props: [],
  note: "样例里 c-002（已发出）与 c-007（已接受）会挂徽章；没有 offer 字段的卡片不受影响。",
};

export default makeStage("OfferPlugin");
