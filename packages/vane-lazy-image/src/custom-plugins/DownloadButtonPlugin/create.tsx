import React from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface DownloadButtonPluginConfig {
  filename?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "small" | "medium" | "large";
  buttonStyle?: React.CSSProperties;
  showOnHover?: boolean;
  onBeforeDownload?: (src: string) => void | Promise<void>;
  onDownloadSuccess?: (filename: string) => void;
  onDownloadError?: (error: unknown) => void;
  customIcon?: React.ReactNode;
  showTooltip?: boolean;
  tooltipText?: string;
}

const SIZES: Record<string, { size: number; iconSize: number }> = {
  small: { size: 32, iconSize: 16 },
  medium: { size: 40, iconSize: 20 },
  large: { size: 48, iconSize: 24 },
};

const POSITIONS: Record<string, React.CSSProperties> = {
  "top-left": { top: 10, left: 10 },
  "top-right": { top: 10, right: 10 },
  "bottom-left": { bottom: 10, left: 10 },
  "bottom-right": { bottom: 10, right: 10 },
};

const KEYFRAMES = `
  @keyframes downloadSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

function DownloadButtonOverlay({
  config,
  context,
}: {
  config: DownloadButtonPluginConfig;
  context: LazyImageContext;
}) {
  const {
    filename,
    position = "top-right",
    size = "medium",
    buttonStyle = {},
    showOnHover = false,
    onBeforeDownload,
    onDownloadSuccess,
    onDownloadError,
    customIcon,
    showTooltip = true,
    tooltipText = "下载图片",
  } = config;

  const [hover, setHover] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  const dims = SIZES[size];

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloading(true);
      await onBeforeDownload?.(context.src);
      const name =
        filename || context.src.split("/").pop() || "download.jpg";
      const blob = await (await fetch(context.src)).blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      onDownloadSuccess?.(name);
    } catch (err) {
      console.error("[DownloadButtonPlugin] Download failed:", err);
      onDownloadError?.(err);
    } finally {
      setDownloading(false);
    }
  };

  const btnStyle: React.CSSProperties = {
    position: "absolute",
    ...POSITIONS[position],
    width: dims.size,
    height: dims.size,
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    border: "2px solid rgba(255, 255, 255, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: downloading ? "wait" : "pointer",
    zIndex: 10,
    opacity: showOnHover && !hover ? 0 : 1,
    transform: hover ? "scale(1.1)" : "scale(1)",
    transition: "all 0.3s ease",
    ...buttonStyle,
  };

  return (
    <>
      {showOnHover && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9,
            pointerEvents: "auto",
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        />
      )}
      <div
        style={btnStyle}
        onClick={handleDownload}
        title={showTooltip ? tooltipText : undefined}
      >
        {customIcon ??
          (downloading ? (
            <svg
              width={dims.iconSize}
              height={dims.iconSize}
              viewBox="0 0 24 24"
              fill="white"
              style={{ animation: "downloadSpin 1s linear infinite" }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeDasharray="31.4"
                strokeDashoffset="10"
              />
            </svg>
          ) : (
            <svg
              width={dims.iconSize}
              height={dims.iconSize}
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          ))}
      </div>
      <style>{KEYFRAMES}</style>
    </>
  );
}

export function createDownloadButtonPlugin(
  config: DownloadButtonPluginConfig = {}
): LazyImagePlugin {
  return {
    name: "download-button",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded) return null;
        return <DownloadButtonOverlay config={config} context={context} />;
      },
    },
  };
}
