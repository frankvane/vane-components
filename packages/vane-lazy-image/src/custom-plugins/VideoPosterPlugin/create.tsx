import React from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface VideoPosterPluginConfig {
  videoUrl: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playButtonPosition?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  playButtonSize?: "small" | "medium" | "large";
  playButtonStyle?: React.CSSProperties;
  showPlayButton?: boolean;
  onPlay?: () => void;
  playInModal?: boolean;
  playIcon?: React.ReactNode;
}

const SIZES: Record<string, { size: number; iconSize: number }> = {
  small: { size: 48, iconSize: 20 },
  medium: { size: 64, iconSize: 28 },
  large: { size: 80, iconSize: 36 },
};

const POSITIONS: Record<string, React.CSSProperties> = {
  center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  "top-left": { top: 20, left: 20 },
  "top-right": { top: 20, right: 20 },
  "bottom-left": { bottom: 20, left: 20 },
  "bottom-right": { bottom: 20, right: 20 },
};

const KEYFRAMES = `
  @keyframes videoModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes videoPosterPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

function VideoPosterOverlay({
  config,
  context,
}: {
  config: VideoPosterPluginConfig;
  context: LazyImageContext;
}) {
  const {
    videoUrl,
    autoPlay = true,
    loop = false,
    muted = true,
    playButtonPosition = "center",
    playButtonSize = "large",
    playButtonStyle = {},
    showPlayButton = true,
    onPlay,
    playInModal = true,
    playIcon,
  } = config;

  const [playing, setPlaying] = React.useState(false);
  const start = () => {
    setPlaying(true);
    onPlay?.();
  };

  const dims = SIZES[playButtonSize];
  const btnStyle: React.CSSProperties = {
    position: "absolute",
    ...POSITIONS[playButtonPosition],
    width: dims.size,
    height: dims.size,
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    border: "3px solid rgba(255, 255, 255, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    transition: "all 0.3s ease",
    ...playButtonStyle,
  };

  if (playing && playInModal) {
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "videoModalFadeIn 0.3s ease-out",
          }}
          onClick={() => setPlaying(false)}
        >
          <button
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              border: "2px solid white",
              color: "white",
              fontSize: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10001,
            }}
            onClick={() => setPlaying(false)}
          >
            ×
          </button>
          <video
            src={videoUrl}
            controls
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 8,
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <style>{KEYFRAMES}</style>
      </>
    );
  }

  if (playing && !playInModal) {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#000",
          zIndex: 10,
        }}
      >
        <button
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.2)",
            border: "2px solid white",
            color: "white",
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 11,
          }}
          onClick={() => setPlaying(false)}
        >
          ×
        </button>
        <video
          src={videoUrl}
          controls
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    );
  }

  if (!showPlayButton) return null;

  return (
    <>
      <div
        style={btnStyle}
        onClick={start}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
          if (playButtonPosition === "center")
            e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
          else e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
          if (playButtonPosition === "center")
            e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
          else e.currentTarget.style.transform = "scale(1)";
        }}
        title="播放视频"
      >
        {playIcon ?? (
          <svg
            width={dims.iconSize}
            height={dims.iconSize}
            viewBox="0 0 24 24"
            fill="white"
            style={{ marginLeft: 2 }}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>
      <style>{KEYFRAMES}</style>
    </>
  );
}

export function createVideoPosterPlugin(
  config: VideoPosterPluginConfig
): LazyImagePlugin {
  return {
    name: "video-poster",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded) return null;
        return <VideoPosterOverlay config={config} context={context} />;
      },
    },
  };
}
