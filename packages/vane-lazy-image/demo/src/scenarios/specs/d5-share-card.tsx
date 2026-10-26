// 版式参照：内容分享卡片 —— 配图 + 图注 + 信息蒙层 + 平台分享入口
// 装配：社交分享 → 图片说明 → 信息蒙层
import {
  LazyLoadImageCore,
  createCaptionPlugin,
  createOverlayInfoPlugin,
  createSocialSharePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 分享：微信/微博/复制链接，真实项目里接自己的分享 SDK
  createSocialSharePlugin({
    platforms: ["wechat", "twitter", "facebook"],
    position: "top-right",
    showOnHover: true,
    title: "分享这张图",
    size: "small",
  }),
  // 图注固定在底部，不超过两行
  createCaptionPlugin({
    text: "© 城市观察 · 2024 秋 · 拍摄于滨江步道",
    position: "bottom",
    bg: "rgba(0,0,0,.52)",
    color: "#fff",
  }),
  // 右上角信息蒙层：机型 / 光圈 / 快门，悬停显示
  createOverlayInfoPlugin({
    content: "iPhone 15 Pro · f/1.8 · 1/250s · ISO 64",
    position: "top",
    background: "rgba(0,0,0,.45)",
    showWhen: "always",
    trigger: "hover",
    fontSize: 10,
  }),
]);

export default function ShareCard() {
  return (
    <div style={STAGE}>
      <div style={CARD}>
        <Lazy
          src="https://picsum.photos/seed/vane-share/720/900"
          alt="滨江步道的秋日银杏"
          loading="lazy"
          containerStyle={{ width: "100%",
 aspectRatio: "720 / 900", borderRadius: 8, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <p style={HINT}>悬停图片：右上出现分享入口、顶部出现拍摄参数；图注常驻底部。</p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#111", padding: 16, borderRadius: 6 };
const CARD: CSSProperties = { position: "relative", maxWidth: 320, margin: "0 auto" };
const HINT: CSSProperties = { margin: "12px 0 0", color: "#8a8a8a", fontSize: 11, lineHeight: 1.7, textAlign: "center" };
