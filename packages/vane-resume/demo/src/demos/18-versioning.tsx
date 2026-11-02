import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "versioning",
  title: "版本管理",
  group: "plugin",
  plugin: "VersioningPlugin",
  intro: "快照数据 / 模板 / 语言 / 隐私态，保存命名版本，可恢复 / 删除，持久化 localStorage。",
  why: "同一份简历投不同公司要改好几版，存快照比复制文件省心。",
  plugs: [
    {
      fn: "createVersioningPlugin",
      cfg: `maxVersions: 20`,
      why: "renderToolbar 存版本，renderFooter 显示当前版本，恢复即切回整份状态。",
    },
  ],
  props: [],
  note: "演示站点用 localStorage 持久化，清缓存会丢失版本快照。",
};

export default makeStage("VersioningPlugin");
