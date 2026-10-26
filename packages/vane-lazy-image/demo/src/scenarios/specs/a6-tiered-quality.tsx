// 版式参照：影视详情页「剧照」—— 同一张图按设备与网络选不同清晰度
// 装配：自适应质量 → 响应式 srcset → 省流量
import {
  LazyLoadImageCore,
  createAdaptiveQualityPlugin,
  createDataSaverPlugin,
  createResponsivePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 2G/3G 给 40 质量、4G 给 80；开了省流量再降到 35
  createAdaptiveQualityPlugin({ lowQ: 40, highQ: 80, saveDataQuality: 35 }),
  // 图床按 /宽/高 出图，buildSrc 把变体宽度拼进路径（换成自家图床模板即可）
  createResponsivePlugin({
    variants: [{ width: 400 }, { width: 800 }, { width: 1200 }],
    sizes: "(max-width: 720px) 100vw, 640px",
    buildSrc: (src: string, width: number) =>
      src.replace(/\/\d+\/\d+$/, `/${width}/${Math.round((width * 9) / 16)}`),
  }),
  createDataSaverPlugin({ respectSaveData: true, fallbackQuality: 0.6 }),
]);

const STILLS = [
  { id: 1, label: "剧照 01 · 码头夜戏" },
  { id: 2, label: "剧照 02 · 审讯室" },
  { id: 3, label: "剧照 03 · 天台对峙" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-still-${it.id}/1200/675` }));

export default function TieredQuality() {
  return (
    <div style={STAGE}>
      {STILLS.map((it) => (
        <figure key={it.id} style={FIG}>
          <Lazy
            src={it.src}
            alt={it.label}
            loading="lazy"
            containerStyle={{ width: "100%",
 aspectRatio: "1200 / 675", borderRadius: 4, overflow: "hidden" }}
            imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <figcaption style={CAP}>{it.label}</figcaption>
        </figure>
      ))}
      <p style={HINT}>
        打开 DevTools 网络面板把速率调到 Slow 3G，再看 img 的 <code>currentSrc</code>：
        会落到 400 宽档；切回 WiFi 重新进页面则命中 800/1200 档。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#111014", padding: 16, borderRadius: 6 };
const FIG: CSSProperties = { margin: "0 0 12px" };
const CAP: CSSProperties = { color: "#8d857a", fontSize: 11, marginTop: 5 };
const HINT: CSSProperties = { color: "#807a70", fontSize: 11.5, lineHeight: 1.7, margin: 0 };
