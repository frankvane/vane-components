/* eslint-disable react-refresh/only-export-components -- 插件工厂文件必然同时导出工厂与内部视图组件；库产物不走应用层 HMR，该规则在此为误报 */
import React, { useEffect } from "react";
import type { PluginDoc } from "vane-plugin-core";
import type {
  AssetItem,
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginCreator,
} from "../../components/AssetLibraryPlugin/plugins/types";
import doc from "./doc.json";

/**
 * LightBoxPlugin — 大图 / 视频预览浮层。
 *
 * 打开态存在内核 state.previewId（不是组件本地 state）：
 * 卡片上的「预览」按钮和浮层不在同一棵子树里，本地 state 传不过去；
 * 存内核 state 后任何插件都能 openPreview / closePreview。
 *
 * 左右切换在 ctx.filtered（当前筛选结果）里走，而不是只有当前页 ——
 * 用户的心理模型是「翻我这批筛选出来的素材」，不是「翻这 24 个」。
 */
export interface LightBoxConfig {
  /** 支持左右方向键切换，默认 true */
  arrows?: boolean;
  /** 关闭时是否恢复焦点，默认 true */
  restoreFocus?: boolean;
}

function formatIndex(ctx: AssetLibraryContext, id: string): string {
  const index = ctx.filtered.findIndex((item) => item.id === id);
  if (index < 0) return "";
  return `${index + 1} / ${ctx.filtered.length}`;
}

function LightBoxView({
  ctx,
  item,
  arrows,
}: {
  ctx: AssetLibraryContext;
  item: AssetItem;
  arrows: boolean;
}) {
  const index = ctx.filtered.findIndex((entry) => entry.id === item.id);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        ctx.closePreview();
        return;
      }
      if (!arrows) return;
      if (event.key === "ArrowRight" && index >= 0 && index < ctx.filtered.length - 1) {
        event.preventDefault();
        ctx.openPreview(ctx.filtered[index + 1].id);
      }
      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        ctx.openPreview(ctx.filtered[index - 1].id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [arrows, ctx, index]);

  return (
    <div
      className="vc-asset-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`预览 ${item.title ?? item.id}`}
      onClick={() => ctx.closePreview()}
    >
      <button
        type="button"
        className="vc-asset-lightbox__close"
        onClick={(event) => {
          event.stopPropagation();
          ctx.closePreview();
        }}
      >
        关闭 ESC
      </button>
      <div className="vc-asset-lightbox__body" onClick={(event) => event.stopPropagation()}>
        {item.kind === "video" ? (
          <video src={item.src} controls autoPlay playsInline />
        ) : (
          <img src={item.src} alt={item.title ?? item.id} />
        )}
      </div>
      <div className="vc-asset-lightbox__bar">
        <span>{item.title ?? item.id}</span>
        {formatIndex(ctx, item.id) ? <span>· {formatIndex(ctx, item.id)}</span> : null}
        {arrows ? <span>· ← → 切换</span> : null}
      </div>
    </div>
  );
}

export const createLightBoxPlugin: AssetPluginCreator<LightBoxConfig> = (config = {}) => {
  const arrows = config.arrows !== false;

  return {
    name: "lightbox",
    version: "0.1.0",
    description: doc.description,
    priority: 45,
    config,
    hooks: {
      renderOverlay: (context) => {
        if (!context.previewId) return null;
        const item = context.items.find((entry) => entry.id === context.previewId);
        if (!item) return null;
        return <LightBoxView ctx={context} item={item} arrows={arrows} />;
      },
    },
  } satisfies AssetPlugin;
};

createLightBoxPlugin.meta = doc as PluginDoc;
