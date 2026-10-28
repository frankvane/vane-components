/**
 * renderGallerySlot —— 图集领域槽分发器（仿 vane-profile 的 renderProfileSlot / D3-A）。
 *
 * 与内核 composeSlots 不同：gallery 用「命名领域钩子」而非内核三槽。按 slotName
 * 过滤实现了该钩子的插件，逐个包 PluginErrorBoundary（单插件抛错只丢自己那段），
 * 按 priority 升序排列（越小越靠前）。GalleryCore 在缩略区/主图区/工具条区/浮层
 * 四处调用本函数，把 gallery 域插件的渲染拼进对应段落。
 */

import React from "react";
import { PluginErrorBoundary } from "vane-plugin-core";
import type { GalleryContext, GalleryPlugin } from "./types";

export type GallerySlotName =
  | "galleryThumbArea"
  | "galleryToolbarArea"
  | "galleryOverlay"
  | "galleryMainArea";

function isSlotHook(p: GalleryPlugin, slotName: GallerySlotName): boolean {
  const fn = (p.hooks as Record<string, unknown>)[slotName];
  return typeof fn === "function";
}

export function renderGallerySlot(
  plugins: GalleryPlugin[],
  context: GalleryContext,
  slotName: GallerySlotName
): React.ReactNode {
  const matched = plugins
    .filter((p) => p.enabled !== false && isSlotHook(p, slotName))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

  if (matched.length === 0) return null;

  return (
    <PluginErrorBoundary>
      {matched.map((p, i) => {
        const node = (p.hooks[slotName] as (ctx: GalleryContext) => React.ReactNode)(
          context
        );
        return (
          <PluginErrorBoundary key={`${p.name}-${i}`}>
            {node}
          </PluginErrorBoundary>
        );
      })}
    </PluginErrorBoundary>
  );
}
