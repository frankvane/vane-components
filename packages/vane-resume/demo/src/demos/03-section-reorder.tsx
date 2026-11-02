import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "section-reorder",
  title: "板块重排",
  group: "plugin",
  plugin: "SectionReorderPlugin",
  intro: "调整基本信息 / 工作 / 教育 / 技能等板块顺序，顺序经 ctx.state 驱动核心渲染。",
  why: "技术岗把「工作」提前、学术岗把「教育」提前，叙事顺序影响第一印象。",
  plugs: [
    {
      fn: "createSectionReorderPlugin",
      cfg: `sections: ["basics", "skills", "work", "education", "projects", "extra", "attachments"]`,
      why: "把「技能」提到「工作」之前，默认即生效，不用点按钮也能看出板块被重排。",
    },
  ],
  props: [],
};

export default makeStage("SectionReorderPlugin");
