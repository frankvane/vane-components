// 版式参照：B 站 / YouTube 首页顶部运营 Banner —— 首屏唯一的大图，LCP 主体
// 装配：首屏优先 → 预连接 → LQIP 低清先出
import {
  LazyLoadImageCore,
  createLqipPlugin,
  createPreconnectPlugin,
  createPriorityLoadingPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // Banner 就是 LCP 元素，直接拉到最高优先级
  createPriorityLoadingPlugin({ priority: "high" }),
  // 图床域名提前建连，省掉 DNS + TLS 的一个 RTT
  createPreconnectPlugin({ domains: ["https://picsum.photos"], crossOrigin: "anonymous" }),
  // 20 像素级低清先铺满，再换成高清，避免大面积留白；
  // lqipSrc 支持函数形式：由高清地址推导低清地址（真实项目换成后端返回的 base64）
  createLqipPlugin({
    lqipSrc: (src: string) => src.replace(/\/\d+\/\d+$/, "/20/8"),
    blur: 16,
    opacity: 1,
  }),
]);

export default function HeroBanner() {
  return (
    <div style={STAGE}>
      <div style={HERO}>
        <Lazy
          src="https://picsum.photos/seed/vane-hero/1280/520"
          alt="春季新番专题"
          loading="eager"
          containerStyle={{ width: "100%", height: "100%" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={OVERLAY}>
          <p style={KICKER}>春季新番</p>
          <h3 style={HEAD}>48 部新作同步上线</h3>
        </div>
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#ffffff", padding: 14, borderRadius: 6 };
const HERO: CSSProperties = { position: "relative", height: 200, borderRadius: 6, overflow: "hidden" };
const OVERLAY: CSSProperties = {
  position: "absolute",
  inset: "auto 0 0 0",
  padding: "18px 16px 14px",
  background: "linear-gradient(to top, rgba(0,0,0,.72), transparent)",
};
const KICKER: CSSProperties = {
  margin: 0,
  fontSize: 11,
  letterSpacing: ".12em",
  color: "#ffb27a",
  textTransform: "uppercase",
};
const HEAD: CSSProperties = { margin: "4px 0 0", color: "#fff", fontSize: 18 };
