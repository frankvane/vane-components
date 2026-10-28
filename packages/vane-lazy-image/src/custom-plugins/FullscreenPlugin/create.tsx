/**
 * FullscreenPlugin —— 全屏切换（gallery 增强插件）。
 *
 * 在 galleryToolbarArea 渲染 全屏/退出 按钮，对图集根容器（data-gallery-root）调用
 * requestFullscreen / exitFullscreen。监听 fullscreenchange 同步按钮态。
 * 不依赖内核 context 暴露 DOM 节点——通过当前按钮向上查找 [data-gallery-root] 锚点。
 */
import React from "react";
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface FullscreenConfig {
  /** 按钮文案 */
  enterLabel?: string;
  exitLabel?: string;
}

export function createFullscreenPlugin(config: FullscreenConfig = {}): GalleryPlugin {
  const { enterLabel = "⛶ 全屏", exitLabel = "✕ 退出" } = config;

  const Fullscreen: React.FC<{ context: GalleryContext }> = () => {
    const [isFs, setIsFs] = React.useState(false);
    const btnRef = React.useRef<HTMLButtonElement | null>(null);

    React.useEffect(() => {
      const onChange = () => setIsFs(document.fullscreenElement != null);
      document.addEventListener("fullscreenchange", onChange);
      return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const toggle = () => {
      const root = btnRef.current?.closest("[data-gallery-root]") as
        | HTMLElement
        | null;
      if (!root) return;
      if (document.fullscreenElement) {
        void document.exitFullscreen?.();
      } else {
        void root.requestFullscreen?.();
      }
    };

    return (
      <button
        ref={btnRef}
        type="button"
        aria-label={isFs ? "退出全屏" : "进入全屏"}
        aria-pressed={isFs}
        onClick={toggle}
        style={{
          border: "1px solid #ddd",
          background: "#fff",
          borderRadius: 6,
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 13,
          color: "#333",
          userSelect: "none",
        }}
      >
        {isFs ? exitLabel : enterLabel}
      </button>
    );
  };

  return {
    name: "gallery-fullscreen",
    version: "1.0.0",
    config,
    hooks: {
      galleryToolbarArea: (context: GalleryContext) => <Fullscreen context={context} />,
    },
  };
}

export default createFullscreenPlugin;
