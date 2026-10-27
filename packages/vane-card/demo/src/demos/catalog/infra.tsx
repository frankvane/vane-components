/**
 * 基础设施组（4 页）：State / Analytics / A11y / Responsive
 *
 * 这一组没有「好看的 UI」，但决定了这张卡能不能上生产：
 * 状态是否可预测、埋点是否只报一次、键盘能不能用、窄屏会不会挤爆。
 */
import React from "react";
import {
  createA11yPlugin,
  createActionsPlugin,
  createAnalyticsPlugin,
  createResponsivePlugin,
  createStatePlugin,
} from "vane-card/custom-plugins";
import { Content, useCard } from "../stage";
import { TEE } from "../../data/seed";
import type { DemoEntry } from "../types";

// ============ 状态 ============

const statePage: DemoEntry = {
  meta: {
    slug: "state",
    title: "StatePlugin：状态差分回调",
    group: "infra",
    plugin: "StatePlugin",
    intro: "卡片状态（cart / wishlist / hover / visible）只在**变化时**回调一次。旧版把回调塞在 setState 的 updater 里，导致一次点击触发两次。",
    why: "外部要同步「这张卡已加购」到自己的 store 时，必须依赖稳定的差分回调，而不是猜 setState 什么时候执行。",
    plugs: [
      {
        fn: "createStatePlugin",
        cfg: "enableCart: true,\n        enableWishlist: true,\n        onCartChange: (id, v) => log(`cart → ${v}`),\n        onWishlistChange: (id, v) => log(`wishlist → ${v}`)",
        why: "把状态变化以回调形式交出来（而不是让外部轮询）",
      },
      {
        fn: "createActionsPlugin",
        why: "页内需要一个能改状态的按钮，否则这页没东西可点",
      },
    ],
    props: ["padding={16}"],
    note: "onStateChange 现在在 state 提交后的 effect 里触发：updater 保持纯函数，一次点击只回调一次。",
    children: "      <Content title={product.title} subtitle=\"点「加入购物车」：日志只应出现一次 cart → true\" />",
  },
  Stage: ({ log }) => {
    const Card = useCard([
      createStatePlugin({
        enableCart: true,
        enableWishlist: true,
        onCartChange: (_id, value) => log(`cart → ${value}`, value ? "event" : "warn"),
        onWishlistChange: (_id, value) => log(`wishlist → ${value}`, value ? "event" : "warn"),
      }),
      createActionsPlugin(),
    ]);
    return (
      <Card cardId="infra-state" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="点「加入购物车」：日志只应出现一次 cart → true" />
      </Card>
    );
  },
};

// ============ 埋点 ============

const analyticsPage: DemoEntry = {
  meta: {
    slug: "analytics",
    title: "AnalyticsPlugin：曝光 / 点击 / 状态",
    group: "infra",
    plugin: "AnalyticsPlugin",
    intro: "通过 transport 把曝光、点击、状态变化交给外部上报管道。曝光有最小停留阈值（minExposureMs），闪一下就划走的不算。",
    why: "卡片的转化分析要靠「曝光 → 点击 → 加购」三段漏斗。曝光口径错了，后面全是错的。",
    plugs: [
      {
        fn: "createAnalyticsPlugin",
        cfg: "transport: (event, payload) => log(event),\n        minExposureMs: {{minMs}}",
        why: "统一采集曝光 / 点击 / 状态，并支持替换上报实现（SDK 或自有管道）",
      },
      {
        fn: "createActionsPlugin",
        why: "需要一个能产生 state 变化与点击的入口",
      },
    ],
    props: ["padding={16}"],
    note: "transport 是唯一出口：接第三方 SDK 时不要改插件内部，包一层 transport 即可（也方便做采样与脱敏）。",
    controls: [{ key: "minMs", label: "最小曝光 ms", kind: "number", init: 600, min: 0, max: 2000, step: 100 }],
    children: "      <Content title={product.title} subtitle=\"点卡片 / 点按钮：日志里会看到 view / click / state\" />",
  },
  Stage: ({ cfg, log }) => {
    const Card = useCard([
      createAnalyticsPlugin({
        minExposureMs: Number(cfg.minMs),
        transport: (event, payload) => {
          const brief = JSON.stringify(payload ?? {}).slice(0, 60);
          log(`${event} ${brief}`, "info");
        },
      }),
      createActionsPlugin(),
    ]);
    return (
      <Card cardId="infra-analytics" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="点卡片 / 点按钮：日志里会看到 view / click / state" />
      </Card>
    );
  },
};

// ============ 无障碍 ============

const a11yPage: DemoEntry = {
  meta: {
    slug: "a11y",
    title: "A11yPlugin：语义、键盘、播报",
    group: "infra",
    plugin: "A11yPlugin",
    intro: "给容器补 role=article 与 aria-label，可开 tabindex 与键盘导航，聚焦时把商品名播报给读屏。卸载时逐一移除，不留脏属性。",
    why: "键盘用户靠 tab 走完整页。卡片如果不可聚焦、没有名字，读屏会念成「分组」——等于这张卡不存在。",
    plugs: [
      {
        fn: "createA11yPlugin",
        cfg: "keyboardNavigation: {{keys}}, announceOnFocus: true, highContrast: {{contrast}}",
        why: "补语义与键盘可达性，并在聚焦时播报商品名",
      },
    ],
    props: ["padding={16}"],
    note: "tabindex 是「加在容器上」，所以整张卡只占一个 tab 位；内部按钮仍可单独聚焦。别给每个子元素都加 tabindex，那会让 tab 变成折磨。",
    controls: [
      { key: "keys", label: "键盘导航", kind: "switch", init: true },
      { key: "contrast", label: "高对比", kind: "switch", init: false },
    ],
    children: "      <Content title={product.title} subtitle=\"按 Tab 聚焦这张卡，再按 Enter / 方向键试试\" />",
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createA11yPlugin({
        keyboardNavigation: Boolean(cfg.keys),
        announceOnFocus: true,
        highContrast: Boolean(cfg.contrast),
      }),
      createActionsPlugin(),
    ]);
    return (
      <Card cardId="infra-a11y" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="按 Tab 聚焦这张卡，再按 Enter / 方向键试试" />
      </Card>
    );
  },
};

// ============ 响应式 ============

const responsivePage: DemoEntry = {
  meta: {
    slug: "responsive",
    title: "ResponsivePlugin：按卡片宽度换布局",
    group: "infra",
    plugin: "ResponsivePlugin",
    intro: "跟 viewport 无关 —— 它看的是**卡片自己的宽度**。卡片放到侧栏、弹窗、抽屉里都能自适应，这才是可复用组件该有的行为。",
    why: "同一个商品卡会在主图位、侧栏推荐、移动端抽屉里出现。用媒体查询写死，进弹窗就会「以为自己是桌面」。",
    plugs: [
      {
        fn: "createResponsivePlugin",
        cfg: "breakpoints: { mobile: 360, tablet: 620, desktop: 900 }",
        why: "用 ResizeObserver 量自身宽度，切换 layout 与容器样式",
      },
    ],
    props: ["padding={16}", "containerStyle={{ width: {{width}} }}"],
    note: "阈值以「卡片宽度」为准：拖到 360 以下会变竖排，620 以上变横排（内容在图右侧）。",
    controls: [
      { key: "width", label: "卡片宽度", kind: "number", init: 360, min: 260, max: 860, step: 20 },
    ],
    stageWidth: 900,
  },
  Stage: ({ cfg }) => {
    const Card = useCard([createResponsivePlugin()]);
    return (
      <Card
        cardId="infra-responsive"
        data={TEE}
        padding={16}
        containerStyle={{ width: Number(cfg.width) }}
      >
        <Content title={TEE.title} subtitle={`当前宽度 ${cfg.width}px —— 布局跟着它变`} />
      </Card>
    );
  },
};

export const INFRA_DEMOS: DemoEntry[] = [statePage, analyticsPage, a11yPage, responsivePage];
