import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "deliver-track",
  title: "投递追踪",
  group: "plugin",
  plugin: "DeliverTrackPlugin",
  intro: "记录投递去向与状态（投递 / 面试 / offer / 拒绝），页脚汇总，浮层时间线。",
  why: "广撒网投完容易忘，集中看一眼就知道谁进了面试。",
  plugs: [
    {
      fn: "createDeliverTrackPlugin",
      cfg: `initial: [{ company: "字节", status: "面试" }]`,
      why: "renderFooter 汇总各状态计数，renderOverlay 展开时间线。",
    },
  ],
  props: [],
};

export default makeStage("DeliverTrackPlugin");
