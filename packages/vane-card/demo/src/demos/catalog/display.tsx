/**
 * 展示组（5 页）：Badge / UserTag / Countdown / Review / Animation
 *
 * 都往「卡片的空白处」写东西：角标与标签走 overlay，评价走 footer，
 * 入场动画直接改容器。所以这一组最需要的是「位置」与「别打架」。
 */
import React from "react";
import {
  createAnimationPlugin,
  createBadgePlugin,
  createCountdownPlugin,
  createReviewPlugin,
  createUserTagPlugin,
} from "vane-card/custom-plugins";
import { Content, makeCard, useCard } from "../stage";
import { TEE, MUG } from "../../data/seed";
import type { DemoEntry } from "../types";

// ============ 角标 ============

const BADGE_TYPES = [
  { label: "premium 甄选", value: "premium" },
  { label: "hot 热卖", value: "hot" },
  { label: "new 新品", value: "new" },
  { label: "sale 特惠", value: "sale" },
];

const badgePage: DemoEntry = {
  meta: {
    slug: "badge",
    title: "BadgePlugin：四角角标",
    group: "display",
    plugin: "BadgePlugin",
    intro: "在 overlay 层画一个角标，四角可选、四种预设语义色。它不吃鼠标事件，不会挡住下面的加购按钮。",
    why: "「甄选 / 新品 / 特惠」这类标签是运营位，应该由运营配置决定，而不是写死在卡片模板里。",
    plugs: [
      {
        fn: "createBadgePlugin",
        cfg: 'text: "{{text}}", type: "{{type}}", position: "{{position}}"',
        why: "把运营标签画在角上，且不拦截点击",
      },
    ],
    props: ["padding={0}"],
    note: "overlay 层是 pointer-events: none，只有角标本身可点；否则整张卡会被这层盖住，加购按钮点不动。",
    controls: [
      { key: "text", label: "文案", kind: "select", init: "甄选", options: [
        { label: "甄选", value: "甄选" },
        { label: "限时", value: "限时" },
        { label: "仅此一件", value: "仅此一件" },
      ] },
      { key: "type", label: "语义", kind: "select", init: "premium", options: BADGE_TYPES },
      {
        key: "position",
        label: "位置",
        kind: "select",
        init: "top-left",
        options: [
          { label: "左上", value: "top-left" },
          { label: "右上", value: "top-right" },
          { label: "左下", value: "bottom-left" },
          { label: "右下", value: "bottom-right" },
        ],
      },
    ],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createBadgePlugin({
        text: String(cfg.text),
        type: cfg.type as "premium" | "hot" | "new" | "sale",
        position: cfg.position as "top-left" | "top-right" | "bottom-left" | "bottom-right",
      }),
    ]);
    return (
      <Card cardId="display-badge" data={TEE} padding={0}>
        <Content title={TEE.title} subtitle="角标在 overlay 层，不吃点击" />
      </Card>
    );
  },
};

// ============ 用户标签 ============

const userTagPage: DemoEntry = {
  meta: {
    slug: "user-tag",
    title: "UserTagPlugin：会员 / 复购标签",
    group: "display",
    plugin: "UserTagPlugin",
    intro: "一排细标签，表达「这个人和这件商品的关系」：会员等级、复购次数、收藏夹分组。超量按 maxTags 截断。",
    why: "个性化提示比通用标签有效得多，但一屏不能超过 2–3 个 —— 多了就变成噪音。maxTags 就是那个保险丝。",
    plugs: [
      {
        fn: "createUserTagPlugin",
        cfg: 'tags: tags, maxTags: {{max}}',
        why: "把用户维度的标签画在卡片上，并按 maxTags 截断",
      },
    ],
    props: ["padding={16}"],
    note: "标签颜色建议由数据侧给（与会员体系一致），不要在前端按 label 做 if 判断 —— 加一个等级就要改一次代码。",
    controls: [{ key: "max", label: "maxTags", kind: "number", init: 2, min: 1, max: 4 }],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createUserTagPlugin({
        tags: [
          { label: "88VIP", color: "#b4553c" },
          { label: "回购 3 次", color: "#6b7245" },
          { label: "江浙沪次日达", color: "#5a6f8c" },
          { label: "已收藏 12 天", color: "#8c6f5a" },
        ],
        maxTags: Number(cfg.max),
      }),
    ]);
    return (
      <Card cardId="display-user-tag" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="拖 maxTags：多出来的标签会被截掉（不是换行）" />
      </Card>
    );
  },
};

// ============ 倒计时 ============

const countdownPage: DemoEntry = {
  meta: {
    slug: "countdown",
    title: "CountdownPlugin：秒杀倒计时",
    group: "display",
    plugin: "CountdownPlugin",
    intro: "从 durationMs 或 endTimestamp 起算，每秒更新一次；到 0 就停在那里，不会出现负数。",
    why: "促销都有截止时间。倒计时的价值是「让人现在决定」，但时间必须是服务端给的，不能按客户端时钟随便算。",
    plugs: [
      {
        fn: "createCountdownPlugin",
        cfg: "durationMs: {{minutes}} * 60 * 1000, prefix: \"⏰\"",
        why: "在 overlay 上画倒计时，并按秒节流重渲染",
      },
    ],
    props: ["padding={0}"],
    note: "priority 40；它每秒重渲染自身，不要让它和 AnimationPlugin 同时改容器过渡（会互相打断）。",
    controls: [{ key: "minutes", label: "剩余分钟", kind: "number", init: 180, min: 1, max: 360, step: 10 }],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createCountdownPlugin({ durationMs: Number(cfg.minutes) * 60 * 1000, prefix: "⏰" }),
    ]);
    return (
      <Card cardId="display-countdown" data={TEE} padding={0}>
        <Content title={TEE.title} subtitle="改「剩余分钟」会重挂计时器，重新开始走" />
      </Card>
    );
  },
};

// ============ 评价 ============

const reviewPage: DemoEntry = {
  meta: {
    slug: "review",
    title: "ReviewPlugin：星级与评价数",
    group: "display",
    plugin: "ReviewPlugin",
    intro: "读 data.rating / ratingCount 渲染星级与条数；enableUserReview 打开后可以点星写评价。",
    why: "评分是决策依据。它必须来自真实数据（哪怕只有 3 条），不能让前端默认给 5 星 —— 那是骗。",
    plugs: [
      {
        fn: "createReviewPlugin",
        cfg: "showRating: true, showReviewCount: true",
        why: "把评分与评价数放进 footer，保持「价格下面紧跟口碑」的阅读顺序",
      },
    ],
    props: ["padding={16}", "data={{ ...product, rating: {{rating}}, ratingCount: 1284 }}"],
    note: "未评分（0 条）时按 0 显示而不是藏起来 —— 藏起来会让「新品」看起来像「没人买」。",
    controls: [{ key: "rating", label: "评分", kind: "number", init: 4.6, min: 0, max: 5, step: 0.1 }],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createReviewPlugin({ showRating: true, showReviewCount: true }),
    ]);
    return (
      <Card
        cardId="display-review"
        data={{ ...TEE, rating: Number(cfg.rating) }}
        padding={16}
      >
        <Content title={TEE.title} subtitle="拖「评分」：星会跟着变，评价数不变" />
      </Card>
    );
  },
};

// ============ 入场动画 ============

const animationPage: DemoEntry = {
  meta: {
    slug: "animation",
    title: "AnimationPlugin：入场淡入上移",
    group: "display",
    plugin: "AnimationPlugin",
    intro: "挂载后 100ms 开始，500ms 内从「透明 + 下移 20px」走到位。卸载时复原内联样式，容器被复用也不会「消失」。",
    why: "列表里一次出现十几张卡时，轻微入场能让视线有落点。但它必须在 prefers-reduced-motion 下自动关闭。",
    plugs: [
      {
        fn: "createAnimationPlugin",
        why: "提供入场动画，并处理好定时器清理与减弱动效偏好",
      },
    ],
    props: ["padding={0}"],
    note: "点「重新入场」会换 key 强制重挂 —— 这是看动画最省事的办法，也顺便验证了清理逻辑（旧定时器不会残留）。",
    controls: [{ key: "replay", label: "重新入场", kind: "switch", init: false, nonLayout: true }],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([createAnimationPlugin()]);
    // replay 作为 key：切换即重挂，动画重跑
    return (
      <Card key={String(cfg.replay)} cardId="display-animation" data={MUG} padding={0}>
        <Content title={MUG.title} subtitle="每次重挂都会淡入 —— 老定时器不会留下半透明容器" />
      </Card>
    );
  },
};

export const DISPLAY_DEMOS: DemoEntry[] = [
  badgePage,
  userTagPage,
  countdownPage,
  reviewPage,
  animationPage,
];
