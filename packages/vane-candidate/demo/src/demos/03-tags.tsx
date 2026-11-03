import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "tags",
  title: "候选人标签",
  group: "badge",
  plugin: "TagPlugin",
  intro: "标签 chips 展示 + 管理浮层：点卡片上的「标签」按钮即可添加 / 删除，写回 candidate.tags。",
  why: "「重点 / 备选 / 急招」这类人工标记是筛选插件的数据源，先给卡片打上标签。",
  plugs: [
    {
      fn: "createTagPlugin",
      cfg: `{ suggestTags: ["重点", "备选", "急招", "内推"], maxTags: {{maxTags}} }`,
      why: "快捷标签一键添加；超过 3 个折叠成 +N，点管理浮层看全量。",
    },
  ],
  props: [],
  controls: [{ key: "maxTags", label: "最多标签数", kind: "number", init: 8, min: 3, max: 12, step: 1 }],
  note: "写操作走 ctx.updateCandidate，装配层自动落内部态并追加 history。",
};

export default makeStage("TagPlugin");
