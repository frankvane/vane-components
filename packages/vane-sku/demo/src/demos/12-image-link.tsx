import React, { useMemo, useState } from "react";
import { createSkuSelector } from "vane-sku";
import { createImageLinkPlugin } from "vane-sku/custom-plugins/ImageLink";
import type { DemoMeta, DemoStageProps } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

/**
 * 12 · 规格切主图 ImageLink（插件功能）
 * 事件型插件：只发事件（onImageChange 回调 + sku:image 总线），不渲染任何 UI。
 * 主图由外层渲染——本页用 useState 存当前图，左边就是「外层的 gallery」。
 */
export const meta: DemoMeta = {
  slug: "image-link",
  title: "规格切主图 ImageLink",
  group: "plugin",
  plugin: "ImageLink",
  intro: "命中变体带 image 时把图抛给外层（回调 + sku:image 总线双通道），自己不渲染任何 UI；左侧主图由本页外层渲染。",
  why: "规格图联动与「谁来渲染主图」解耦：gallery、卡片、放大镜想怎么接就怎么接，core 不碰图片。",
  plugs: [
    { fn: "createImageLinkPlugin", cfg: "onImageChange: setMainImage", why: "只发事件，主图渲染留给外层" },
  ],
  props: [
    "attributes={attributes}",
    "variants={variants}",
    "defaultSelection={{ 颜色: 'red', 尺码: 's' }}",
  ],
  note: "挂载（onMount）也会推一次当前图，页面打开主图不空窗；未命中或变体没写 image 时不发事件。",
  stageHeight: 300,
};

export default function Stage({ log }: DemoStageProps) {
  const [main, setMain] = useState(VARIANTS[0].image ?? "");

  const Sku = useMemo(
    () =>
      createSkuSelector([
        createImageLinkPlugin({
          onImageChange: (img) => {
            setMain(img);
            log(`主图 → ${img}`);
          },
        }),
      ]),
    [log]
  );

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%" }}>
      <img
        src={main}
        alt="主图"
        style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 2, border: "1px solid var(--line)" }}
      />
      <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328", flex: 1 }}>
        <Sku attributes={ATTRIBUTES} variants={VARIANTS} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
        <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
          换颜色 / 尺码：左图跟着变体走；这就是「发事件的插件 + 接事件的外层」。
        </p>
      </div>
    </div>
  );
}
