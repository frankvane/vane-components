// 版式参照：资讯正文页 —— 内嵌图必须先把高度占住，否则 CLS 惩罚稳定扣分
// 装配：宽高比占位 → 骨架屏 → SEO
import {
  LazyLoadImageCore,
  createAspectRatioSpacerPlugin,
  createSEOPlugin,
  createSkeletonPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 4:3 占位：图片到达前后段落位置完全一致
  createAspectRatioSpacerPlugin({ ratio: 4 / 3 }),
  createSkeletonPlugin({ type: "shimmer", backgroundColor: "#eceff1", highlightColor: "#f6f8f9", borderRadius: 2 }),
  createSEOPlugin({ enabled: true, altFallback: "资料图", aspectRatio: "4:3", preload: false }),
]);

export default function InlineAntiCls() {
  return (
    <div style={STAGE}>
      <p style={P}>
        所谓 CLS，本质是「元素在读者眼皮底下换了位置」。正文图是最大的来源：
        图片没有预设高度，加载完成的一瞬间就把下面几段文字全部推下去。
      </p>
      <figure style={FIG}>
        <Lazy
          src="https://picsum.photos/seed/vane-cls/800/600"
          alt="正文插图：布局位移示意"
          loading="lazy"
          containerStyle={{ width: "100%", borderRadius: 3, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <figcaption style={CAP}>图 1：占位生效后，图片到达不会推动下方文字</figcaption>
      </figure>
      <p style={P}>
        把比例写到容器上（或给 img 加 width/height 属性），浏览器就能在图片下载前算出准确高度，
        这一段位移直接从 CLS 里消失。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const P: CSSProperties = { margin: "0 0 10px", color: "#3c3c3c", fontSize: 12, lineHeight: 1.9 };
const FIG: CSSProperties = { margin: "0 0 10px" };
const CAP: CSSProperties = { marginTop: 5, color: "#9c9c9c", fontSize: 10.5 };
