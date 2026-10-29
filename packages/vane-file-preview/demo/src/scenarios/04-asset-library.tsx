/**
 * D04 · 素材库（图 + 视频 + 音频混合）
 *
 * 真实痛点是「素材列表里三种媒体混在一起」：缩略图要能出（视频取首帧、音频给图标），
 * 点开按类型给对应的播放器，而不是统一塞进 <img>。路由在这一格的意义最直观 ——
 * 同一个「点一下」，落到三个完全不同的插件上。
 *
 * 缩略图用浏览器原生能力（<img> / <video preload="metadata">），不额外引缩略图库：
 * 素材库的缩略图本来就该由上传管线生成，预览层只负责「没有缩略图时别崩」。
 */
import React from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import {
  createAudioPreviewPlugin,
  createImagePreviewPlugin,
  createVideoPreviewPlugin,
} from "vane-file-preview/custom-plugins";
import { formatBytes } from "../lib/format";
import { pick } from "../data/samples";
import type { ScenarioMeta } from "./types";

const Preview = withPlugins(FilePreviewCore, {
  plugins: [createImagePreviewPlugin(), createVideoPreviewPlugin(), createAudioPreviewPlugin()],
});

const ASSETS = pick(
  "sample.jpg",
  "sample.png",
  "sample.gif",
  "sample.webp",
  "sample.svg",
  "sample.mp4",
  "sample.webm",
  "sample.mp3"
);

export const meta: ScenarioMeta = {
  code: "D04",
  title: "素材库 · 混合媒体",
  pain: "图、视频、音频混在一个列表里：缩略图要出得来（视频取首帧、音频给图标），点开按类型换播放器，而不是全塞进 <img>。",
  plugs: [
    { fn: "createImagePreviewPlugin", why: "图片按原图看，可缩放/旋转" },
    { fn: "createVideoPreviewPlugin", why: "视频给原生控件，横向视频不裁切" },
    { fn: "createAudioPreviewPlugin", why: "音频套卡片，没有封面也不难看" },
  ],
  note: "三种媒体的「点一下」走的是三条完全不同的渲染路径 —— 这一格是单赢家路由最直观的证据。",
};

function isVideo(type: string) {
  return type.startsWith("video/");
}
function isAudio(type: string) {
  return type.startsWith("audio/");
}

const LibraryScenario: React.FC = () => {
  const [active, setActive] = React.useState(ASSETS[0].name);
  const file = ASSETS.find((a) => a.name === active) ?? ASSETS[0];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 10 }}>
      <div className="tile-grid">
        {ASSETS.map((a) => (
          <button
            key={a.name}
            type="button"
            className="tile"
            aria-pressed={a.name === active}
            title={`${a.name} · ${formatBytes(a.size)}`}
            onClick={() => setActive(a.name)}
          >
            {isVideo(a.type) ? (
              <video src={a.url} muted preload="metadata" />
            ) : isAudio(a.type) ? (
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg,#2a2723,#141310)",
                  color: "#ffa165",
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                }}
              >
                AUDIO
              </span>
            ) : (
              <img src={a.url} alt={a.name} loading="lazy" />
            )}
            <span className="tile-tag">{a.name}</span>
          </button>
        ))}
      </div>

      <div className="stage-shell" style={{ height: 400 }}>
        <div className="filebar">
          <span className="filebar-label">asset</span>
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "#5f5d58" }}>
            {file.name}
          </span>
        </div>
        <div className="stage-mount">
          <Preview file={file} containerStyle={{ width: "100%", height: "100%" }} />
        </div>
        <div className="stage-foot">
          <span className="dot is-loaded" aria-hidden="true" />
          <span>{file.type}</span>
          <span style={{ marginLeft: "auto" }}>{formatBytes(file.size)}</span>
        </div>
      </div>
    </div>
  );
};

export default LibraryScenario;
