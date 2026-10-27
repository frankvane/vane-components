/**
 * `vane-file-preview/custom-plugins/AudioPreviewPlugin`
 *
 * 音频预览走原生 `<audio>`，零依赖。
 *
 * 迁移前这个文件里复制了一份 `formatSize`（和 `FileMeta` 里那份逐字相同）
 * **而且从未被调用**，同时 `react-h5-audio-player` 躺在 dependencies 里当死依赖。
 * 现在字节格式化只剩 `shared/fileHelpers.ts` 一份。
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

export interface AudioPreviewPluginConfig {
  /** 显示原生控件。默认 true */
  controls?: boolean;
  /** 自动播放（多数浏览器会拦下非静音的自动播放）。默认 false */
  autoplay?: boolean;
  /** 循环播放。默认 false */
  loop?: boolean;
  /** 预加载策略。默认 "metadata" */
  preload?: "none" | "metadata" | "auto";
}

const AUDIO_TYPE_LABELS: Record<string, string> = {
  mp3: "MP3",
  wav: "WAV",
  ogg: "OGG",
  oga: "OGG",
  m4a: "M4A",
  aac: "AAC",
  flac: "FLAC",
  wma: "Windows Media",
};

function audioLabel(extension: string): string {
  const key = normalizeExtension(extension);
  return AUDIO_TYPE_LABELS[key] ? `${AUDIO_TYPE_LABELS[key]} Audio` : "Audio";
}

export function createAudioPreviewPlugin(
  config: AudioPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved = {
    controls: config.controls ?? true,
    autoplay: config.autoplay ?? false,
    loop: config.loop ?? false,
    preload: config.preload ?? ("metadata" as const),
  };

  return {
    name: "AudioPreviewPlugin",
    version: "1.0.0",
    description: "音频预览（原生 audio）",
    supportedTypes: ["audio/*"],
    supportedExtensions: [
      ".mp3",
      ".wav",
      ".ogg",
      ".oga",
      ".m4a",
      ".aac",
      ".flac",
      ".wma",
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
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              padding: 24,
              boxSizing: "border-box",
              // 音频没有画面，用一层渐变让空卡片看起来不像坏了
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <div style={{ fontSize: 72, lineHeight: 1, opacity: 0.9 }}>🎵</div>

            <div
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: 500,
                textAlign: "center",
                maxWidth: "90%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={file.name}
            >
              {file.name}
            </div>

            <audio
              src={file.url}
              controls={resolved.controls}
              autoPlay={resolved.autoplay}
              loop={resolved.loop}
              preload={resolved.preload}
              style={{ width: "80%", maxWidth: 500 }}
              onError={() => {
                context.reportState({
                  state: "error",
                  message: `音频加载失败：${file.name}（浏览器可能不支持该编码）`,
                });
              }}
            >
              你的浏览器不支持 &lt;audio&gt; 标签。
            </audio>
          </div>
        );
      },

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type={audioLabel(context.file.extension)}
            icon="🎵"
          />
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载音频"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createAudioPreviewPlugin;
