// 版式参照：知乎 / 微信公众号长文 —— 正文配图，宽高比必须预留
// 装配：LQIP 低清先出 → 宽高比占位 → SEO（alt / 结构化）
import {
  LazyLoadImageCore,
  createAspectRatioSpacerPlugin,
  createLqipPlugin,
  createSEOPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 正文图 16:9，占位后滚动条不会因为图片到达而抖动
  createAspectRatioSpacerPlugin({ ratio: 16 / 9 }),
  // 低清占位：把同一地址缩到 24px 宽再模糊放大（真实项目换成后端返回的 base64）
  createLqipPlugin({ lqipSrc: (src: string) => src.replace(/\/\d+\/\d+$/, "/24/14"), blur: 18 }),
  // 长文要能被搜索引擎抓到图与 alt，并能产出 article 结构化数据
  createSEOPlugin({ enabled: true, altFallback: "文章配图", aspectRatio: "16:9", priority: "auto" }),
]);

const BLOCKS = [
  { id: 1, caption: "图 1：改造前的客厅，采光被柜子挡住了。" },
  { id: 2, caption: "图 2：拆掉上柜之后，光线能一直打到走廊。" },
  { id: 3, caption: "图 3：最后在窗边加了一张矮凳。" },
];

export default function ArticleImages() {
  return (
    <div style={STAGE}>
      <h4 style={TITLE}>把客厅的墙拆了之后，我才知道采光有多重要</h4>
      <p style={P}>
        这篇主要记录改造过程里最容易被忽略的一件事：图片加载顺序其实会影响阅读体验。
        正文图一旦晚到位，段落就会整体下移，读者刚看到一半的句子会被推走。
      </p>
      {BLOCKS.map((b) => (
        <figure key={b.id} style={FIG}>
          <Lazy
            src={`https://picsum.photos/seed/vane-article-${b.id}/960/540`}
            alt={b.caption}
            loading="lazy"
            containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
            imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <figcaption style={CAP}>{b.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const TITLE: CSSProperties = { margin: 0, color: "#1a1a1a", fontSize: 15 };
const P: CSSProperties = { color: "#444", fontSize: 12, lineHeight: 1.85, margin: "8px 0 12px" };
const FIG: CSSProperties = { margin: "0 0 12px" };
const CAP: CSSProperties = { marginTop: 5, color: "#9c9c9c", fontSize: 10.5 };
