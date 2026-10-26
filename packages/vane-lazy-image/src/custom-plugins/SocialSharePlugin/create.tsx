import React from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface SocialSharePluginConfig {
  platforms?: Array<
    "facebook" | "twitter" | "pinterest" | "linkedin" | "whatsapp" | "wechat"
  >;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showOnHover?: boolean;
  url?: string;
  title?: string;
  description?: string;
  ogImage?: string;
  onShare?: (platform: string) => void;
  style?: React.CSSProperties;
  size?: "small" | "medium" | "large";
}

const PLATFORMS: Record<
  string,
  { name: string; icon: string; color: string; getShareUrl: (p: ShareParams) => string }
> = {
  facebook: {
    name: "Facebook",
    icon: "f",
    color: "#1877F2",
    getShareUrl: (p) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(p.url)}`,
  },
  twitter: {
    name: "Twitter",
    icon: "𝕏",
    color: "#000000",
    getShareUrl: (p) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        p.url
      )}&text=${encodeURIComponent(p.title)}`,
  },
  pinterest: {
    name: "Pinterest",
    icon: "P",
    color: "#E60023",
    getShareUrl: (p) =>
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
        p.url
      )}&media=${encodeURIComponent(p.ogImage)}&description=${encodeURIComponent(
        p.description || p.title
      )}`,
  },
  linkedin: {
    name: "LinkedIn",
    icon: "in",
    color: "#0A66C2",
    getShareUrl: (p) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        p.url
      )}`,
  },
  whatsapp: {
    name: "WhatsApp",
    icon: "W",
    color: "#25D366",
    getShareUrl: (p) =>
      `https://wa.me/?text=${encodeURIComponent(p.title + " " + p.url)}`,
  },
  wechat: {
    name: "WeChat",
    icon: "微",
    color: "#07C160",
    getShareUrl: (p) => p.url,
  },
};

interface ShareParams {
  url: string;
  title: string;
  description: string;
  ogImage: string;
}

const SIZES: Record<string, { button: number; icon: number }> = {
  small: { button: 28, icon: 14 },
  medium: { button: 36, icon: 16 },
  large: { button: 44, icon: 18 },
};

const POSITIONS: Record<string, React.CSSProperties> = {
  "top-right": { top: 10, right: 10 },
  "bottom-right": { bottom: 10, right: 10 },
  "top-left": { top: 10, left: 10 },
  "bottom-left": { bottom: 10, left: 10 },
};

const KEYFRAMES = `
  @keyframes shareButtonSlideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

function SocialShareOverlay({
  config,
  context,
}: {
  config: SocialSharePluginConfig;
  context: LazyImageContext;
}) {
  const {
    platforms = ["facebook", "twitter", "pinterest"],
    position = "top-right",
    showOnHover = false,
    url,
    title = "分享图片",
    description = "",
    ogImage,
    onShare,
    style = {},
    size = "medium",
  } = config;

  const [visible, setVisible] = React.useState(!showOnHover);
  const [open, setOpen] = React.useState(false);

  const shareUrl =
    url ?? (typeof window !== "undefined" ? window.location.href : "");
  const params: ShareParams = {
    url: shareUrl,
    title,
    description,
    ogImage: ogImage ?? context.src,
  };

  const handleClick = (platform: string) => {
    const p = PLATFORMS[platform];
    if (!p) return;
    if (platform === "wechat") {
      alert("请复制链接到微信分享");
      navigator.clipboard?.writeText(shareUrl);
    } else {
      window.open(p.getShareUrl(params), "_blank", "width=600,height=400");
    }
    onShare?.(platform);
  };

  const dims = SIZES[size];
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    ...POSITIONS[position],
    display: "flex",
    flexDirection: "column",
    gap: 6,
    zIndex: 10,
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1)" : "scale(0.8)",
    transition: "all 0.3s ease",
    pointerEvents: "auto",
    ...style,
  };

  const mainBtn: React.CSSProperties = {
    width: dims.button,
    height: dims.button,
    borderRadius: "50%",
    backgroundColor: "#fff",
    border: "2px solid #ddd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    fontSize: dims.icon,
    fontWeight: "bold",
    transition: "all 0.2s ease",
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
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => {
            setVisible(false);
            setOpen(false);
          }}
        />
      )}
      <div style={containerStyle}>
        <div
          style={mainBtn}
          onClick={() => setOpen(!open)}
          title="分享"
        >
          <span>📤</span>
        </div>
        {open &&
          platforms.map((plat, idx) => {
            const p = PLATFORMS[plat];
            if (!p) return null;
            const btn: React.CSSProperties = {
              width: dims.button,
              height: dims.button,
              borderRadius: "50%",
              backgroundColor: p.color,
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              fontSize: dims.icon,
              fontWeight: "bold",
              animation: `shareButtonSlideIn 0.3s ease-out ${idx * 0.05}s both`,
              transition: "all 0.2s ease",
            };
            return (
              <div
                key={plat}
                style={btn}
                onClick={() => handleClick(plat)}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                title={`分享到 ${p.name}`}
              >
                {p.icon}
              </div>
            );
          })}
      </div>
      <style>{KEYFRAMES}</style>
    </>
  );
}

export function createSocialSharePlugin(
  config: SocialSharePluginConfig = {}
): LazyImagePlugin {
  return {
    name: "social-share",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded) return null;
        return <SocialShareOverlay config={config} context={context} />;
      },
    },
  };
}
