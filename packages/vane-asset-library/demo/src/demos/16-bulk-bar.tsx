/**
 * 示例 16 · 批量操作条
 *
 * 未选择时页脚不渲染任何东西：空着占一行会把网格往下推，页面每次点选都「跳」一下。
 * 所有动作名带 `bulk:` 前缀，宿主据此区分单卡操作与批量操作。
 */
import React, { useCallback } from "react";
import { SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";
import { baseProps, useLibrary } from "./_factory";
import type { DemoMeta, DemoStageProps } from "./types";

export const meta: DemoMeta = {
  slug: "bulk-bar",
  title: "批量操作条",
  group: "plugin",
  plugin: "BulkBarPlugin",
  intro:
    "选中素材后页脚浮出操作条：已选 N 项 + 批量下载 / 移动到 / 删除。清空选择后自动收起。",
  why: "多选的意义在批量动作。把动作条固定在页脚而不是顶部，是因为操作对象在下面，视线不用来回跳。",
  plugs: [
    {
      fn: "createBulkBarPlugin",
      cfg: 'label: "已选 {n} 项", actions: [{ action: "bulk:download", label: "批量下载" }, { action: "bulk:delete", label: "批量删除", tone: "danger" }]',
      why: "文案里的 {n} 会被替换成数量；动作通过 requestAction(action, { ids }) 抛出整批 id。",
    },
  ],
  props: ["multiple", "maxSelected={{maxSelected}}", "pageSize={{pageSize}}"],
  controls: [
    { key: "multiple", label: "多选", kind: "switch", init: true, nonLayout: true },
    { key: "maxSelected", label: "选择上限", kind: "number", init: 0, min: 0, max: 24, step: 1 },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 24, step: 6 },
  ],
  stageHeight: 520,
  note: "点几张卡片，页脚会浮出来；再点「清空」看它收起。",
};

function Stage({ cfg, log }: DemoStageProps) {
  const Library = useLibrary("BulkBarPlugin", cfg);

  const onAssetAction = useCallback(
    (action: string, payload: { id?: string; ids?: string[] }) => {
      const count = payload.ids?.length ?? (payload.id ? 1 : 0);
      log(`${action} · ${count} 项`);
    },
    [log]
  );

  return (
    <div className="stage">
      <Library
        items={SAMPLE_ASSETS}
        folders={SAMPLE_FOLDERS}
        {...baseProps(cfg, log)}
        onAssetAction={onAssetAction}
      />
    </div>
  );
}

export default Stage;
