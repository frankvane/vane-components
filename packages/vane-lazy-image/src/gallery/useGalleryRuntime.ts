/**
 * useGalleryRuntime —— 图集运行时（包内封装 vane-plugin-core 的 usePluginRuntime）。
 *
 * 与 lazy-image 的 withPlugins 同构：领域状态用 useState 持有（而非闭包），
 * extendContext 把协调态注入每个插件拿到的 context；状态变更 → GalleryCore 重渲染 →
 * 全部 gallery 域插件拿到新的 context.activeIndex 等 → 缩略条/计数/指示点同步刷新。
 */

import { useCallback, useState } from "react";
import { usePluginRuntime } from "vane-plugin-core";
import type {
  GalleryContext,
  GalleryCoreProps,
  GalleryPlugin,
} from "./types";

export interface GalleryRuntime {
  /** 插件管理器（已排序、生命周期内稳定） */
  runtime: ReturnType<typeof usePluginRuntime<any, any>>;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  frameIndex: number;
  setFrameIndex: (i: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  favorited: boolean;
  setFavorited: (v: boolean) => void;
}

export function useGalleryRuntime({
  plugins,
  props,
}: {
  plugins: GalleryPlugin[];
  props: GalleryCoreProps;
}): GalleryRuntime {
  const maxIndex = Math.max(0, props.images.length - 1);
  const [activeIndex, setActiveIndexState] = useState(() =>
    Math.min(Math.max(0, props.initialIndex ?? 0), maxIndex)
  );
  const [frameIndex, setFrameIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [favorited, setFavorited] = useState(false);

  const clampIndex = useCallback(
    (i: number) => Math.min(Math.max(0, Math.trunc(i)), maxIndex),
    [maxIndex]
  );
  const setActiveIndex = useCallback(
    (i: number) => setActiveIndexState(clampIndex(i)),
    [clampIndex]
  );

  // 领域上下文：经 extendContext 注入内核 context（含 forceUpdate / bus / setState 等）
  const extendContext = useCallback(
    (base: any): GalleryContext => ({
      ...base,
      images: props.images,
      activeIndex,
      setActiveIndex,
      frameIndex,
      setFrameIndex,
      zoom,
      setZoom,
      favorited,
      setFavorited,
    }),
    [props.images, activeIndex, setActiveIndex, frameIndex, zoom, favorited]
  );

  const runtime = usePluginRuntime<any, any>({
    plugins,
    props,
    extendContext,
  });

  return {
    runtime,
    activeIndex,
    setActiveIndex,
    frameIndex,
    setFrameIndex,
    zoom,
    setZoom,
    favorited,
    setFavorited,
  };
}
