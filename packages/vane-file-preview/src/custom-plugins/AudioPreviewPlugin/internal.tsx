/**
 * `AudioPreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import React from "react";

import type {
  FileInfo,
} from "../../components/FilePreviewPlugin/plugins/types";

/** 低于这个高度就藏文件名：工具栏里已经有了，播放器不能没有 */
const NAME_MIN_H = 128;
/** 再矮一档，连音符一起收掉，只留控件本身 */
const NOTE_MIN_H = 96;

/** 服务端渲染时没有 layout effect，退成普通 effect（只是首帧晚一点定档） */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

interface AudioCardProps {
  file: FileInfo;
  controls: boolean;
  autoplay: boolean;
  loop: boolean;
  preload: "none" | "metadata" | "auto";
  onError: () => void;
}

/**
 * 卡片本体。单独成组件是为了能用 `ResizeObserver` 量自己的高度 ——
 * 插件的 `render` 是普通函数，里面不能放 hook。
 *
 * 不支持 ResizeObserver 时（SSR / 老环境）走完整布局：
 * 这是「内容最全」的一档，高度不够时外层可滚，控件照样完整。
 */
export const AudioCard: React.FC<AudioCardProps> = ({
  file,
  controls,
  autoplay,
  loop,
  preload,
  onError,
}) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = React.useState(Number.POSITIVE_INFINITY);

  // 量不到高度（0）时保持完整布局：happy-dom 没有布局引擎、`display:none`
  // 的容器也量不出东西，把 0 当成「很矮」会让「还没排完」变成永久紧凑档
  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // 先同步量一次再开始监听：只在 RO 回调里设值的话，首帧会先按「完整布局」
    // 画一遍再跳成紧凑档（工坊卡上肉眼可见的一下抖）
    const first = host.getBoundingClientRect().height;
    if (first > 0) setHeight(first);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) setHeight(entry.contentRect.height);
      }
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const showName = height >= NAME_MIN_H;
  const showNote = height >= NOTE_MIN_H;
  const compact = !showName;

  return (
    <div
      ref={hostRef}
      data-vfp-audio=""
      data-vfp-audio-compact={compact ? "" : undefined}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        // 真的挤到装不下（比如 60px 的条带）就滚动，而不是压扁控件
        overflow: "auto",
        boxSizing: "border-box",
        // 音频没有画面，用一层渐变让空卡片看起来不像坏了
        background: "linear-gradient(135deg, #4a5bd0 0%, #5b3a7e 100%)",
      }}
    >
      <div
        style={{
          // margin:auto 而不是父级 justify-content:center ——
          // 居中溢出时内容会被裁在滚动原点上侧，滚不回来
          margin: "auto",
          width: "100%",
          maxWidth: 620,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: showName ? "16px 20px" : "0 14px",
          padding: compact ? "10px 14px" : "18px 22px",
          boxSizing: "border-box",
        }}
      >
        {showNote && (
          <div
            aria-hidden="true"
            style={{ fontSize: compact ? 40 : 64, lineHeight: 1, flexShrink: 0, userSelect: "none" }}
          >
            🎵
          </div>
        )}

        <div
          style={{
            flex: "1 1 220px",
            minWidth: 0,
            maxWidth: 460,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {showName && (
            <div
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                // 再挤也不许压文字：宁可整块滚动
                flexShrink: 0,
              }}
              title={file.name}
            >
              {file.name}
            </div>
          )}

          <audio
            src={file.url}
            controls={controls}
            autoPlay={autoplay}
            loop={loop}
            preload={preload}
            style={{
              display: "block",
              width: "100%",
              // 关键：原生控件的高度由浏览器决定（Chrome 54 / Safari 约 40 /
              // iOS 更大），**不让 flex 压缩它**，否则控件内部的时间轴与按钮
              // 会被裁成一条细线。
              flexShrink: 0,
            }}
            onError={onError}
          >
            你的浏览器不支持 &lt;audio&gt; 标签。
          </audio>

          {/* controls: false 时页面上没有任何可点的东西，补一句说明，
              否则用户会以为预览坏了 */}
          {!controls && (
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, flexShrink: 0 }}>
              控件已隐藏（controls: false）
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
