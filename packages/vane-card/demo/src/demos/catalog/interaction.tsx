/**
 * 交互组（2 页）：Actions / Hover
 *
 * 这两个是「用户真的会点/会悬停」的地方，也是最容易写出 bug 的地方：
 * 按钮状态要跟总线一致，悬停效果不能挡住点击。
 */
import React from "react";
import type { CardPlugin } from "vane-card";
import { createActionsPlugin, createHoverPlugin } from "vane-card/custom-plugins";
import { Content, useCard } from "../stage";
import { TEE } from "../../data/seed";
import type { DemoLog, DemoEntry } from "../types";

const createBusLogger = (keys: string[], log: DemoLog): CardPlugin => ({
  name: "BusLoggerLocal",
  priority: 0,
  hooks: {
    onMount: (context) => {
      const offs = keys.map((key) =>
        context.bus.on(key, (data) => log(`${key} → ${JSON.stringify(data)}`, "info"))
      );
      return () => offs.forEach((off) => off());
    },
  },
});

// ============ 操作按钮 ============

const actionsPage: DemoEntry = {
  meta: {
    slug: "actions",
    title: "ActionsPlugin：加购 / 收藏",
    group: "interaction",
    plugin: "ActionsPlugin",
    intro: "footer 区两个主按钮。点击先发总线事件（cart:change / wishlist:change），再改卡片状态 —— 顺序很重要，外部监听才能拿到最新值。",
    why: "加购是整张卡的点击目标。它的状态必须和真实购物车一致：重复点不能重复加、成功后要能撤销。",
    plugs: [
      {
        fn: "createActionsPlugin",
        cfg: "showCartButton: true, showWishlistButton: {{wish}}",
        why: "提供两个主操作按钮，并维护「已加入」的视觉状态",
      },
      {
        fn: "createBusLogger",
        why: "页内局部插件：把 cart:change / wishlist:change 抄到日志，验证「先发事件后改状态」",
        local: true,
      },
    ],
    props: ["padding={16}"],
    note: "按钮文案要按状态切换（加入 / 移出）。只改颜色不改文案，用户会以为点失败了。",
    controls: [{ key: "wish", label: "显示收藏", kind: "switch", init: true }],
    children: "      <Content title={product.title} subtitle=\"点按钮：右侧日志会记录事件与状态\" />",
  },
  Stage: ({ cfg, log }) => {
    const Card = useCard([
      createActionsPlugin({
        showCartButton: true,
        showWishlistButton: Boolean(cfg.wish),
      }),
      createBusLogger(["cart:change", "wishlist:change"], log),
    ]);
    return (
      <Card cardId="interaction-actions" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="点按钮：右侧日志会记录事件与状态" />
      </Card>
    );
  },
};

// ============ 悬停 ============

const hoverPage: DemoEntry = {
  meta: {
    slug: "hover",
    title: "HoverPlugin：阴影 / 缩放 / 描边",
    group: "interaction",
    plugin: "HoverPlugin",
    intro: "悬停时给卡片加阴影、轻微放大或描边。它走 transformProps 与 onHover，不改 DOM 结构，也不会吃掉点击。",
    why: "悬停反馈是「这张卡可以点」的最轻提示。但它必须是过渡而不是瞬变，否则鼠标划过一片卡片会像在闪。",
    plugs: [
      {
        fn: "createHoverPlugin",
        cfg: "enableShadow: {{shadow}}, enableScale: {{scale}}",
        why: "提供悬停反馈，并保证缩放不会溢出容器（transform 不改变布局）",
      },
    ],
    props: ["padding={16}"],
    note: "缩放用 transform 而不是改 width —— 改宽高会触发重排，十几张卡同时悬停时会掉帧。",
    controls: [
      { key: "shadow", label: "阴影", kind: "switch", init: true },
      { key: "scale", label: "缩放", kind: "switch", init: true },
    ],
  },
  Stage: ({ cfg, log }) => {
    const Card = useCard([
      createHoverPlugin({
        enableShadow: Boolean(cfg.shadow),
        enableScale: Boolean(cfg.scale),
        shadowIntensity: "medium",
      }),
    ]);
    return (
      <Card
        cardId="interaction-hover"
        data={TEE}
        padding={16}
        onHover={(hovered) => log(`hover → ${hovered}`, "info")}
      >
        <Content title={TEE.title} subtitle="把鼠标移上去再移开" note="悬停只改 transform / box-shadow" />
      </Card>
    );
  },
};

export const INTERACTION_DEMOS: DemoEntry[] = [actionsPage, hoverPage];
