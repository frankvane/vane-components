import React from "react";
import {
  GalleryCore,
  galleryPreset,
} from "vane-lazy-image/gallery";
import { createThumbSyncPlugin } from "vane-lazy-image/custom-plugins/ThumbSyncPlugin";
import { createSpin360Plugin } from "vane-lazy-image/custom-plugins/Spin360Plugin";
import { createCounterPlugin } from "vane-lazy-image/custom-plugins/CounterPlugin";
import { createIndicatorPlugin } from "vane-lazy-image/custom-plugins/IndicatorPlugin";
import { createCarouselPlugin } from "vane-lazy-image/custom-plugins/CarouselPlugin";
import { createZoomControlPlugin } from "vane-lazy-image/custom-plugins/ZoomControlPlugin";
import { createFullscreenPlugin } from "vane-lazy-image/custom-plugins/FullscreenPlugin";
import { createThumbPreloadPlugin } from "vane-lazy-image/custom-plugins/ThumbPreloadPlugin";
import { createHotspotPlugin } from "vane-lazy-image/custom-plugins/HotspotPlugin";
import { createFavoritePlugin } from "vane-lazy-image/custom-plugins/FavoritePlugin";
import { createPriceTagPlugin } from "vane-lazy-image/custom-plugins/PriceTagPlugin";
import { createHoverZoomPlugin } from "vane-lazy-image/custom-plugins/HoverZoomPlugin";
import { createVideoPosterPlugin } from "vane-lazy-image/custom-plugins/VideoPosterPlugin";
import { createComparisonPlugin } from "vane-lazy-image/custom-plugins/ComparisonPlugin";
import { createDownloadButtonPlugin } from "vane-lazy-image/custom-plugins/DownloadButtonPlugin";
import type { GalleryImage, GalleryPlugin } from "vane-lazy-image/gallery";

/**
 * 自包含占位图：内联 SVG data-URI，离线即可渲染，不依赖任何远程图床
 * （picsum.photos 在受限网络下常加载失败，导致主图区空白）。
 * 如需演示真实远程懒加载，把这里换成你自己的图床 URL 即可。
 */
function placeholderImage(label: string, hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},62%,64%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 38) % 360},58%,46%)"/>
    </linearGradient>
  </defs>
  <rect width="900" height="600" fill="url(#g)"/>
  <rect x="285" y="150" width="330" height="300" rx="26" fill="rgba(255,255,255,0.88)"/>
  <circle cx="450" cy="248" r="52" fill="rgba(17,24,39,0.12)"/>
  <path d="M450 210 L450 286 M410 248 L490 248" stroke="rgba(17,24,39,0.30)" stroke-width="8" stroke-linecap="round"/>
  <text x="450" y="330" font-family="system-ui,-apple-system,sans-serif" font-size="46" font-weight="700" fill="#111827" text-anchor="middle">${label}</text>
  <text x="450" y="560" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="rgba(255,255,255,0.9)" text-anchor="middle">vane-gallery · demo 占位图</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const images: GalleryImage[] = [
  { src: placeholderImage("正面", 8), alt: "正面" },
  { src: placeholderImage("侧面", 200), alt: "侧面" },
  { src: placeholderImage("背面", 150), alt: "背面" },
  { src: placeholderImage("细节", 280), alt: "细节" },
  { src: placeholderImage("场景", 330), alt: "场景" },
  { src: placeholderImage("包装", 50), alt: "包装" },
];

interface ToggleDef {
  key: string;
  label: string;
  create: () => GalleryPlugin;
  optional: boolean;
  /** 清单卡片描述来源；包装型工厂（如 () => createX({...})）无法从 .create 取到
   *  .meta，需在此显式挂上真实 creator 的 meta，否则卡片描述空白。 */
  meta?: { description?: string };
}

// 10 个 gallery 域插件：4 个默认预设 + 6 个可选
const DOMAIN_PLUGINS: ToggleDef[] = [
  { key: "thumb", label: "缩略联动", create: createThumbSyncPlugin, optional: false },
  { key: "spin", label: "360 环物", create: createSpin360Plugin, optional: true },
  { key: "counter", label: "计数", create: createCounterPlugin, optional: false },
  { key: "indicator", label: "指示点", create: createIndicatorPlugin, optional: false },
  { key: "carousel", label: "轮播", create: createCarouselPlugin, optional: true },
  { key: "zoom", label: "缩放控制", create: createZoomControlPlugin, optional: true },
  { key: "fullscreen", label: "全屏", create: createFullscreenPlugin, optional: true },
  { key: "preload", label: "相邻预加载", create: createThumbPreloadPlugin, optional: true },
  { key: "hotspot", label: "热点", create: () => createHotspotPlugin({ hotspots: [{ x: 42, y: 38, label: "防水面料" }, { x: 66, y: 72, label: "透气网眼" }] }), meta: (createHotspotPlugin as any).meta, optional: true },
  { key: "favorite", label: "收藏", create: createFavoritePlugin, optional: true },
];

const MAIN_PLUGINS: ToggleDef[] = [
  // 价格标签需配置价格数据，否则 renderOverlay 因 finalPrice 为 undefined 而返回 null。
  // 此处给一组示例价格（人民币 / 原价 / 折扣），选中即主图右上角显示价格标签。
  // 真实业务可改用 fetchPrice 按图片异步拉取，或后续让 GalleryImage 携带 price 字段。
  {
    key: "price",
    label: "价格标签",
    create: () =>
      createPriceTagPlugin({
        price: 199,
        originalPrice: 299,
        discount: "限时8折",
        currency: "¥",
      }),
    meta: (createPriceTagPlugin as any).meta,
    optional: true,
  },
  { key: "hoverzoom", label: "悬停放大", create: createHoverZoomPlugin, optional: true },
  { key: "video", label: "视频位", create: createVideoPosterPlugin, optional: true },
  { key: "compare", label: "对比", create: createComparisonPlugin, optional: true },
  { key: "download", label: "下载按钮", create: createDownloadButtonPlugin, optional: true },
];

type ThumbPos = "bottom" | "top" | "left" | "right";

function useToggleMap(keys: string[], initial: Record<string, boolean>) {
  const [state, setState] = React.useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {};
    for (const k of keys) s[k] = !!initial[k];
    return s;
  });
  const toggle = (k: string) =>
    setState((prev) => ({ ...prev, [k]: !prev[k] }));
  return [state, toggle] as const;
}

interface AuditResult {
  passed: boolean;
  checks: { name: string; ok: boolean; detail: string }[];
}

function runGeometryAudit(root: HTMLElement): AuditResult {
  const checks: AuditResult["checks"] = [];
  const r = root.getBoundingClientRect();
  checks.push({
    name: "根容器非零尺寸",
    ok: r.width > 0 && r.height > 0,
    detail: `${Math.round(r.width)}×${Math.round(r.height)}`,
  });
  const mainArea = root.querySelector('[style*="overflow"]') as HTMLElement | null;
  checks.push({
    name: "主图区存在",
    ok: !!mainArea,
    detail: mainArea ? "found" : "missing",
  });
  // 零尺寸元素（排除 display:none / visibility:hidden）
  const all = Array.from(root.querySelectorAll<HTMLElement>("*"));
  let zeroCount = 0;
  let overflowX = 0;
  let overlapPairs = 0;
  const rects: { el: HTMLElement; rect: DOMRect }[] = [];
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) zeroCount++;
    rects.push({ el, rect });
    if (rect.left < r.left - 1 || rect.right > r.right + 1) overflowX++;
  }
  // 两两重叠（仅同层 button 之类，限制样本避免 O(n^2) 爆炸）
  const sample = rects.filter((x) => x.el.tagName === "BUTTON").slice(0, 40);
  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) {
      const a = sample[i].rect;
      const b = sample[j].rect;
      const overlap =
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      if (overlap) overlapPairs++;
    }
  }
  checks.push({
    name: "无零尺寸元素",
    ok: zeroCount === 0,
    detail: `${zeroCount} 处`,
  });
  checks.push({
    name: "无水平溢出",
    ok: overflowX === 0,
    detail: `${overflowX} 处`,
  });
  checks.push({
    name: "按钮无意外重叠",
    ok: overlapPairs === 0,
    detail: `${overlapPairs} 对`,
  });
  return { passed: checks.every((c) => c.ok), checks };
}

const GalleryPage: React.FC = () => {
  const [domain, toggleDomain] = useToggleMap(
    DOMAIN_PLUGINS.map((d) => d.key),
    { thumb: true, counter: true, indicator: true }
  );
  const [main, toggleMain] = useToggleMap(
    MAIN_PLUGINS.map((d) => d.key),
    { price: true }
  );
  // 默认方位 bottom（横向缩略条）。left/right 纵向布局已由 GalleryCore 重构支持。
  const [thumbPos, setThumbPos] = React.useState<ThumbPos>("bottom");
  const [audit, setAudit] = React.useState<AuditResult | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const galleryPlugins: GalleryPlugin[] = React.useMemo(() => {
    const list = galleryPreset();
    for (const d of DOMAIN_PLUGINS) {
      if (d.optional && domain[d.key]) list.push(d.create());
    }
    return list;
  }, [domain]);

  const mainPlugins = React.useMemo(() => {
    const list: any[] = [];
    for (const d of MAIN_PLUGINS) {
      if (main[d.key]) list.push(d.create());
    }
    return list;
  }, [main]);

  React.useEffect(() => {
    if (!rootRef.current) return;
    const id = window.setTimeout(() => {
      if (rootRef.current) setAudit(runGeometryAudit(rootRef.current));
    }, 250);
    return () => window.clearTimeout(id);
  }, [galleryPlugins, mainPlugins, thumbPos]);

  return (
    <div className="gallery-page">
      <header className="page-head">
        <h1>商品图集引擎（gallery）</h1>
        <p className="page-sub">
          多图容器 <code>GalleryCore</code>，主图复用 <code>LazyLoadImageCore</code>；
          10 个图集域插件 + 可挂主图的单图插件。下方实时组合、实时几何体检。
        </p>
      </header>

      <section className="gallery-controls">
        <div className="ctl-group">
          <span className="ctl-title">图集域插件</span>
          <div className="ctl-row">
            {DOMAIN_PLUGINS.map((d) => (
              <label key={d.key} className={`ctl-chip${d.optional ? "" : " is-fixed"}`}>
                <input
                  type="checkbox"
                  checked={domain[d.key]}
                  disabled={!d.optional}
                  onChange={() => toggleDomain(d.key)}
                />
                {d.label}
                {!d.optional && <em title="默认预设，必含">·预设</em>}
              </label>
            ))}
          </div>
        </div>
        <div className="ctl-group">
          <span className="ctl-title">主图单图插件</span>
          <div className="ctl-row">
            {MAIN_PLUGINS.map((d) => (
              <label key={d.key} className="ctl-chip">
                <input
                  type="checkbox"
                  checked={main[d.key]}
                  onChange={() => toggleMain(d.key)}
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>
        <div className="ctl-group">
          <span className="ctl-title">缩略条方位</span>
          <div className="ctl-row">
            {(["bottom", "top", "left", "right"] as ThumbPos[]).map((p) => (
              <button
                key={p}
                type="button"
                className={`ctl-btn${thumbPos === p ? " is-active" : ""}`}
                onClick={() => setThumbPos(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="gallery-stage" ref={rootRef}>
        <GalleryCore
          images={images}
          plugins={galleryPlugins}
          mainPlugins={mainPlugins}
          thumbPosition={thumbPos}
          mainHeight={420}
        />
      </div>

      <section className="gallery-audit">
        <h2>页面内几何体检</h2>
        {audit ? (
          <ul className="audit-list">
            {audit.checks.map((c) => (
              <li key={c.name} className={c.ok ? "ok" : "bad"}>
                <span className="audit-dot" />
                <b>{c.name}</b>
                <span className="audit-detail">{c.detail}</span>
              </li>
            ))}
            <li className={audit.passed ? "ok summary" : "bad summary"}>
              {audit.passed ? "全部通过" : "存在几何异常"}
            </li>
          </ul>
        ) : (
          <p>检测中…</p>
        )}
      </section>

      <section className="gallery-cards">
        <h2>图集插件清单（10）</h2>
        <div className="card-grid">
          {DOMAIN_PLUGINS.map((d) => {
            const meta = (d.meta ?? (d.create as any).meta) as
              | { description?: string }
              | undefined;
            return (
              <article key={d.key} className="plugin-card">
                <h3>
                  {d.label}
                  {!d.optional && <em>·预设</em>}
                </h3>
                <p>{meta?.description ?? ""}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export { GalleryPage };
