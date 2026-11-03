import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "note",
  title: "招聘备注",
  group: "action",
  plugin: "NotePlugin",
  intro: "卡片操作区「备注 (n)」按钮打开浮层：查看 / 新增 / 删除沟通记录，写回 candidate.notes。",
  why: "电话沟通后的结论必须留在候选人身上，否则下一个面试官要重新踩坑。",
  plugs: [
    {
      fn: "createNotePlugin",
      cfg: `{ authorName: "{{author}}" }`,
      why: "新增备注自动署名 + 记时间；maxNotes 控制每人最多保留条数。",
    },
  ],
  props: [],
  controls: [
    {
      key: "author",
      label: "备注署名",
      kind: "select",
      init: "演示 HR",
      options: [
        { label: "演示 HR", value: "演示 HR" },
        { label: "张HR", value: "张HR" },
        { label: "面试官", value: "面试官" },
      ],
    },
  ],
  note: "样例里陈知远已有一条备注；所有插件写入的备注 author 相同即可删（演示语义）。",
};

export default makeStage("NotePlugin");
