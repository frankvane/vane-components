/**
 * 示例 18 · 空态分叉
 *
 * 两种空态必须分开：库里真的没素材（empty）→ 引导上传；
 * 筛出来 0 条（filtered）→ 给「清空筛选」。用同一句「暂无数据」是产品事故。
 */
import React, { useCallback, useMemo } from "react";
import type { AssetItem } from "vane-asset-library";
import { SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";
import { baseProps, useLibrary } from "./_factory";
import type { DemoMeta, DemoStageProps } from "./types";

export const meta: DemoMeta = {
  slug: "empty-state",
  title: "空态分叉",
  group: "plugin",
  plugin: "EmptyStatePlugin",
  intro:
    "把素材清空看「空库」，或搜索一个不存在的关键词看「筛空」—— 两种空态给的出口不一样。",
  why: "空库时用户该做的是上传，筛空时该做的是清条件。一句「暂无数据」会让用户卡在原地不知道该改什么。",
  plugs: [
    {
      fn: "createEmptyStatePlugin",
      cfg: '{ clearLabel: "清空筛选" }',
      why: "单值槽：同一时刻只有一个空态节点生效，多个插件抢这个槽时按 priority 取最高的。",
    },
  ],
  props: ["pageSize={{pageSize}}"],
  controls: [
    {
      key: "mode",
      label: "数据源",
      kind: "select",
      init: "normal",
      options: [
        { label: "有素材", value: "normal" },
        { label: "空库", value: "empty" },
      ],
    },
    { key: "pageSize", label: "每页", kind: "number", init: 12, min: 6, max: 36, step: 6 },
  ],
  stageHeight: 440,
  note: "筛空状态：把数据源留在「有素材」，然后在搜索框输入「不存在的关键词」。",
};

const NO_ITEMS: AssetItem[] = [];

function Stage({ cfg, log }: DemoStageProps) {
  const Library = useLibrary("EmptyStatePlugin", cfg);
  // 用同一份 props 对象：切数据源时只换 items，不重建装配
  const props = useMemo(() => baseProps(cfg, log), [cfg, log]);
  const onUpload = useCallback(
    (files: File[]) => log(`空态里点上传：收到 ${files.length} 个文件`),
    [log]
  );

  return (
    <div className="stage">
      <Library
        items={cfg.mode === "empty" ? NO_ITEMS : SAMPLE_ASSETS}
        folders={cfg.mode === "empty" ? [] : SAMPLE_FOLDERS}
        {...props}
        onUpload={onUpload}
      />
    </div>
  );
}

export default Stage;
