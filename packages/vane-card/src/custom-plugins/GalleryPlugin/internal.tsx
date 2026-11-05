import React from "react";

import type { PluginBus } from "../../components/CardPlugin/plugins/types";
import { openExternal } from "../../components/CardPlugin/plugins/utils/url";

export type Slide = { type: "image" | "video"; src: string; thumb?: string };

export interface GalleryHeaderProps {
  slides: Slide[];
  style: React.CSSProperties;
  enableZoom: boolean;
  autoplay: boolean;
  interval: number;
  showIndicators: boolean;
  showThumbnails: boolean;
  errorFallbackSrc?: string;
  context: {
    data?: { name?: string; poster?: string };
    bus?: PluginBus;
    forceUpdate?: () => void;
  };
}

export const GalleryHeaderComp: React.FC<GalleryHeaderProps> = ({
  slides,
  style,
  enableZoom,
  autoplay,
  interval,
  showIndicators,
  showThumbnails,
  errorFallbackSrc,
  context,
}) => {
  const [index, setIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  const effectiveAutoplay = autoplay && !slides.some((s) => s.type === "video") && slides.length > 1;
  React.useEffect(() => {
    if (!effectiveAutoplay) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, interval);
    return () => clearInterval(t);
  }, [effectiveAutoplay, interval, slides.length]);

  // 幻灯片数量减少时（如 2 张 → 1 张），index 可能越界；钳制回 0（P2-6）
  React.useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [index, slides.length]);

  const go = (dir: number) => {
    setPlaying(false);
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  const safeIndex = slides.length ? Math.min(index, slides.length - 1) : 0;
  const current = slides[safeIndex];

  // 让视频插件避让的处理标记：只能在提交后的 effect 里写总线（渲染期写会触发
  // 兄弟插件的状态更新警告，且 VideoPlugin 读的是上一帧的值）（P2-6）。
  const hasVideo = slides.some((s) => s.type === "video");
  const bus = context.bus;
  const forceUpdate = context.forceUpdate;
  React.useEffect(() => {
    if (!bus?.setData) return;
    const marked = Boolean(bus.getData?.("media.handledByGallery"));
    if (marked === hasVideo) return;
    if (hasVideo) {
      bus.setData("media.videoInGallery", true);
      bus.setData("media.handledByGallery", true);
    } else {
      bus.deleteData?.("media.videoInGallery");
      bus.deleteData?.("media.handledByGallery");
    }
    // 标记变化后让同级 VideoPlugin 重渲染，才能看到最新标记
    forceUpdate?.();
  }, [hasVideo, bus, forceUpdate]);

  if (!current) return null;

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (errorFallbackSrc && el.dataset.fallback !== "1") {
      el.dataset.fallback = "1";
      el.src = errorFallbackSrc;
      return;
    }
    // 没有兜底图：隐藏即可，不再硬编码 /404.jpg
    el.style.visibility = "hidden";
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        overflow: "hidden",
        borderRadius: "8px 8px 0 0",
        background: current.type === "image" ? "#f5f5f5" : "#000",
        ...style,
      }}
    >
      {current.type === "image" ? (
        <img
          src={current.src}
          alt={context.data?.name || "商品图片"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: enableZoom ? "zoom-in" : "default" }}
          onClick={() => {
            if (!enableZoom) return;
            openExternal(current.src);
          }}
          onError={handleImgError}
        />
      ) : (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {playing ? (
            <video controls autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }}>
              <source src={current.src} />
            </video>
          ) : (
            <>
              <img
                src={current.thumb || context.data?.poster || ""}
                alt={context.data?.name || "商品视频预览"}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={handleImgError}
              />
              <button
                onClick={() => setPlaying(true)}
                aria-label="播放视频"
                style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 999, padding: "12px 16px", cursor: "pointer" }}
              >
                ▶
              </button>
            </>
          )}
        </div>
      )}

      {slides.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", background: "rgba(0,0,0,0.58)", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", background: "rgba(0,0,0,0.58)", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
          >
            ›
          </button>
        </>
      )}

      {showIndicators && slides.length > 1 && (
        <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
          {slides.map((s, i) => (
            <span key={i} title={s.type === "video" ? "视频" : "图片"} style={{ width: 8, height: 8, borderRadius: "50%", background: i === safeIndex ? "#333" : "#bbb", display: "inline-block" }} />
          ))}
        </div>
      )}

      {showThumbnails && slides.length > 1 && (
        <div style={{ position: "absolute", left: 8, right: 8, bottom: 40, display: "flex", gap: 8, justifyContent: "center" }}>
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setPlaying(false);
                setIndex(i);
              }}
              title={s.type === "video" ? "视频" : "图片"}
              style={{ border: i === safeIndex ? "2px solid #fff" : "1px solid rgba(255,255,255,0.6)", padding: 0, borderRadius: 4, background: "transparent", cursor: "pointer" }}
            >
              <img
                src={s.thumb || s.src}
                alt={s.type === "video" ? "视频缩略图" : "图片缩略图"}
                style={{ width: 44, height: 28, objectFit: "cover", display: "block", borderRadius: 4 }}
                onError={handleImgError}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
