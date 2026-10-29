/**
 * `vane-file-preview/custom-plugins/VideoPreviewPlugin`
 *
 * 视频预览走原生 `<video>`，零依赖。
 *
 * 迁移前这个文件 `import` 了 `react-player` 却从未使用（26 个 dependencies 里的死依赖之一），
 * 而真正的渲染一直是 `<video>` —— 那行 import 被 esbuild 抹掉后构建看不出任何异常，
 * 只有翻 `package.json` 与 bundle 分析才看得见。
 *
 * ## autoplay 与 muted 的关系
 *
 * 浏览器的自动播放策略要求「静音才允许自动播放」（Chrome/Safari 都是）。
 * `autoplay: true` 而 `muted: false` 时视频会**停在第一帧不动**，看起来很像是
 * 加载失败。这里不偷偷改用户配置，但会在工具栏给一条提示 —— 静默失败比报错更难查。
 */

import React from "react";

import {
  normalizeExtension,
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import type { FilePreviewPlugin } from "../../components/FilePreviewPlugin/plugins/types";

export interface VideoPreviewPluginConfig {
  /** 显示原生控件。默认 true */
  controls?: boolean;
  /** 自动播放（未静音时会被浏览器拦下）。默认 false */
  autoplay?: boolean;
  /** 循环播放。默认 false */
  loop?: boolean;
  /** 静音。默认 false */
  muted?: boolean;
  /** 预加载策略。默认 "metadata"（只取时长/首帧，省流量） */
  preload?: "none" | "metadata" | "auto";
}

const VIDEO_TYPE_LABELS: Record<string, string> = {
  mp4: "MP4",
  m4v: "M4V",
  webm: "WebM",
  ogg: "OGG",
  ogv: "OGV",
  mov: "QuickTime",
  avi: "AVI",
  wmv: "Windows Media",
  flv: "Flash",
  mkv: "Matroska",
};

function videoLabel(extension: string): string {
  const key = normalizeExtension(extension);
  return VIDEO_TYPE_LABELS[key] ? `${VIDEO_TYPE_LABELS[key]} Video` : "Video";
}

/**
 * **通常播不了**的容器，以及各自的原因。
 *
 * 这几个格式在 `supportedExtensions` 里是有意保留的 —— 用户拿到一个 .avi 时，
 * 与其让它一路落到兜底下变成「什么都看不出来」，不如明确告诉他「这个格式浏览器
 * 播不了，去下载」。但提示语必须说准：迁移前统一写「浏览器**可能**不支持该编码」，
 * 对必然失败的格式，这个「可能」会让用户反复重试或去查自己的文件。
 *
 * **别写成「必然不支持」**：容器不等于编码。真机验收时 `sample.flv` 在 Chromium
 * 里 readyState=4、852×h 正常播放 —— 因为那个 FLV 里装的是 H.264/AAC，而浏览器
 * 支持的解复用器恰好认它。同理 MKV / MOV 也是「多数不认、装了 H.264 时可能认」。
 * 所以这里写的是**最常见的原因**，不是判决书；只有真的触发了 onError 才会用到它。
 */
const UNSUPPORTED_IN_BROWSER: Record<string, string> = {
  avi: "AVI 是老式容器，编码多为 DivX/Xvid，主流浏览器都没有内置解码器",
  wmv: "WMV 是微软的私有格式，Chrome / Firefox / Safari 都不支持",
  flv: "FLV 只是容器：里面装 Sorenson / VP6 时一律播不了，装 H.264/AAC 才可能被个别内核认",
  mkv: "MKV 只是容器，浏览器能否播取决于里面的编码；多数情况不支持",
  mov: "QuickTime 在 Safari 之外基本不可播（除非内部就是 H.264）",
};

/** 失败提示要能回答「为什么」和「现在怎么办」，答不上来时保持保守措辞 */
function videoErrorMessage(fileName: string, extension: string): string {
  const key = normalizeExtension(extension);
  const known = UNSUPPORTED_IN_BROWSER[key];
  if (known) {
    return `浏览器无法播放 ${key.toUpperCase()}：${known}。<video> 只保证 MP4(H.264) / WebM / OGV 三种，可以下载后用本地播放器打开，或先转成 MP4。`;
  }
  return `视频加载失败：${fileName}。可能是编码不在 <video> 支持范围内（H.264 / VP9 / AV1 最稳），也可能文件本身损坏；可以下载后用本地播放器确认。`;
}

export function createVideoPreviewPlugin(
  config: VideoPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved = {
    controls: config.controls ?? true,
    autoplay: config.autoplay ?? false,
    loop: config.loop ?? false,
    muted: config.muted ?? false,
    preload: config.preload ?? ("metadata" as const),
  };
  const autoplayBlocked = resolved.autoplay && !resolved.muted;

  return {
    name: "VideoPreviewPlugin",
    version: "1.0.0",
    description: "视频预览（原生 video）",
    supportedTypes: ["video/*"],
    /**
     * 刻意**不含 `.ogg`**：`.ogg` 是容器而不是编码，Vorbis 音频与 Theora 视频
     * 同名。绝大多数 `.ogg` 是音频，所以扩展名让给 `AudioPreviewPlugin`；
     * 真正的视频 ogg 走 `video/*` MIME（`video/ogg`）或 `.ogv` 扩展名。
     *
     * 这是 P3-A 真浏览器验收抓到的：一段 Vorbis 音频被本插件靠 `.ogg` 抢走，
     * 渲染成黑底视频框。`resolve.ts` 现在也会让 MIME 命中压过「只有扩展名像」，
     * 两条一起才把这类歧义堵住。
     */
    supportedExtensions: [
      ".mp4",
      ".webm",
      ".ogv",
      ".mov",
      ".avi",
      ".wmv",
      ".flv",
      ".mkv",
    ],
    priority: 10,
    config: resolved,

    hooks: {
      render: (context) => {
        const { file, state } = context;
        if (state.state !== "loaded") return null;

        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              boxSizing: "border-box",
            }}
          >
            <video
              src={file.url}
              controls={resolved.controls}
              autoPlay={resolved.autoplay}
              loop={resolved.loop}
              muted={resolved.muted}
              preload={resolved.preload}
              playsInline
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
              onError={() => {
                context.reportState({
                  state: "error",
                  message: videoErrorMessage(file.name, file.extension),
                });
              }}
            >
              你的浏览器不支持 &lt;video&gt; 标签。
            </video>
          </div>
        );
      },

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type={videoLabel(context.file.extension)}
            icon="🎬"
          />

          {autoplayBlocked && (
            <span style={{ fontSize: 11, color: "#8a6d3b" }}>
              自动播放需同时开启 muted（浏览器策略）
            </span>
          )}

          <ToolbarSeparator />

          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载视频"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createVideoPreviewPlugin;
