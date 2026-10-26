// 版式参照：B 站首页推荐流 —— 16:9 封面栅格，右下角时长胶囊、悬停才起播
// 装配：宽高比占位 → 时长角标 → 视口驻留 → 淡入 →（置顶那条）视频封面起播
import {
  LazyLoadImageCore,
  createAspectRatioSpacerPlugin,
  createBadgePlugin,
  createFadeInPlugin,
  createVideoPosterPlugin,
  createViewportDwellPlugin,
  withPlugins,
} from "vane-lazy-image";
import React from "react";
import type { CSSProperties } from "react";

// 公共样例视频：仅用于演示「点击封面在弹层里起播」，离线时弹层是黑的
const SAMPLE_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4";

interface VideoItem {
  id: number;
  title: string;
  up: string;
  dur: string;
  play: string;
  /** 置顶那条带「起播」能力 */
  video?: boolean;
  src: string;
}

const VIDEOS: VideoItem[] = [
  { id: 1, title: "把 20 个插件塞进一个图片组件里会发生什么", up: "范同学", dur: "12:34", play: "48.2万", video: true },
  { id: 2, title: "从零实现一个图片懒加载内核（上）", up: "前端自习室", dur: "26:08", play: "31.7万" },
  { id: 3, title: "图片加载慢？先别急着换 CDN", up: "性能小课", dur: "08:52", play: "22.4万" },
  { id: 4, title: "我用插件化把包体积砍了一半", up: "打包艺术家", dur: "15:20", play: "19.8万" },
  { id: 5, title: "手写瀑布流布局的三种方案", up: "布局研究所", dur: "18:46", play: "16.3万" },
  { id: 6, title: "LCP 从 4.2s 到 1.1s 的完整复盘", up: "指标警察", dur: "22:11", play: "14.1万" },
  { id: 7, title: "React 19 里的图片组件该长什么样", up: "新特性观察", dur: "11:03", play: "12.6万" },
  { id: 8, title: "弱网环境下的一次真实排查", up: "断网实验室", dur: "09:37", play: "9.4万" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-bili-${it.id}/480/270` }));

// 每个时长不同，所以角标按条目装配；用 useMemo 固定组件身份，避免重渲染时整块重挂
function Cover({ v }: { v: VideoItem }) {
  const Lazy = React.useMemo(
    () =>
      withPlugins(LazyLoadImageCore as any, [
        createAspectRatioSpacerPlugin({ ratio: 16 / 9 }),
        createBadgePlugin({
          text: v.dur,
          position: "bottom-right",
          bgColor: "rgba(0,0,0,.7)",
          fontSize: 11,
          borderRadius: 2,
        }),
        createViewportDwellPlugin({ dwellMs: 180, onlyWhenIntersecting: true }),
        createFadeInPlugin({ durationMs: 260 }),
        // 置顶那条多挂一个「视频封面」：点封面在弹层里起播，其余保持纯封面
        ...(v.video
          ? [
              createVideoPosterPlugin({
                videoUrl: SAMPLE_VIDEO,
                showPlayButton: true,
                playInModal: true,
                autoPlay: false,
              }),
            ]
          : []),
      ]),
    [v.dur, v.video],
  );
  return (
    <Lazy
      src={v.src}
      alt={v.title}
      loading="lazy"
      containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
      imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

export default function BiliCoverGrid() {
  return (
    <div style={STAGE}>
      <div style={GRID}>
        {VIDEOS.map((v) => (
          <article key={v.id} style={CELL}>
            <Cover v={v} />
            <p style={TITLE}>{v.title}</p>
            <p style={META}>
              {v.up} · {v.play} 播放
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#ffffff", padding: 14, borderRadius: 6 };
const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
  gap: 14,
};
const CELL: CSSProperties = { display: "flex", flexDirection: "column", gap: 5 };
const TITLE: CSSProperties = {
  flexShrink: 0,
  margin: 0,
  color: "#18191c",
  fontSize: 12.5,
  lineHeight: 1.45,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const META: CSSProperties = { flexShrink: 0, margin: 0, color: "#9499a0", fontSize: 11 };
