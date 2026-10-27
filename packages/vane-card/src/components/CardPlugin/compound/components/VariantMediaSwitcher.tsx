import React from "react";
import { useProductCard } from "../ProductCard";
import { matchVariant, variantListOf } from "../../types/product";
import type { ProductData, ProductVariant } from "../../types/product";

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
  getImageForSelected?: (
    selectedSKU: ProductVariant | undefined,
    data: ProductData | undefined
  ) => string | undefined; // 根据选中规格返回主图
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

    // 1) 根据选中规格计算
    const selected = matchVariant(variantListOf(data), state.attributes);

    let url: string | undefined;
    if (getImageForSelected) {
      url = getImageForSelected(selected, data);
    }
    // 2) 选中变体自身的 image/media 字段
    if (!url) {
      url = selected?.image ?? selected?.media;
    }
    // 3) 若传入了 variantImages 且 id 匹配 sku，则采用
    if (!url && selected?.sku && Array.isArray(variantImages)) {
      const match = variantImages.find((v) => v.id && v.id === selected.sku);
      if (match) url = match.url;
    }
    // 4) 回退到 props.images 或商品主图
    return url || (images?.[0] ?? data?.image ?? "");
  }, [manualUrl, getImageForSelected, state.attributes, images, variantImages, data]);

  // 通知外部主图变化
  React.useEffect(() => {
    if (mainUrl) onMediaChange?.(mainUrl);
  }, [mainUrl, onMediaChange]);

  const isVideo = (u: string) => /\.mp4(\?|$)/i.test(u);

  const sizePx = thumbnailSize === "small" ? 44 : thumbnailSize === "large" ? 72 : 56;

  const list: VariantImage[] = React.useMemo(() => {
    if (variantImages && variantImages.length) return variantImages;
    if (images && images.length) return images.map((u) => ({ url: u }));
    const fallback = data?.image ?? "";
    return fallback ? [{ url: fallback }] : [];
  }, [variantImages, images, data?.image]);

  const thumbBorderClass = showBorder ? "vc-media__thumb--bordered" : "";
  const mainBorderClass = showBorder ? "vc-media__main--bordered" : "";

  const renderThumb = (item: VariantImage, idx: number) => (
    <button
      key={idx}
      type="button"
      className={`vc-media__thumb ${thumbBorderClass} ${
        enableManualSwitch ? "is-clickable" : ""
      }`
        .replace(/\s+/g, " ")
        .trim()}
      // 宽高来自 thumbnailSize，属动态值
      style={{ width: sizePx, height: sizePx }}
      onClick={() => enableManualSwitch && setManualUrl(item.url)}
      title={item.label ?? "切换主图"}
      disabled={item.available === false}
    >
      {isVideo(item.url) ? (
        <div className="vc-media__video-tag">▶ 视频</div>
      ) : (
        <img
          src={item.url}
          alt={item.label ?? `缩略图-${idx + 1}`}
          className="vc-media__fill"
        />
      )}
      {item.available === false && <span className="vc-media__unavailable">不可用</span>}
    </button>
  );

  return (
    <div
      className={`vc-media vc-media--${layout} ${className}`.trim()}
      style={{ ...(aspectRatio ? ({ "--vc-media-ratio": aspectRatio } as React.CSSProperties) : {}), ...style }}
    >
      {/* 缩略图列表（竖排时在左侧，横排时在上方） */}
      {layout === "vertical" && (
        <div className="vc-media__thumbs vc-media__thumbs--vertical">
          {list.map(renderThumb)}
        </div>
      )}

      {/* 主媒体区域 */}
      <div className={`vc-media__main ${mainBorderClass}`.trim()}>
        {mainUrl ? (
          isVideo(mainUrl) ? (
            <video src={mainUrl} className="vc-media__fill" controls />
          ) : (
            <img src={mainUrl} alt={data?.title ?? "主图"} className="vc-media__fill" />
          )
        ) : (
          <div className="vc-media__empty">暂无主图</div>
        )}
      </div>

      {/* 缩略图列表（横排时在底部） */}
      {layout === "horizontal" && <div className="vc-media__thumbs">{list.map(renderThumb)}</div>}
    </div>
  );
};