/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetItem,
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import { stop } from "../_shared/ui";
import doc from "./doc.json";

/**
 * CardActionsPlugin — 卡片操作（预览 / 下载 / 删除…）。
 *
 * `preview` 是唯一在组件内部闭环的动作（打开 LightBox 浮层）；
 * 其余动作一律通过 `ctx.requestAction(name, { id })` 抛给宿主 —— 组件不知道
 * 你的下载接口、删除确认弹窗长什么样，装作知道只会逼宿主绕开组件。
 *
 * 按钮常驻可见而不是 hover 才出现：hover-only 的按钮在触摸设备上等于不存在，
 * 也会被对比度体检判成不可读。
 */
export interface CardAction {
  /** 传给 onAssetAction 的动作名 */
  action: string;
  label: string;
  /** 纯文本图标（不引图标库，省体积） */
  icon?: string;
  tone?: "default" | "danger";
}

export interface CardActionsConfig {
  actions?: CardAction[];
}

const DEFAULT_ACTIONS: CardAction[] = [
  { action: "preview", label: "预览", icon: "⌕" },
  { action: "download", label: "下载", icon: "↓" },
  { action: "delete", label: "删除", icon: "×", tone: "danger" },
];

function CardActionsView({
  ctx,
  item,
  actions,
}: {
  ctx: AssetLibraryContext;
  item: AssetItem;
  actions: CardAction[];
}) {
  return (
    <div className="vc-asset-actions" role="group" aria-label={`${item.title ?? item.id} 操作`}>
      {actions.map((entry) => (
        <button
          key={entry.action}
          type="button"
          className="vc-asset-icon"
          data-tone={entry.tone}
          aria-label={`${entry.label} ${item.title ?? item.id}`}
          title={entry.label}
          onClick={(event) => {
            stop(event);
            if (entry.action === "preview") {
              ctx.openPreview(item.id);
              return;
            }
            ctx.requestAction(entry.action, { id: item.id });
          }}
        >
          {entry.icon ?? entry.label}
        </button>
      ))}
    </div>
  );
}

export const createCardActionsPlugin: AssetPluginCreator<CardActionsConfig> = (
  config = {}
) => {
  const actions = config.actions?.length ? config.actions : DEFAULT_ACTIONS;

  return {
    name: "card-actions",
    version: "0.1.0",
    description: doc.description,
    priority: 25,
    config,
    hooks: {
      renderCardActions: (context, item) => (
        <CardActionsView ctx={context} item={item} actions={actions} />
      ),
    },
  } satisfies AssetPlugin;
};

createCardActionsPlugin.meta = doc as PluginDoc;
