import React from "react";
import { useProductCard } from "../ProductCard";

export type VariantImage = {
  id?: string; // 可选：与 SKU 或属性值关联
  url: string;
  label?: string;
  available?: boolean;
};

export type VariantMediaSwitcherProps = {
  className?: string;
  style?: React.CSSProperties;
  layout?: "horizontal" | "vertical";
  thumbnailSize?: "small" | "medium" | "large";
  aspectRatio?: string; // 例如 "4 / 3"、"1 / 1"
  showBorder?: boolean;
  images?: string[]; // 直接传入图片列表
  variantImages?: VariantImage[]; // 传入带标注的图片列表
  enableManualSwitch?: boolean; // 是否允许点击缩略图手动切换
  getImageForSelected?: (selectedSKU: any, data: any) => string | undefined; // 根据选中规格返回主图
  onMediaChange?: (url: string) => void;
};

export const VariantMediaSwitcher: React.FC<VariantMediaSwitcherProps> = ({
  className = "",
  style,
  layout = "horizontal",
  thumbnailSize = "medium",
  aspectRatio = "4 / 3",
  showBorder = true,
  images,
  variantImages,
  enableManualSwitch = true,
  getImageForSelected,
  onMediaChange,
}) => {
  const { data, state } = useProductCard();
  const [manualUrl, setManualUrl] = React.useState<string | null>(null);

  // 当选中规格变化时，取消手动覆盖，跟随规格主图
  React.useEffect(() => {
    setManualUrl(null);
  }, [state.attributes]);

  // 推导主图 URL
  const mainUrl = React.useMemo(() => {
    if (manualUrl) return manualUrl;

    let url: string | undefined;
    // 1) 根据选中规格计算
    const attrs = state.attributes || {};
    const variants: any[] | undefined = (data?.variants && Array.isArray(data.variants)) ? data.variants : undefined;
    const selected = variants && Object.keys(attrs).length
      ? variants.find((v) => {
          const opts = (v.options || v.attributes) || {};
          return Object.keys(attrs).every((k) => String(opts[k]) === String((attrs as any)[k]));
        })
      : undefined;

    if (!url && getImageForSelected) {
      url = getImageForSelected(selected, data);
    }
    // 2) 选中变体自身的 image/media 字段
    if (!url) {
      url = (selected as any)?.image || (selected as any)?.media || undefined;
    }
    // 3) 若传入了 variantImages 且 id 匹配 sku，则采用
    if (!url && (selected as any)?.sku && Array.isArray(variantImages)) {
      const match = variantImages.find(v => v.id && v.id === (selected as any)?.sku);
      if (match) url = match.url;
    }
    // 4) 回退到 props.images 或商品主图
    return url || (images?.[0] ?? (data?.image as string | undefined) ?? "");
  }, [manualUrl, getImageForSelected, state.attributes, images, variantImages, data?.image]);

  // 通知外部主图变化
  React.useEffect(() => {
    if (mainUrl) onMediaChange?.(mainUrl);
  }, [mainUrl, onMediaChange]);

  const isVideo = (u: string) => /\.mp4(\?|$)/i.test(u);

  const sizeStyles = (() => {
    switch (thumbnailSize) {
      case "small":
        return { w: 44, h: 44 };
      case "large":
        return { w: 72, h: 72 };
      default:
        return { w: 56, h: 56 };
    }
  })();

  const list: VariantImage[] = React.useMemo(() => {
    if (variantImages && variantImages.length) return variantImages;
    if (images && images.length) return images.map(u => ({ url: u }));
    const fallback = (data?.image as string | undefined) ?? "";
    return fallback ? [{ url: fallback }] : [];
  }, [variantImages, images, data?.image]);

  const containerStyles: React.CSSProperties = {
    display: "grid",
    gap: 12,
    gridTemplateColumns: layout === "horizontal" ? "1fr" : `auto 1fr`,
    alignItems: "start",
    ...style,
  };

  const mainStyles: React.CSSProperties = {
    width: "100%",
    aspectRatio,
    borderRadius: 8,
    overflow: "hidden",
    border: showBorder ? "1px solid #eee" : "none",
    background: "#fafafa",
  };

  const thumbWrapStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: layout === "horizontal" ? "row" : "column",
    gap: 8,
  };

  const thumbStyles: React.CSSProperties = {
    width: sizeStyles.w,
    height: sizeStyles.h,
    borderRadius: 6,
    overflow: "hidden",
    border: showBorder ? "1px solid #eee" : "none",
    cursor: enableManualSwitch ? "pointer" : "default",
    position: "relative",
    background: "#fff",
  };

  return (
    <div className={`variant-media-switcher ${className}`} style={containerStyles}>
      {/* 缩略图列表（竖排时在左侧，横排时在上方） */}
      {layout === "vertical" && (
        <div className="vms-thumbs" style={thumbWrapStyles}>
          {list.map((item, idx) => (
            <button
              key={idx}
              type="button"
              style={thumbStyles}
              onClick={() => enableManualSwitch && setManualUrl(item.url)}
              title={item.label ?? "切换主图"}
              disabled={item.available === false}
            >
              {isVideo(item.url) ? (
                <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#000", color: "#fff", fontSize: 10 }}>
                  ▶ 视频
                </div>
              ) : (
                <img src={item.url} alt={item.label ?? `缩略图-${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {item.available === false && (
                <span style={{ position: "absolute", inset: 0, background: "#fff8", display: "grid", placeItems: "center", color: "#d0021b", fontSize: 10 }}>不可用</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 主媒体区域 */}
      <div className="vms-main" style={mainStyles}>
        {mainUrl ? (
          isVideo(mainUrl) ? (
            <video src={mainUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} controls />
          ) : (
            <img src={mainUrl} alt={data?.title ?? "主图"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#999" }}>暂无主图</div>
        )}
      </div>

      {/* 缩略图列表（横排时在底部） */}
      {layout === "horizontal" && (
        <div className="vms-thumbs" style={thumbWrapStyles}>
          {list.map((item, idx) => (
            <button
              key={idx}
              type="button"
              style={thumbStyles}
              onClick={() => enableManualSwitch && setManualUrl(item.url)}
              title={item.label ?? "切换主图"}
              disabled={item.available === false}
            >
              {isVideo(item.url) ? (
                <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#000", color: "#fff", fontSize: 10 }}>
                  ▶ 视频
                </div>
              ) : (
                <img src={item.url} alt={item.label ?? `缩略图-${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {item.available === false && (
                <span style={{ position: "absolute", inset: 0, background: "#fff8", display: "grid", placeItems: "center", color: "#d0021b", fontSize: 10 }}>不可用</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};