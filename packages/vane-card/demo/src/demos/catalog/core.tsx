/**
 * Core 内核页（3 页）：props / ref 契约 / 生命周期
 *
 * 这三页一个插件都不装 —— 目的就是让人看见「Core 自己只有什么」：
 * 容器、padding、layout、四个回调、一个 ref。所有视觉效果都来自插件。
 */
import React, { useRef, useState } from "react";
import { CardCore, type CardCoreRef } from "vane-card";
import { Content } from "../stage";
import { TEE } from "../../data/seed";
import type { DemoEntry } from "../types";

const propsPage: DemoEntry = {
  meta: {
    slug: "core-props",
    title: "Core props 与容器",
    group: "core",
    capability: "core-props",
    intro: "CardCore 的全部视觉相关 props：layout 方向、padding、containerStyle。没有插件时卡片只剩你传进去的内容。",
    why: "需要一张「有生命周期和 ref、但没有预设立场」的容器时用它 —— 比如后台的详情面板、自研卡片的底座。",
    plugs: [],
    props: ["layout=\"{{layout}}\"", "padding={ {{padding}} }", "onClick={handleClick}"],
    note: "padding 是四边同值或 { top, right, bottom, left }；它会被算进容器盒模型，overlay 插件定位时依赖这一点。",
    controls: [
      {
        key: "layout",
        label: "布局方向",
        kind: "select",
        init: "vertical",
        options: [
          { label: "vertical 竖排", value: "vertical" },
          { label: "horizontal 横排", value: "horizontal" },
        ],
      },
      { key: "padding", label: "padding", kind: "number", init: 16, min: 0, max: 32, step: 2 },
    ],
    dataCode: `// Core 不读 data 的字段，它只把 data 原样交给 renderContent / 插件
{
  title: "经典圆领 T 恤 · 260g 长绒棉",
  price: 299,
}`,
  },
  Stage: ({ cfg }) => (
    <CardCore
      cardId="core-props"
      data={TEE}
      layout={cfg.layout as "vertical" | "horizontal"}
      padding={Number(cfg.padding)}
      renderContent={(data: { title?: string; subtitle?: string }) => (
        <Content title={data.title} subtitle={data.subtitle} note="这段内容来自 renderContent" />
      )}
    />
  ),
};

const refPage: DemoEntry = {
  meta: {
    slug: "core-ref",
    title: "CardCoreRef 三个方法",
    group: "core",
    capability: "core-ref",
    intro: "getContainer / getSize / forceUpdate 三个方法。点按钮，右边日志会写出真实的 DOM 引用与像素尺寸。",
    why: "外层要做「按卡片尺寸算文案行数」「滚动到这张卡」「外部改了引用数据要它重画」时用 ref，不要靠 setTimeout 猜时机。",
    plugs: [],
    props: ["ref={cardRef}", "padding={16}"],
    note: "getSize 读的是 offsetWidth/offsetHeight，是布局后的真实值；卡片还没进 DOM 时返回 0。",
    children: "      <Content title=\"点上面的按钮试 ref 方法\" subtitle=\"容器引用 / 尺寸 / 强制更新\" />",
  },
  Stage: ({ log }) => {
    const ref = useRef<CardCoreRef>(null);
    return (
      <div>
        <CardCore
          ref={ref}
          cardId="core-ref"
          data={TEE}
          padding={16}
          renderContent={() => (
            <Content title="点下面的按钮试 ref 方法" subtitle="容器引用 / 尺寸 / 强制更新" />
          )}
        />
        <div className="stage-tools">
          <button
            type="button"
            className="vc-btn"
            onClick={() => {
              const el = ref.current?.getContainer();
              log(el ? `getContainer() → <div data-card-id="${el.dataset.cardId}">` : "getContainer() → null", el ? "event" : "warn");
            }}
          >
            getContainer()
          </button>
          <button
            type="button"
            className="vc-btn"
            onClick={() => {
              const size = ref.current?.getSize();
              log(size ? `getSize() → ${size.width} × ${size.height}px` : "getSize() → null");
            }}
          >
            getSize()
          </button>
          <button
            type="button"
            className="vc-btn"
            onClick={() => {
              ref.current?.forceUpdate();
              log("forceUpdate() → 已请求重绘");
            }}
          >
            forceUpdate()
          </button>
        </div>
      </div>
    );
  },
};

const lifecyclePage: DemoEntry = {
  meta: {
    slug: "core-lifecycle",
    title: "生命周期与可见性",
    group: "core",
    capability: "core-lifecycle",
    intro: "Core 的四个回调各自什么时候触发。把「挂载」开关关掉，能看到 unmount 立刻被记录；把卡片滚出视口，可见性会变 false。",
    why: "埋点曝光、懒加载、入场动画都挂在这几个点上。它们必须是「真的触发一次」，而不是每次渲染都触发。",
    plugs: [],
    props: [
      "debug={ {{debug}} }",
      "onMount={() => log(\"mount\")}",
      "onUnmount={() => log(\"unmount\")}",
      "onVisibilityChange={(v) => log(`visible: ${v}`)}",
      "onHover={(h) => log(`hover: ${h}`)}",
    ],
    note: "可见性用 IntersectionObserver（threshold 0.1）判定，只在**跨越阈值**时回调，不是每帧回调。",
    controls: [
      { key: "mounted", label: "挂载", kind: "switch", init: true },
      { key: "debug", label: "debug 日志", kind: "switch", init: false },
    ],
  },
  Stage: ({ cfg, log }) => {
    const [clicks, setClicks] = useState(0);
    return (
      <div>
        {cfg.mounted ? (
          <CardCore
            cardId="core-lifecycle"
            data={TEE}
            padding={16}
            debug={Boolean(cfg.debug)}
            onMount={() => log("onMount → 进入 DOM")}
            onUnmount={() => log("onUnmount → 已离开 DOM", "warn")}
            onVisibilityChange={(visible) => log(`onVisibilityChange → ${visible}`, "info")}
            onHover={(hovered) => log(`onHover → ${hovered}`, "info")}
            onClick={() => {
              setClicks((n) => n + 1);
              log(`onClick → 第 ${clicks + 1} 次`);
            }}
            renderContent={() => (
              <Content title="点我 / 悬停我 / 滚我出视口" subtitle={`已点击 ${clicks} 次`} />
            )}
          />
        ) : (
          <div className="stage-empty">已卸载 —— 看右侧日志里的 onUnmount</div>
        )}
      </div>
    );
  },
};

export const CORE_DEMOS: DemoEntry[] = [propsPage, refPage, lifecyclePage];
