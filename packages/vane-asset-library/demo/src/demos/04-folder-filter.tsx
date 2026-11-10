/**
 * 示例 04 · 文件夹导航
 *
 * 文件夹数量由 items 现算（宿主传了 count 就用宿主的），空文件夹默认仍然显示 ——
 * 素材库的「空文件夹」本身是信息，藏起来会让人以为文件夹被删了。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "folder-filter",
  title: "文件夹导航",
  group: "plugin",
  plugin: "FolderFilterPlugin",
  intro:
    "工具栏左侧的文件夹下拉，「全部素材」加四个分组，每项带实时数量；数量来自 items 现算，不看后端脸色。",
  why: "素材库的分组维度通常是「谁负责 / 用在哪」，比标签更稳定。数量现算可以避免宿主忘了同步 count 造成的空白感。",
  plugs: [
    {
      fn: "createFolderFilterPlugin",
      cfg: 'allLabel: "全部素材", hideEmpty: false',
      why: "绑定 ctx.folderId 与 ctx.setFolder；数量由 normalizeFolders + filterAssets 的中间结果算出。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 520,
};

export default makeStage("FolderFilterPlugin");
