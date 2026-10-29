import React from "react";
import { createSkuSelector } from "vane-sku";
import { createImageLinkPlugin } from "vane-sku/custom-plugins/ImageLink";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 05 规格切主图：ImageLink 只发事件（事件型插件，不渲染 UI），主图由外层渲染。
export default function ImageScenario() {
  const [main, setMain] = React.useState(VARIANTS[0].image ?? "");
  const Sku = React.useMemo(
    () => createSkuSelector([createImageLinkPlugin({ onImageChange: setMain })]),
    []
  );
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <img
        data-testid="scenario-main-image"
        src={main}
        alt="主图"
        style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 2, border: "1px solid var(--line)" }}
      />
      <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328", flex: 1 }}>
        <Sku
          attributes={ATTRIBUTES}
          variants={VARIANTS}
          defaultSelection={{ 颜色: "red", 尺码: "s" }}
        />
      </div>
    </div>
  );
}
