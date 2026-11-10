/**
 * 示例 10 · 类型角标
 *
 * 图片 / 视频角标贴在缩略图左下角。只有一种介质时应该关掉它 —— 全是图片的库上
 * 每个卡片都写「图片」是在制造噪音。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "kind-badge",
  title: "类型角标",
  group: "plugin",
  plugin: "KindBadgePlugin",
  intro: "缩略图左下角的「图片 / 视频」角标，文案可换，可限定只对某种类型显示。",
  why: "视频有缩略图、图片也有缩略图，光看图分不出能不能播。角标是最省成本的区分方式。",
  plugs: [
    {
      fn: "createKindBadgePlugin",
      cfg: 'labels: { video: "视频" }, showFor: ["video"]',
      why: "只给视频加角标：图片是默认情况，标出来反而更吵。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    {
      key: "showFor",
      label: "角标范围",
      kind: "select",
      init: "video",
      options: [
        { label: "仅视频", value: "video" },
        { label: "图片 + 视频", value: "both" },
      ],
      nonLayout: true,
    },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 480,
};

export default makeStage("KindBadgePlugin");
