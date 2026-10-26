// 版式参照：政务 / 公共服务站点 —— 无障碍与 SEO 是硬指标，不是加分项
// 装配：无障碍 → 替代文本 → SEO
import {
  LazyLoadImageCore,
  createA11yPlugin,
  createAltTextPlugin,
  createSEOPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 给容器补 role/aria-busy，朗读器能播报"图片加载中"
  createA11yPlugin({
    enabled: true,
    decorative: false,
    statusText: { loading: "图片加载中", loaded: "图片已加载", error: "图片加载失败" },
  }),
  // 运营漏填 alt 时按标题 + 前后文推导，保证不出现空 alt
  createAltTextPlugin({ prefix: "示意图：" }),
  createSEOPlugin({ enabled: true, altFallback: "政策图解", aspectRatio: "16:9", priority: "auto" }),
]);

const ITEMS = [
  { id: 1, title: "办事大厅引导图", alt: "" },
  { id: 2, title: "流程图：线上办理五步", alt: "流程图：线上办理分为五步" },
];

export default function A11yGov() {
  return (
    <div style={STAGE}>
      {ITEMS.map((it) => (
        <figure key={it.id} style={FIG}>
          <Lazy
            src={`https://picsum.photos/seed/vane-a11y-${it.id}/720/405`}
            alt={it.alt}
            loading="lazy"
            containerStyle={{ width: "100%", borderRadius: 3, overflow: "hidden" }}
            imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <figcaption style={CAP}>{it.title}</figcaption>
        </figure>
      ))}
      <p style={HINT}>
        第一张故意留空 alt：插件会按标题推导出「示意图：办事大厅引导图」。
        用朗读器或 DevTools 的 Accessibility 面板检查 aria-busy 与 alt 的实际值。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const FIG: CSSProperties = { margin: "0 0 12px" };
const CAP: CSSProperties = { marginTop: 6, color: "#333", fontSize: 12 };
const HINT: CSSProperties = { margin: 0, color: "#6b6b6b", fontSize: 11, lineHeight: 1.8 };
