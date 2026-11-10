/**
 * 示例 14 · 卡片操作
 *
 * 预览在组件内部闭环（打开 LightBox），下载 / 重命名 / 删除一律抛给宿主。
 * 按钮常驻可见而不是 hover 才出现 —— hover-only 的按钮在触摸屏上等于不存在。
 */
import React, { useCallback } from "react";
import { SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";
import { baseProps, useLibrary } from "./_factory";
import type { DemoMeta, DemoStageProps } from "./types";

export const meta: DemoMeta = {
  slug: "card-actions",
  title: "卡片操作",
  group: "plugin",
  plugin: "CardActionsPlugin",
  intro:
    "缩略图右上角一排小按钮：预览 / 下载 / 删除。预览走组件内置浮层，其余动作交给 onAssetAction。",
  why: "每张卡都要能单独处理。动作名由宿主定义，组件不预设「删除」要不要二次确认 —— 那是你的弹窗。",
  plugs: [
    {
      fn: "createCardActionsPlugin",
      cfg: 'actions: [{ action: "download", label: "下载", icon: "↓" }, { action: "delete", label: "删除", icon: "×", tone: "danger" }]',
      why: "动作表完全可配；tone: danger 只影响配色，不影响行为。",
    },
  ],
  props: [],
  controls: [],
  stageHeight: 480,
  note: "点删除不会真的删 —— 这一页的 onAssetAction 只把动作写进日志。",
};

function Stage({ cfg, log }: DemoStageProps) {
  const Library = useLibrary("CardActionsPlugin", cfg);

  const onAssetAction = useCallback(
    (action: string, payload: { id?: string; ids?: string[] }) => {
      log(`动作 ${action} · ${payload.id ?? (payload.ids ?? []).join(",")}`);
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
