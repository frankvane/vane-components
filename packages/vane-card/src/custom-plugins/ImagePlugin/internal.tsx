import React from "react";

export interface CardImageProps {
  src: string;
  alt: string;
  lazyLoad: boolean;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

/** 模块级组件：状态与组件身份都稳定，不在渲染函数里造组件 */
export const CardImage: React.FC<CardImageProps> = ({
  src,
  alt,
  lazyLoad,
  placeholder,
  errorFallback,
}) => {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "failed">(
    "loading"
  );

  // src 变化后重置状态：否则一次加载失败会永久停在 failed，换成有效图片也恢复不了（P2-7）
  React.useEffect(() => {
    setStatus("loading");
  }, [src]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        overflow: "hidden",
        borderRadius: "8px 8px 0 0",
        background: "#f5f5f5",
      }}
      data-image-state={status}
    >
      {status === "loading" && placeholder ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {placeholder}
        </div>
      ) : null}
      {/* failed 时仍保留 <img>（透明度 0）：换新 src 后能重新加载恢复 */}
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: status === "loaded" ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
        loading={lazyLoad ? "lazy" : "eager"}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("failed")}
      />
      {status === "failed" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          data-image-state-fallback="true"
        >
          {errorFallback ?? null}
        </div>
      ) : null}
    </div>
  );
};
