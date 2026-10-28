/**
 * HotspotPlugin —— 主图热点标注（gallery 增强插件）。
 *
 * 在 galleryOverlay 渲染一组按百分比定位的可交互热点（商品卖点/区域标记）。
 * 点击热点弹出标签气泡（含可选链接）。热点为图集级（所有主图共用同一组坐标），
 * 用于商品图集的「圈点讲解」场景。
 */
import React from "react";
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface Hotspot {
  /** 水平位置（0-100，相对主图宽度百分比） */
  x: number;
  /** 垂直位置（0-100，相对主图高度百分比） */
  y: number;
  /** 标签文案 */
  label: string;
  /** 可选链接（点击打开） */
  href?: string;
  /** 标记点颜色 */
  color?: string;
}

export interface HotspotConfig {
  /** 热点集合（图集级，所有主图共用） */
  hotspots?: Hotspot[];
}

export function createHotspotPlugin(config: HotspotConfig = {}): GalleryPlugin {
  const { hotspots = [] } = config;

  const Hotspots: React.FC<{ context: GalleryContext }> = () => {
    const [open, setOpen] = React.useState<number | null>(null);
    if (hotspots.length === 0) return null;
    return (
      <>
        {hotspots.map((h, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${h.x}%`,
              top: `${h.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 6,
            }}
          >
            <button
              type="button"
              aria-label={h.label}
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: 18,
                height: 18,
                padding: 0,
                margin: 0,
                border: "2px solid #fff",
                borderRadius: "50%",
                background: h.color ?? "#ff5a5f",
                cursor: "pointer",
                boxShadow: "0 0 0 2px rgba(0,0,0,0.25)",
              }}
            />
            {open === i && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 24,
                  transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.8)",
                  color: "#fff",
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                  pointerEvents: h.href ? "auto" : "none",
                }}
              >
                {h.href ? (
                  <a
                    href={h.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#fff" }}
                  >
                    {h.label}
                  </a>
                ) : (
                  h.label
                )}
              </div>
            )}
          </div>
        ))}
      </>
    );
  };

  return {
    name: "gallery-hotspot",
    version: "1.0.0",
    config,
    hooks: {
      galleryOverlay: (context: GalleryContext) => <Hotspots context={context} />,
    },
  };
}

export default createHotspotPlugin;
