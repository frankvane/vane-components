// 版式参照：手机直传的摄影作品 —— 竖图带 EXIF Orientation，不纠正就是躺着的
// 装配：EXIF 方向纠正 → 裁剪
import {
  LazyLoadImageCore,
  createCropPlugin,
  createExifOrientationPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 读 EXIF 的 Orientation 标记并转正（iOS/安卓直传图的高频坑）
  createExifOrientationPlugin({ enabled: true }),
  // 转正后按人脸/主体中心裁成 4:5，缩略图不歪
  createCropPlugin({ enabled: true, focusPoint: { x: 0.5, y: 0.42 } }),
]);

const SHOTS = [
  { id: 1, note: "竖拍 · orientation 正常" },
  { id: 2, note: "竖拍 · 需要旋转 90°" },
  { id: 3, note: "横拍 · orientation 正常" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-exif-${it.id}/360/480` }));

export default function ExifUpright() {
  return (
    <div style={STAGE}>
      <div style={GRID}>
        {SHOTS.map((s) => (
          <figure key={s.id} style={CELL}>
            <Lazy
              src={s.src}
              alt={s.note}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>{s.note}</figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        占位图不带 EXIF，装配链路照旧：插件读不到标记时视为 1，不做旋转。
        换成自己拍的直传图（带 Orientation=6）就能看到转正效果。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0a0a0a", padding: 12, borderRadius: 6 };
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 4, color: "#8a8a8a", fontSize: 9.5, lineHeight: 1.5 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#7a7a7a", fontSize: 10.5, lineHeight: 1.7 };
