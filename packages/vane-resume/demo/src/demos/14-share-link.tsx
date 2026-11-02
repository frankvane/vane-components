import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "share-link",
  title: "分享链接",
  group: "plugin",
  plugin: "ShareLinkPlugin",
  intro: "生成可分享 URL（编码数据或指向宿主），弹窗复制；无宿主时提示数据安全。",
  why: "把简历发给 HR 时给一个干净链接，比传 PDF 附件更轻。",
  plugs: [
    {
      fn: "createShareLinkPlugin",
      cfg: `onBuildUrl: (data) => "https://vane.dev/r/" + encodeURIComponent(data.basics.name)`,
      why: "推荐用 onBuildUrl 钩到宿主，避免把整份数据塞进 hash；renderToolbar 提供复制按钮。",
    },
  ],
  props: [],
};

export default makeStage("ShareLinkPlugin");
