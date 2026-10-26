// 版式参照：摄影社区「原图 / 滤镜」前后对比 —— 拖动分割线看差异
// 装配：对比（可拖拽分隔条）→ 滤镜（两套预设）
import {
  LazyLoadImageCore,
  createComparisonPlugin,
  createFilterPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const BEFORE = "https://picsum.photos/seed/vane-compare-a/800/520";
const AFTER = "https://picsum.photos/seed/vane-compare-b/800/520";

// 分割条可拖拽；不传 afterSrc 时默认用主图，真正做对比要显式给两套底片
const Compare = withPlugins(LazyLoadImageCore as any, [
  createComparisonPlugin({
    beforeSrc: BEFORE,
    afterSrc: AFTER,
    labelBefore: "原图",
    labelAfter: "调色后",
    start: 0.5,
  }),
]);

// 预设各自装配一次，模块级常量保证组件身份稳定
const Mono = withPlugins(LazyLoadImageCore as any, [
  createFilterPlugin({ filter: "grayscale", amount: 0.55 }),
]);
const Sepia = withPlugins(LazyLoadImageCore as any, [
  createFilterPlugin({ filter: "sepia", amount: 0.45 }),
]);
const Vivid = withPlugins(LazyLoadImageCore as any, [
  createFilterPlugin({ filter: "saturate", amount: 0.4 }),
]);

const PRESETS = [
  { name: "grayscale", Lazy: Mono },
  { name: "sepia", Lazy: Sepia },
  { name: "saturate", Lazy: Vivid },
];

export default function BeforeAfter() {
  return (
    <div style={STAGE}>
      <div style={WRAP}>
        <Compare
          src={BEFORE}
          alt="原图与调色对比"
          loading="lazy"
          containerStyle={{ width: "100%", borderRadius: 6, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={ROW}>
        {PRESETS.map(({ name, Lazy }) => (
          <figure key={name} style={CELL}>
            <Lazy
              src={AFTER}
              alt={`滤镜预设 ${name}`}
              loading="lazy"
              containerStyle={{ width: "100%",
 aspectRatio: "800 / 520", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>{name}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0a0a0a", padding: 14, borderRadius: 6 };
const WRAP: CSSProperties = { position: "relative", maxWidth: 440, margin: "0 auto 14px" };
const ROW: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 4, color: "#8a8a8a", fontSize: 9.5, textAlign: "center" };
