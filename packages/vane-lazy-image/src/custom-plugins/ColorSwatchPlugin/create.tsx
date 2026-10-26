import React from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface ColorSwatchPluginConfig {
  maxColors?: number;
  showPalette?: boolean;
  position?: "bottom" | "overlay" | "bottom-center";
  onColorSelect?: (color: string) => void;
  swatchSize?: number;
  interactive?: boolean;
  style?: React.CSSProperties;
  showColorCode?: boolean;
  gap?: number;
}

const FALLBACK = [
  "rgb(255, 99, 71)",
  "rgb(70, 130, 180)",
  "rgb(60, 179, 113)",
  "rgb(255, 215, 0)",
  "rgb(238, 130, 238)",
];

const POSITIONS: Record<string, React.CSSProperties> = {
  bottom: { bottom: 10, left: 10, right: 10 },
  overlay: {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  "bottom-center": {
    bottom: 10,
    left: "50%",
    transform: "translateX(-50%)",
  },
};

const KEYFRAMES = `
  @keyframes colorSwatchFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function extractColors(img: HTMLImageElement, max: number): string[] {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const scale = 0.1;
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  try {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const counts = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4 * 10) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 128) continue;
      if ((r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15))
        continue;
      const key = `rgb(${Math.round(r / 32) * 32}, ${Math.round(g / 32) * 32}, ${
        Math.round(b / 32) * 32
      })`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([c]) => c);
    return sorted.length ? sorted : FALLBACK.slice(0, max);
  } catch (err) {
    console.error(
      "[ColorSwatchPlugin] extractColors failed (可能是跨域问题):",
      err
    );
    return FALLBACK.slice(0, max);
  }
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/\d+/g);
  if (!m) return rgb;
  const [r, g, b] = m.map(Number);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function ColorSwatchOverlay({
  config,
  context,
}: {
  config: ColorSwatchPluginConfig;
  context: LazyImageContext;
}) {
  const {
    maxColors = 5,
    showPalette = true,
    position = "bottom",
    onColorSelect,
    swatchSize = 32,
    interactive = true,
    style = {},
    showColorCode = false,
    gap = 8,
  } = config;

  const [colors, setColors] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);

  React.useEffect(() => {
    const el = context.imageRef?.current;
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) {
      setColors(extractColors(el, maxColors));
    } else {
      const handler = () => setColors(extractColors(el, maxColors));
      el.addEventListener("load", handler);
      return () => el.removeEventListener("load", handler);
    }
  }, [context.imageRef, maxColors]);

  if (!showPalette || colors.length === 0) return null;

  const select = (c: string) => {
    if (!interactive) return;
    setSelected(c);
    onColorSelect?.(c);
  };

  const paletteStyle: React.CSSProperties = {
    position: "absolute",
    ...POSITIONS[position],
    display: "flex",
    alignItems: "center",
    gap: `${gap}px`,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    zIndex: 10,
    animation: "colorSwatchFadeIn 0.4s ease-out",
    ...style,
  };

  return (
    <>
      <div style={paletteStyle}>
        {colors.map((c) => {
          const isSelected = selected === c;
          const isHovered = hovered === c;
          const swatch: React.CSSProperties = {
            width: `${swatchSize}px`,
            height: `${swatchSize}px`,
            backgroundColor: c,
            borderRadius: "50%",
            cursor: interactive ? "pointer" : "default",
            border: isSelected
              ? "3px solid #333"
              : "2px solid rgba(0,0,0,0.1)",
            boxShadow: isHovered
              ? "0 4px 12px rgba(0,0,0,0.3)"
              : "0 2px 6px rgba(0,0,0,0.15)",
            transform: isHovered ? "scale(1.15)" : "scale(1)",
            transition: "all 0.2s ease",
            position: "relative",
          };
          return (
            <div key={c} style={{ textAlign: "center" }}>
              <div
                style={swatch}
                onClick={() => select(c)}
                onMouseEnter={() => setHovered(c)}
                onMouseLeave={() => setHovered(null)}
                title={rgbToHex(c)}
              />
              {showColorCode && (
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    color: "#666",
                    fontFamily: "monospace",
                  }}
                >
                  {rgbToHex(c)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{KEYFRAMES}</style>
    </>
  );
}

export function createColorSwatchPlugin(
  config: ColorSwatchPluginConfig = {}
): LazyImagePlugin {
  return {
    name: "color-swatch",
    version: "1.0.0",
    config,
    hooks: {
      // 取色要读 canvas 像素：必须在图片加载前设置 crossOrigin，
      // 否则跨域图会被标记为 tainted，getImageData 直接抛 SecurityError。
      transformProps: (props) =>
        ({ ...props, crossOrigin: props.crossOrigin ?? "anonymous" }) as any,
      onMount: (context: LazyImageContext) => {
        try {
          context.imageRef?.current?.setAttribute("crossOrigin", "anonymous");
        } catch {
          /* 同域图无需处理 */
        }
      },
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded || !context.imageRef?.current)
          return null;
        return <ColorSwatchOverlay config={config} context={context} />;
      },
    },
  };
}
