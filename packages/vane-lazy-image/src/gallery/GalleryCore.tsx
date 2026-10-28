/**
 * GalleryCore —— 商品图集多图容器（lazy-image 子特性核心）。
 *
 * 三段式（按 thumbPosition 决定缩略条方位）：
 *   [缩略图区 galleryThumbArea]  [主图区 galleryMainArea/overlay]  [工具条区 galleryToolbarArea]
 *
 * 主图区内部用 withPlugins(LazyLoadImageCore, mainPlugins) 渲染当前
 * images[activeIndex]，因此单图插件（HoverZoom/VideoPoster/Gallery 灯箱/价格/促销 …）
 * 自动挂到主图实例上、零改动复用。gallery 域插件挂 GalleryCore 的运行时，经
 * context.activeIndex 与单图插件解耦协调。
 *
 * activeIndex 用 useState 持有，变更即 GalleryCore 重渲染 → 主图 src 切换 +
 * 所有 gallery 域插件同步刷新（缩略联动/计数/指示点）。无需手动 forceUpdate。
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { withPlugins } from "../components/LazyLoadImagePlugin/withPlugins";
import { LazyLoadImageCore } from "../components/LazyLoadImagePlugin/LazyLoadImageCore";
import type {
  GalleryContext,
  GalleryCoreProps,
  GalleryCoreRef,
  GalleryPlugin,
} from "./types";
import { useGalleryRuntime } from "./useGalleryRuntime";
import { renderGallerySlot } from "./slots";
import { galleryPreset } from "./presets/gallery";

export const GalleryCore = forwardRef<GalleryCoreRef, GalleryCoreProps>(
  (props, ref) => {
    const {
      images,
      mainPlugins,
      plugins,
      thumbPosition = "bottom",
      className,
      style,
      width = "100%",
      mainHeight = 360,
    } = props;

    const galleryPlugins: GalleryPlugin[] = useMemo(
      () => plugins ?? galleryPreset(),
      [plugins]
    );

    const rt = useGalleryRuntime({ plugins: galleryPlugins, props });
    const { runtime, activeIndex, setActiveIndex } = rt;
    const ctx = runtime.context as GalleryContext;

    // 主图实例：单图插件挂这里（不传则仅 Core 主图）
    const MainImage = useMemo(
      () => withPlugins(LazyLoadImageCore, mainPlugins ?? []),
      [mainPlugins]
    );

    const maxIndex = Math.max(0, images.length - 1);
    const active = images[activeIndex];

    // images 变化导致 activeIndex 越界时夹紧
    useEffect(() => {
      if (activeIndex > maxIndex) setActiveIndex(maxIndex);
    }, [maxIndex, activeIndex, setActiveIndex]);

    // 主图切换 → 广播 onActiveChange（Carousel/ThumbPreload 监听）
    useEffect(() => {
      void runtime.execute("onActiveChange", activeIndex);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex]);

    useImperativeHandle(
      ref,
      () => ({ setActiveIndex, getActiveIndex: () => activeIndex }),
      [activeIndex, setActiveIndex]
    );

    // 键盘左右切换（容器聚焦时）
    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIndex(activeIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIndex(activeIndex + 1);
      }
    };

    const horizontal = thumbPosition === "top" || thumbPosition === "bottom";
    const thumbBefore = thumbPosition === "top" || thumbPosition === "left";

    const rootStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: "column",
      width,
      // 让可直接被 demo/调用方覆盖
      ...style,
    };

    // stage 包裹「缩略区 + 主图区」：横向（top/bottom）纵向堆叠、纵向（left/right）
    // 并排。toolbar 始终位于 root 第二行（下方），避免 left/right 时 root 变成 row 把
    // 工具栏挤到主图/缩略条旁边造成溢出错位。
    const stageStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: horizontal ? "column" : "row",
      width: "100%",
      minWidth: 0,
    };

    const thumbStyle: React.CSSProperties = horizontal
      ? {
          display: "flex",
          flexDirection: "row",
          gap: 8,
          overflowX: "auto",
          padding: "8px 0",
        }
      : {
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          padding: "0 8px",
          width: 84,
          flex: "0 0 auto",
        };

    const mainStyle: React.CSSProperties = {
      position: "relative",
      flex: 1,
      minWidth: 0,
      height: mainHeight,
      background: "#f5f5f5",
      overflow: "hidden",
    };

    const toolbarStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 0",
      flexWrap: "wrap",
      width: "100%",
    };

    const thumbs = renderGallerySlot(galleryPlugins, ctx, "galleryThumbArea");
    const overlay = renderGallerySlot(galleryPlugins, ctx, "galleryOverlay");
    const toolbar = renderGallerySlot(galleryPlugins, ctx, "galleryToolbarArea");
    const mainExtra = renderGallerySlot(galleryPlugins, ctx, "galleryMainArea");

    const rootRef = useRef<HTMLDivElement | null>(null);
    const zoom = ctx.zoom ?? 1;

    return (
      <div
        ref={rootRef}
        data-gallery-root=""
        className={className}
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={rootStyle}
      >
        <div style={stageStyle}>
          {thumbBefore && <div style={thumbStyle}>{thumbs}</div>}
          <div style={mainStyle}>
            {/* key=activeIndex：切换主图时重置加载态 + 重挂载插件 */}
            <div
              style={{
                width: "100%",
                height: "100%",
                transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                transformOrigin: "center center",
                transition: "transform 150ms ease",
              }}
            >
              <MainImage
                key={activeIndex}
                src={active?.src ?? ""}
                alt={active?.alt ?? ""}
                containerStyle={{ height: "100%", background: "transparent" }}
                // 主图区为固定高度容器：用 contain 完整显示整张图，避免按自然比例
                // 溢出后被裁切（cover 在「宽容器 + 竖图」下会切掉中部内容/标签）
                imageStyle={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
            {mainExtra}
            {overlay}
          </div>
          {!thumbBefore && <div style={thumbStyle}>{thumbs}</div>}
        </div>
        {toolbar ? <div style={toolbarStyle}>{toolbar}</div> : null}
      </div>
    );
  }
);

GalleryCore.displayName = "GalleryCore";

export default GalleryCore;
