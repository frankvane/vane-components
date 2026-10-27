import type { CardPlugin, PluginCreator } from "../../plugins/types";
import React from "react";

type Slide = { type: "image" | "video"; src: string; thumb?: string };

interface GalleryHeaderProps {
  slides: Slide[];
  style: React.CSSProperties;
  enableZoom: boolean;
  autoplay: boolean;
  interval: number;
  showIndicators: boolean;
  showThumbnails: boolean;
  context: any;
}

const GalleryHeaderComp: React.FC<GalleryHeaderProps> = ({
  slides,
  style,
  enableZoom,
  autoplay,
  interval,
  showIndicators,
  showThumbnails,
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

  const go = (dir: number) => {
    setPlaying(false);
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  const current = slides[index];

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
          alt={(context.data as any)?.name || "商品图片"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: enableZoom ? "zoom-in" : "default" }}
          onClick={() => {
            if (!enableZoom) return;
            window.open(current.src, "_blank");
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/404.jpg";
          }}
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
                src={current.thumb || "/404.jpg"}
                alt={(context.data as any)?.name || "商品视频预览"}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/404.jpg";
                }}
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
            style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
          >
            ›
          </button>
        </>
      )}

      {showIndicators && slides.length > 1 && (
        <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
          {slides.map((s, i) => (
            <span key={i} title={s.type === "video" ? "视频" : "图片"} style={{ width: 8, height: 8, borderRadius: "50%", background: i === index ? "#333" : "#bbb", display: "inline-block" }} />
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
              style={{ border: i === index ? "2px solid #fff" : "1px solid rgba(255,255,255,0.6)", padding: 0, borderRadius: 4, background: "transparent", cursor: "pointer" }}
            >
              <img
                src={s.thumb || s.src}
                alt={s.type === "video" ? "视频缩略图" : "图片缩略图"}
                style={{ width: 44, height: 28, objectFit: "cover", display: "block", borderRadius: 4 }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/404.jpg";
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export interface GalleryPluginConfig {
  images?: string[];
  autoplay?: boolean;
  interval?: number;
  showIndicators?: boolean;
  enableZoom?: boolean;
  showThumbnails?: boolean;
  style?: React.CSSProperties;
  videoSrc?: string;
  videoPoster?: string;
  // 渲染位置控制（供 withPlugins 读取）
  headerPosition?: "before" | "after";
  order?: number;
  // 将视频插入到第 N 个位置（1 开始）。默认在末尾
  videoIndex?: number;
}

export const createGalleryPlugin: PluginCreator<any, GalleryPluginConfig> = (
  config = {}
) => {
  const {
    autoplay = false,
    interval = 3000,
    showIndicators = true,
    enableZoom = false,
    showThumbnails = true,
    style = {},
    videoSrc,
    videoPoster,
  } = config;

  const plugin: CardPlugin = {
    name: "GalleryPlugin",
    version: "1.0.0",
    description: "图片画廊插件（头部区域轮播）",
    priority: 40,
    hooks: {
      renderHeader: (context) => {
        const imgs: string[] =
          config.images || (context.data as any)?.images ||
          (((context.data as any)?.image && [(context.data as any)?.image]) || []);
        const vSrc = videoSrc || (context.data as any)?.video;

        const slides: Slide[] = [
          ...imgs.map((src) => ({ type: "image" as const, src, thumb: src })),
        ];
        if (vSrc) {
          const poster = videoPoster || (context.data as any)?.poster || imgs[0];
          const videoSlide: Slide = { type: "video", src: vSrc, thumb: poster || "" };
          const totalImages = slides.length;
          const desired = (config.videoIndex ?? totalImages + 1) - 1;
          const insertIndex = Math.max(0, Math.min(totalImages, desired));
          slides.splice(insertIndex, 0, videoSlide);
          context.bus?.setData?.("media.videoInGallery", true);
          context.bus?.setData?.("media.handledByGallery", true);
        }
        if (!slides.length) return null;

        return (
          <GalleryHeaderComp
            slides={slides}
            style={style}
            enableZoom={enableZoom}
            autoplay={autoplay}
            interval={interval}
            showIndicators={showIndicators}
            showThumbnails={showThumbnails}
            context={context}
          />
        );
      },
    },
    config,
  };

  return plugin;
};