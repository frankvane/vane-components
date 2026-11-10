/**
 * 示例 12 · 状态角标
 *
 * ready 不显示任何东西；processing 显示「转码中」，failed 显示「处理失败」并压一层遮罩。
 * 状态为 processing / failed 的素材不可选 —— 选一个还不能用的素材，批量操作必然失败。
 */
import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "status-badge",
  title: "状态角标",
  group: "plugin",
  plugin: "StatusBadgePlugin",
  intro:
    "转码中 / 处理失败两种状态贴在缩略图右上角，失败项整体压暗；两种状态都不可选，点击也不进入选择集。",
  why: "「上传完成」不等于「可用」。转码、审核、病毒扫描都可能让素材暂时不可用，状态必须显式表达，否则用户会以为文件丢了。",
  plugs: [
    {
      fn: "createStatusBadgePlugin",
      cfg: '{ labels: { processing: "转码中", failed: "处理失败" } }',
      why: "文案可覆盖；ready 恒不显示，避免「每一张都写着就绪」。",
    },
  ],
  props: ["multiple", "pageSize={{pageSize}}"],
  controls: [
    { key: "multiple", label: "多选", kind: "switch", init: true, nonLayout: true },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 480,
  note: "示例数据里有 2 个「转码中」和 1 个「处理失败」，都在第一页附近。",
};

export default makeStage("StatusBadgePlugin");
