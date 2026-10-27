/**
 * 交易组（8 页）：SKU → 数量 → 价格 → 比价 → 券 → 汇总 → 库存
 *
 * 这一组是「总线协议」的主战场：SKU 是唯一的源（写 sku.selection / sku.variant /
 * sku.price / sku.image），数量写 quantity，券写 coupon.applied，其余插件全是消费者。
 * 每页只装一个插件，正好看清「谁写、谁读」。
 */
import React from "react";
import type { CardPlugin } from "vane-card";
import {
  createComparePricePlugin,
  createCouponPlugin,
  createCouponRecommendPlugin,
  createInventoryPlugin,
  createOrderSummaryPlugin,
  createPriceCalculatorPlugin,
  createQuantityPlugin,
  createSKUPlugin,
} from "vane-card/custom-plugins";
import type { SKUAttribute, SKUVariant } from "vane-card/custom-plugins/SKUPlugin";
import { Content, useCard } from "../stage";
import { skuVariantsOf, TEE } from "../../data/seed";
import type { DemoLog, DemoEntry } from "../types";

/** 页内局部插件：把总线事件抄到右侧日志里（教学用，官方 22 个里没有） */
const createBusLogger = (keys: string[], log: DemoLog): CardPlugin => ({
  name: "BusLoggerLocal",
  priority: 0,
  hooks: {
    onMount: (context) => {
      const offs = keys.map((key) =>
        context.bus.on(key, (data) => log(`${key} → ${JSON.stringify(data)}`, "info"))
      );
      // 返回清理函数：内核在 clear() 时逆序执行，总线订阅不会随卡片卸载而泄漏
      return () => offs.forEach((off) => off());
    },
  },
});

const ATTRS = TEE.attributes as SKUAttribute[];
const VARIANTS = skuVariantsOf(TEE) as SKUVariant[];

// ============ SKU ============

const skuPage: DemoEntry = {
  meta: {
    slug: "sku",
    title: "SKUPlugin：选规格，写总线",
    group: "buy",
    plugin: "SKUPlugin",
    intro: "属性选择器。选中组合命中变体后，把 selection / variant / price / image 四个键写进总线 —— 它是整条交易链唯一的源。",
    why: "多规格商品的「选颜色 → 选尺码 → 价格跟着变」全靠它。其它插件不要自己算规格，读总线就行。",
    plugs: [
      {
        fn: "createSKUPlugin",
        cfg: "attributes: attrs,\n        variants: variants",
        why: "提供属性选择 UI，并把命中的变体写进总线",
      },
      {
        fn: "createBusLogger",
        why: "页内局部插件：把总线写入抄到日志，看清「谁在什么时候写了什么」",
        local: true,
      },
    ],
    props: ["padding={16}"],
    note: "属性没选全就不写 variant —— 此时价格会回退到商品级 price，而不是拿「颜色对了尺码没选」的变体价顶上。",
    children: "      <Content title={product.title} subtitle=\"选完颜色 + 尺码，右侧日志会写出命中的变体\" />",
    dataCode: `// SKU 插件需要两份数据：属性定义 + 变体列表
attributes: [
  { name: "颜色", options: ["赤陶", "橄榄"] },
  { name: "尺码", options: ["M", "L"] },
],
variants: [
  { sku: "TS-RED-M", attrs: { 颜色: "赤陶", 尺码: "M" }, price: 319, stock: 3 },
  { sku: "TS-RED-L", attrs: { 颜色: "赤陶", 尺码: "L" }, price: 319, stock: 12 },
  { sku: "TS-OLIVE-M", attrs: { 颜色: "橄榄", 尺码: "M" }, price: 299, stock: 26 },
  { sku: "TS-OLIVE-L", attrs: { 颜色: "橄榄", 尺码: "L" }, price: 299, stock: 0 },
],`,
  },
  Stage: ({ log }) => {
    const Card = useCard([
      createSKUPlugin({ attributes: ATTRS, variants: VARIANTS }),
      createBusLogger(["sku.selection", "sku.variant", "sku.price"], log),
    ]);
    return (
      <Card cardId="buy-sku" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="选完颜色 + 尺码，右侧日志会写出命中的变体" />
      </Card>
    );
  },
};

// ============ 数量 ============

const quantityPage: DemoEntry = {
  meta: {
    slug: "quantity",
    title: "QuantityPlugin：步进器与库存上限",
    group: "buy",
    plugin: "QuantityPlugin",
    intro: "数量步进器。上限优先取「选中变体的库存」，没有变体才退回商品级 inventory；规格切换时可选择重置到 min。",
    why: "限量 / 秒杀场景里，数量上限算错会直接产生超卖订单 —— 上限必须跟着选中的规格走。",
    plugs: [
      {
        fn: "createQuantityPlugin",
        // 这里刻意不写 max：写死 max 会绕过库存推断（getMax 见到数字就忽略库存），
        // 「上限跟着规格走」正是这个插件存在的理由。要卡死上限再显式传 max。
        cfg: "min: {{min}}, useVariantStock: true,\n        // max 交给库存推断：写死就会绕开库存",
        why: "提供步进器，并在规格切换 / 库存下降时把数量钳回合法区间",
      },
    ],
    props: ["padding={16}", "data={{ ...product, inventory: {{inventory}} }}"],
    note: "不装 SKU 时上限只能取商品级 inventory；这也是工坊里把两者都勾上时提示「上限看起来没生效」的原因。",
    controls: [
      { key: "min", label: "min", kind: "number", init: 1, min: 1, max: 5 },
      { key: "inventory", label: "库存 inventory", kind: "number", init: 12, min: 0, max: 40 },
    ],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createQuantityPlugin({ min: Number(cfg.min), useVariantStock: true }),
    ]);
    return (
      <Card cardId="buy-quantity" data={{ ...TEE, inventory: Number(cfg.inventory) }} padding={16}>
        <Content title={TEE.title} subtitle="拖「库存」到 3 以下：步进器上限会跟着收" />
      </Card>
    );
  },
};

// ============ 价格 ============

const pricePage: DemoEntry = {
  meta: {
    slug: "price",
    title: "PriceCalculatorPlugin：到手价 / 折扣 / 省多少",
    group: "buy",
    plugin: "PriceCalculatorPlugin",
    intro: "读 data.price、总线 sku.price / quantity / coupon.applied，算出到手价、折扣百分比、节省金额。价格区（priceArea）也由它提供。",
    why: "用户只看「到手价」。把原价、折扣、省多少拆成三个插件各自算，迟早会出现三个数字对不上。",
    plugs: [
      {
        fn: "createPriceCalculatorPlugin",
        cfg: "showDiscount: {{discount}}, showSavings: {{savings}}, showTotalPrice: true",
        why: "价格区唯一的决策者：所有价格数字都从它出，别的插件不要再算一遍",
      },
    ],
    props: ["padding={16}", "data={product}"],
    note: "它同时提供 renderPriceArea —— 复合组件的 <ProductCard.Price> 就是靠这个槽位把「单价 / 折扣 / 省多少」拼进一行的。",
    controls: [
      { key: "discount", label: "显示折扣", kind: "switch", init: true },
      { key: "savings", label: "显示节省", kind: "switch", init: true },
    ],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createPriceCalculatorPlugin({
        showDiscount: Boolean(cfg.discount),
        showSavings: Boolean(cfg.savings),
        showTotalPrice: true,
      }),
    ]);
    return (
      <Card cardId="buy-price" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle={`原价 ${TEE.oldPrice} → 现价 ${TEE.price}`} />
      </Card>
    );
  },
};

// ============ 比价 ============

const comparePage: DemoEntry = {
  meta: {
    slug: "compare",
    title: "ComparePricePlugin：外部价格参照",
    group: "buy",
    plugin: "ComparePricePlugin",
    intro: "列出竞品 / 其它渠道价格，标出最低价，并在「比我们便宜」时高亮提醒。数据来自配置，不联网。",
    why: "比价是转化工具，不是装饰。它必须老实 —— 我们比谁贵就得显示贵，否则用户一旦发现就会失去信任。",
    plugs: [
      {
        fn: "createComparePricePlugin",
        cfg: 'competitors: competitors, showLowestPrice: true, highlightLowerThanOurPrice: true',
        why: "渲染比价列表并标出最低价，同时在 priceArea 里放一条「低于本店」提示",
      },
    ],
    props: ["padding={16}"],
    note: "价格来自配置：真实项目里请在服务端算好再下发，不要让前端去抓竞品页面（合规与稳定性都扛不住）。",
    children:
      "      <Content title={product.title} subtitle=\"竞品 288 比本店 299 便宜：会高亮，这是刻意的\" />",
  },
  Stage: () => {
    // 用 useCard 而不是页内 makeCard：makeCard 每次渲染都造新组件类型，日志一更新就整卡重挂
    const Card = useCard([
      createComparePricePlugin({
        competitors: [
          { name: "线下专柜", price: 399 },
          { name: "某电商", price: 288 },
          { name: "官方旗舰", price: 319 },
        ],
        showLowestPrice: true,
        highlightLowerThanOurPrice: true,
        sortBy: "price",
        sortOrder: "asc",
      }),
    ]);
    return (
      <Card cardId="buy-compare" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="竞品 288 比本店 299 便宜：会高亮，这是刻意的" />
      </Card>
    );
  },
};

// ============ 券 ============

const couponPage: DemoEntry = {
  meta: {
    slug: "coupon",
    title: "CouponPlugin：领券与门槛提示",
    group: "buy",
    plugin: "CouponPlugin",
    intro: "券列表 + 门槛提示 + 领取。领取写入总线 coupon.applied，价格与汇总插件据此重算。",
    why: "「差 20 元可用 30 元券」是最有效的凑单提示；但门槛判断必须和价格计算用同一份合计，否则会出现「领了却说不能用」。",
    plugs: [
      {
        fn: "createCouponPlugin",
        cfg: "coupons: coupons",
        why: "渲染券列表、判断门槛，并把可用券写进总线",
      },
      {
        fn: "createBusLogger",
        why: "页内局部插件：订阅 coupon.applied，看清领取动作真的改了总线",
        local: true,
      },
    ],
    props: ["padding={16}"],
    note: "券的 discount 是「金额」不是「百分比」；minAmount 未达时按钮禁用并显示差额，不要偷偷把价格改低来「凑」。",
    children: "      <Content title={product.title} subtitle=\"点右侧「领取」：日志会写出 coupon.applied\" />",
  },
  Stage: ({ log }) => {
    const Card = useCard([
      createCouponPlugin({
        coupons: [
          { code: "NEW30", discount: 30, minAmount: 199, expiry: new Date(Date.now() + 7 * 864e5) },
          { code: "VIP50", discount: 50, minAmount: 399, expiry: new Date(Date.now() + 30 * 864e5) },
          { code: "FREESHIP", discount: 12, minAmount: 99 },
        ],
      }),
      createBusLogger(["coupon.applied"], log),
    ]);
    return (
      <Card cardId="buy-coupon" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="点券上的「领取」：日志会写出 coupon.applied" />
      </Card>
    );
  },
};

// ============ 券推荐 ============

const couponRecommendPage: DemoEntry = {
  meta: {
    slug: "coupon-recommend",
    title: "CouponRecommendPlugin：自动挑最省的那张",
    group: "buy",
    plugin: "CouponRecommendPlugin",
    intro: "从候选券里算出「当前最优」并自动应用，同时在价格区挂一条「已用券」说明；覆盖层有一个可展开的券包。",
    why: "券多了用户不会算。默认帮他用最优的，比让他自己一个个试更能提升转化 —— 但要明确告诉他用了哪张。",
    plugs: [
      {
        fn: "createCouponRecommendPlugin",
        cfg: "coupons: coupons, autoApplyBest: true",
        why: "按当前合计挑最优券、写 coupon.applied，并在 priceArea 说明用了哪张",
      },
    ],
    props: ["padding={16}"],
    note: "autoApplyBest 只做「默认值」，用户手动换券之后不要每次重算又改回去 —— 那会让人觉得「点了没用」。",
    children: "      <Content title={product.title} subtitle=\"券包里 FREESHIP 永远可用、VIP50 门槛 399 未达\" />",
  },
  Stage: () => {
    // 同上：装配类型要稳定，不要每次渲染重建
    const Card = useCard([
      createCouponRecommendPlugin({
        coupons: [
          { code: "NEW30", discount: 30, minAmount: 199 },
          { code: "VIP50", discount: 50, minAmount: 399 },
          { code: "FREESHIP", discount: 12, minAmount: 99 },
        ],
        autoApplyBest: true,
      }),
    ]);
    return (
      <Card cardId="buy-coupon-recommend" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="券包里 FREESHIP 永远可用、VIP50 门槛 399 未达" />
      </Card>
    );
  },
};

// ============ 订单汇总 ============

const summaryPage: DemoEntry = {
  meta: {
    slug: "order-summary",
    title: "OrderSummaryPlugin：合计、运费、税",
    group: "buy",
    plugin: "OrderSummaryPlugin",
    intro: "把「单价 × 数量 − 优惠 + 运费 + 税」算成一份明细。所有输入都来自总线，它只负责算与展示。",
    why: "结算区的合计必须只有一处计算。散在各处时，最典型的 bug 就是「明细加起来和合计对不上」。",
    plugs: [
      {
        fn: "createOrderSummaryPlugin",
        cfg: "showBreakdown: true, shippingFee: {{shipping}}, taxRate: 0.06",
        why: "统一算合计并给出明细行，避免每个页面各写一遍",
      },
    ],
    props: ["padding={16}"],
    note: "税与运费都是配置项：真实项目应从服务端拿，前端只做展示；这里给固定值是为了让示例稳定可复现。",
    controls: [{ key: "shipping", label: "运费", kind: "number", init: 12, min: 0, max: 30, step: 2 }],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createOrderSummaryPlugin({
        showBreakdown: true,
        showShipping: true,
        shippingFee: Number(cfg.shipping),
        taxRate: 0.06,
      }),
    ]);
    return (
      <Card cardId="buy-summary" data={TEE} padding={16}>
        <Content title={TEE.title} subtitle="合计 = 单价 × 数量 − 优惠 + 运费 + 税" />
      </Card>
    );
  },
};

// ============ 库存 ============

const inventoryPage: DemoEntry = {
  meta: {
    slug: "inventory",
    title: "InventoryPlugin：低库存 / 售罄覆盖层",
    group: "buy",
    plugin: "InventoryPlugin",
    intro: "按库存量分三档：充足 / 低库存（≤ 阈值）/ 售罄。低库存给紧迫感，售罄则直接盖一层「已售罄」。",
    why: "把「还剩 3 件」写成营销话术很容易，但库存是事实：阈值必须是可配的，售罄时不能让用户还能加购。",
    plugs: [
      {
        fn: "createInventoryPlugin",
        cfg: "lowStockThreshold: {{threshold}}, showOverlayWhenSoldOut: true",
        why: "按阈值渲染库存提示，售罄时叠加覆盖层挡住加购入口",
      },
    ],
    props: ["padding={16}", "data={{ ...product, inventory: {{stock}} }}"],
    note: "库存取 data.inventory；有选中变体时优先用变体库存 —— 所以这页拖「库存」比拖别的更直观。",
    controls: [
      { key: "stock", label: "库存", kind: "number", init: 4, min: 0, max: 30 },
      { key: "threshold", label: "低库存阈值", kind: "number", init: 10, min: 1, max: 20 },
    ],
  },
  Stage: ({ cfg }) => {
    const Card = useCard([
      createInventoryPlugin({
        lowStockThreshold: Number(cfg.threshold),
        showOverlayWhenSoldOut: true,
      }),
    ]);
    return (
      <Card cardId="buy-inventory" data={{ ...TEE, inventory: Number(cfg.stock) }} padding={16}>
        <Content title={TEE.title} subtitle="把库存拖到 0：覆盖层会盖住整张卡" />
      </Card>
    );
  },
};

export const BUY_DEMOS: DemoEntry[] = [
  skuPage,
  quantityPage,
  pricePage,
  comparePage,
  couponPage,
  couponRecommendPage,
  summaryPage,
  inventoryPage,
];
