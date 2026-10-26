// 版式参照：B 站 UP 主头像 / 直播间主咖位 —— 圆形头像 + 光晕，缺图有人形兜底
// 装配：裁剪 → 边框辉光 → 兜底图
import {
  LazyLoadImageCore,
  createBorderGlowPlugin,
  createCropPlugin,
  createFallbackImagePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  createCropPlugin({ enabled: true, focusPoint: { x: 0.5, y: 0.35 }, showLabel: false }),
  // 头像当作"正在直播"的信号灯：hover 时辉光增强
  createBorderGlowPlugin({
    color: "rgba(251, 114, 153, .75)",
    blurPx: 14,
    spreadPx: 1,
    hoverMultiplier: 1.5,
  }),
  createFallbackImagePlugin({
    fallbackSrc: "https://picsum.photos/seed/vane-up-fallback/160/160",
  }),
]);

const UPS = [
  { id: 1, name: "范同学", fans: "48.2 万粉丝" },
  { id: 2, name: "前端自习室", fans: "31.7 万粉丝" },
  { id: 3, name: "性能小课", fans: "22.4 万粉丝" },
  { id: 4, name: "布局研究所", fans: "16.3 万粉丝" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-up-${it.id}/160/160` }));

export default function UploaderAvatar() {
  return (
    <div style={STAGE}>
      {UPS.map((u) => (
        <div key={u.id} style={PERSON}>
          {/* border-glow 会把阴影打到「容器再外一层」，这层必须是圆的，否则头像外面套一个圆角矩形光框 */}
          <div style={GLOW}>
            <div style={AVATAR}>
              <Lazy
                src={u.src}
                alt={`${u.name} 头像`}
                loading="lazy"
                containerStyle={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}
                imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          </div>
          <p style={NAME}>{u.name}</p>
          <p style={FANS}>{u.fans}</p>
        </div>
      ))}
    </div>
  );
}

const STAGE: CSSProperties = {
  background: "#ffffff",
  padding: 18,
  borderRadius: 6,
  display: "flex",
  gap: 22,
  flexWrap: "wrap",
};
const PERSON: CSSProperties = { textAlign: "center", width: 76 };
const GLOW: CSSProperties = { width: 64, height: 64, margin: "0 auto 8px", borderRadius: "50%" };
const AVATAR: CSSProperties = { width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" };
const NAME: CSSProperties = { margin: 0, color: "#18191c", fontSize: 12 };
const FANS: CSSProperties = { margin: "2px 0 0", color: "#9499a0", fontSize: 10.5 };
