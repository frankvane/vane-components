/**
 * `vane-file-preview/custom-plugins/AudioPreviewPlugin`
 *
 * 音频预览走原生 `<audio>`，零依赖。
 *
 * 迁移前这个文件里复制了一份 `formatSize`（和 `FileMeta` 里那份逐字相同）
 * **而且从未被调用**，同时 `react-h5-audio-player` 躺在 dependencies 里当死依赖。
 * 现在字节格式化只剩 `shared/fileHelpers.ts` 一份。
 *
 * ── 关于「原生控件被压成两像素」这件事（2026-10-27 修） ────────────────────
 * 预览器拿到的框高度由外部决定：demo 的逐项页给了 232px，工坊卡只有 83px
 * （165px 的舞台再被工具栏吃掉一半）。原布局是「72px 音符 / 文件名 / 控件」
 * 纵向排列，纵向预算 180px 起步 —— 一旦越界，flex 会**按比例压缩所有子项**，
 * 而唯一有「固有高度可压」的就是 `<audio>`：它被压到 2.1px（逐项页）和 0
 * （工坊卡）。原生控件的高度是浏览器画的，压扁之后时间轴、按钮全被裁掉，
 * 页面上只剩一条两像素的细线，看上去像「播放器坏了」。
 *
 * 两条修法一起上：
 *  1. 布局改成横向（音符在左、文件名与控件在右），并在 `<audio>` 上写死
 *     `flexShrink: 0` —— 控件的高度永不被压缩，宁可整块滚动。
 *  2. 容器真的很矮时（ResizeObserver 量出来的实际高度）主动退化成「只留控件」：
 *     文件名和音符都是可省的装饰，播放器不是。工具栏里本来就写着文件名。
 */

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
import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { AudioCard } from "./internal";

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
          <AudioCard
            file={file}
            controls={resolved.controls}
            autoplay={resolved.autoplay}
            loop={resolved.loop}
            preload={resolved.preload}
            onError={() => {
              context.reportState({
                state: "error",
                message: `音频加载失败：${file.name}（浏览器可能不支持该编码）`,
              });
            }}
          />
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
