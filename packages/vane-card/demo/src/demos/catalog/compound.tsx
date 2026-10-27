/**
 * 复合组件组（13 页）：ProductCard 与它的 38 个子组件
 *
 * 与插件页的分工：
 *  - 插件页回答「装一个行为要付什么代价」；
 *  - 复合组件页回答「一个真实的商详卡长什么样」。
 *
 * 复合组件全部通过 `useProductCard()` 读同一份 data，所以这里的 `data` 是唯一的
 * 内容来源；子组件不传 props 时一律回退到 data（这正是「少写样板」的价值）。
 */
import React from "react";
import { ProductCard } from "vane-card/compound";
import { createPriceCalculatorPlugin, createSKUPlugin } from "vane-card/custom-plugins";
import type { SKUAttribute, SKUVariant } from "vane-card/custom-plugins/SKUPlugin";
import { MUG, skuVariantsOf, TEE } from "../../data/seed";
import type { DemoEntry } from "../types";

const ATTRS = TEE.attributes as SKUAttribute[];
const VARIANTS = skuVariantsOf(TEE) as SKUVariant[];

/** 复合组件页的公共包装：去掉 demo 侧的额外留白，让卡片自己排版 */
function StageCard({ children }: { children: React.ReactNode }) {
  return (
    <ProductCard productId="compound-demo" data={TEE}>
      {children}
    </ProductCard>
  );
}

// 1 · 基础版式
const basicPage: DemoEntry = {
  meta: {
    slug: "pc-basic",
    title: "ProductCard 基础版式",
    group: "compound",
    capability: "compound",
    intro: "六行子组件拼出一张完整列表卡：图、标题、副标题、价格、划线价、标签。子组件不传 props，全部回退到 data。",
    why: "90% 的列表卡就是这个结构。先确认「不给 props 也能渲染」，再按需覆盖个别字段。",
    plugs: [],
    props: ["<ProductCard data={product}>", "  <ProductCard.Image />", "  <ProductCard.Title />"],
    note: "子组件的顺序 = 视觉顺序，没有隐式排序；想调换价格与标题的位置，直接调换两行即可。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Image />
      <ProductCard.Title />
      <ProductCard.Subtitle />
      <ProductCard.Price />
      <ProductCard.OldPrice />
      <ProductCard.Tags />
    </StageCard>
  ),
};

// 2 · 价格区
const pricePage: DemoEntry = {
  meta: {
    slug: "pc-price",
    title: "价格区：现价 / 划线价 / 折扣 / 节省",
    group: "compound",
    capability: "compound-price",
    intro: "四个价格相关组件并排。<Price> 是价格区的锚点 —— 插件通过 priceArea 槽位把「省多少 / 单位价」挂进它内部。",
    why: "价格区是转化核心，也是最容易「三个数字互相矛盾」的地方。用同一份 data + 同一个槽位，矛盾就消失了。",
    plugs: [],
    props: ["<ProductCard.Price />", "<ProductCard.OldPrice />", "<ProductCard.Discount percent={25} />"],
    note: "Discount 可以显式给 percent；不给时按 oldPrice / price 自己算，避免手写 25 这种会和数据脱节的常量。",
    dataCode: `// 价格区读这三个字段（缺哪个就少一行）
{
  price: 299,
  oldPrice: 399,
  weightGram: 260,   // PricePerUnit 用：算「每 100g 多少钱」
}`,
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Title />
      <ProductCard.Price />
      <ProductCard.OldPrice />
      <ProductCard.Discount />
      <ProductCard.SavingsBadge />
      <ProductCard.PricePerUnit unitLabel="每 100g" totalGram={260} />
    </StageCard>
  ),
};

// 3 · 规格选择
const optionsPage: DemoEntry = {
  meta: {
    slug: "pc-options",
    title: "规格选择：色板 / 尺码 / 通用属性",
    group: "compound",
    capability: "compound-options",
    intro: "三种选规格的写法：色板（带颜色）、尺码（一排数字字母）、通用属性选择器。它们都写 ProductCard 的本地 state。",
    why: "颜色要看色块、尺码要看尺码表、其它属性（材质/容量）只能给一排按钮 —— 三种交互不该硬塞进一个组件。",
    plugs: [],
    props: ["<ProductCard.ColorSwatches attributeName=\"颜色\" />", "<ProductCard.SizeSelector sizes={[\"M\",\"L\"]} />"],
    note: "这些组件写的是复合组件自己的 state（attributes），不是插件总线。要联动价格请用 SKU 插件，见「价格区接缝」页。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Image />
      <ProductCard.Title />
      <ProductCard.ColorSwatches attributeName="颜色" />
      <ProductCard.SizeSelector sizes={["M", "L", "XL"]} attributeName="尺码" />
      <ProductCard.OptionPicker name="材质" options={["纯棉", "混纺", "天丝"]} />
      <ProductCard.SelectedInfo />
    </StageCard>
  ),
};

// 4 · 库存与规格信息
const stockPage: DemoEntry = {
  meta: {
    slug: "pc-stock",
    title: "库存 / 编码 / 参数表",
    group: "compound",
    capability: "compound-stock",
    intro: "库存徽章按阈值变色、SKU 编码补前缀、参数表支持对象或数组两种形态。都是「不显眼但缺了会被问」的信息。",
    why: "商详页的信任感来自细节：还剩几件、什么编码、什么材质。缺一项，用户就会去问客服。",
    plugs: [],
    props: ["<ProductCard.StockBadge showQuantity />", "<ProductCard.SpecsTable />"],
    note: "SpecsTable 的 specs 支持 `{ 材质: \"纯棉\" }` 或 `[{ key, value }]` —— 两种历史数据的形态都认，不必在业务层先做转换。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Title />
      <ProductCard.StockBadge showQuantity lowStockThreshold={10} />
      <ProductCard.Inventory threshold={10} />
      <ProductCard.SKUCode prefix="SKU" />
      <ProductCard.SpecsTable />
    </StageCard>
  ),
};

// 5 · 操作区
const actionsPage: DemoEntry = {
  meta: {
    slug: "pc-actions",
    title: "操作区：加购 + 数量",
    group: "compound",
    capability: "compound-actions",
    intro: "数量步进 + 主按钮。 QuantityStepper 的上限会读选中规格的库存，Actions 的主按钮状态跟 cart 走。",
    why: "商详的最后一屏就是「买几个 + 加购」。这两个控件必须能互相看见：数量超库存时按钮要禁用。",
    plugs: [],
    props: ["<ProductCard.QuantityStepper min={1} />", "<ProductCard.Actions />"],
    note: "Actions 只负责交互与状态，真正下单是业务回调；组件不内置任何请求。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Image />
      <ProductCard.Title />
      <ProductCard.Price />
      <ProductCard.QuantityStepper min={1} />
      <ProductCard.Actions />
    </StageCard>
  ),
};

// 6 · 券与汇总
const couponPage: DemoEntry = {
  meta: {
    slug: "pc-coupon",
    title: "券条与订单汇总",
    group: "compound",
    capability: "compound-coupon",
    intro: "券条横向铺开、超出折叠；汇总面板给明细行。两者都读 ProductCard 的 state，不各自算一遍价格。",
    why: "「能领几张券」和「最后花多少钱」必须在同一屏给出，中间隔一次跳转就会流失。",
    plugs: [],
    props: [
      "<ProductCard.CouponBar layout=\"horizontal\" maxVisible={2} />",
      "<ProductCard.OrderSummaryPanel showTax />",
    ],
    note: "CouponBar 的 onCouponApply 是业务回调：组件不决定券能不能用，只用 disabled 表达结论 —— 规则留在服务端。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Title />
      <ProductCard.Price />
      <ProductCard.CouponBar
        layout="horizontal"
        maxVisible={2}
        showExpiry
        coupons={[
          { id: "c1", title: "新客立减 30", discount: 30, discountType: "amount", minAmount: 199, code: "NEW30" },
          { id: "c2", title: "满 399 减 50", discount: 50, discountType: "amount", minAmount: 399, code: "VIP50" },
          { id: "c3", title: "免运费", discount: 12, discountType: "amount", minAmount: 99, code: "FREESHIP" },
        ]}
      />
      <ProductCard.OrderSummaryPanel showTax showShipping taxRate={0.06} shippingFee={12} />
    </StageCard>
  ),
};

// 7 · 物流
const shippingPage: DemoEntry = {
  meta: {
    slug: "pc-shipping",
    title: "物流：文案 / 运费估算 / 时效轴",
    group: "compound",
    capability: "compound-shipping",
    intro: "三件物流相关组件：一句文案、一个可交互的运费估算（选地区 + 选方式）、一条交货时间轴（可跳周末）。",
    why: "运费是弃单第一大原因。把「发到哪儿、多少钱、几天到」放在加购之前，比事后解释便宜得多。",
    plugs: [],
    props: ["<ProductCard.ShippingEstimator regions={regions} methods={methods} />"],
    note: "DeliveryTimeline 的 etaDays 是「工作日」还是「自然日」必须和物流口径一致；这里按自然日算，周末不跳过。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Title />
      <ProductCard.Shipping info="江浙沪次日达 · 满 199 包邮" />
      <ProductCard.ShippingEstimator
        regions={[
          { code: "ZJ", name: "浙江", baseFee: 8, extraPerKg: 2, etaDays: 1 },
          { code: "BJ", name: "北京", baseFee: 12, extraPerKg: 4, etaDays: 3 },
          { code: "XJ", name: "新疆", baseFee: 22, extraPerKg: 12, etaDays: 6 },
        ]}
        methods={[
          { code: "std", name: "标准快递", multiplier: 1 },
          { code: "exp", name: "顺丰特快", multiplier: 2.4, etaOffset: -1 },
        ]}
        weightKg={0.5}
        showBreakdown
      />
      <ProductCard.DeliveryTimeline etaDays={3} showDates />
    </StageCard>
  ),
};

// 8 · 售后
const servicePage: DemoEntry = {
  meta: {
    slug: "pc-service",
    title: "售后：退换政策与保修",
    group: "compound",
    capability: "compound-service",
    intro: "政策组件把「几天内可退、谁付运费、什么条件不退」讲清楚；保修组件是一句话 + 详情链接。",
    why: "售后条款写在角落没人看，但真出事时它就是信任的来源。结构化表达能让客服少回答一半问题。",
    plugs: [],
    props: ["<ProductCard.ReturnPolicy windowDays={7} />", "<ProductCard.Warranty info=\"一年质保\" />"],
    note: "窗口期与免运费门槛都是显式 props：不要从文案里正则解析「7天无理由」，那一定会解析错。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Title />
      <ProductCard.Warranty info="一年质保 · 非人为损坏免费换新" />
      <ProductCard.ReturnPolicy
        windowDays={7}
        freeReturnWithinDays={7}
        allowExchange
        conditions={["吊牌完整", "未下水洗涤", "不影响二次销售"]}
        contact="400-000-0000"
      />
    </StageCard>
  ),
};

// 9 · 内容区
const contentPage: DemoEntry = {
  meta: {
    slug: "pc-content",
    title: "内容区：描述 / 卖点 / 分节 / 分隔",
    group: "compound",
    capability: "compound-content",
    intro: "长文本折叠、卖点列表、可折叠分节、分割线。都是排版件，但决定商详「读起来累不累」。",
    why: "商详不是说明书。卖点用列表、描述用折叠、分节给标题 —— 用户扫三秒就能判断要不要往下读。",
    plugs: [],
    props: ["<ProductCard.Description lines={3} />", "<ProductCard.FeatureList />"],
    note: "Description 的 lines 是「折叠到几行」，展开后仍是原文，不做二次加工。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Title />
      <ProductCard.Subtitle />
      <ProductCard.FeatureList />
      <ProductCard.Section title="商品描述">
        <ProductCard.Description lines={3} />
      </ProductCard.Section>
      <ProductCard.Divider />
      <ProductCard.Section title="面料与工艺">
        <ProductCard.Description>
          260g 精梳长绒棉，双纱领口加固。肩线落在肩峰内 1cm，视觉收窄。三色都是低饱和土色系。
        </ProductCard.Description>
      </ProductCard.Section>
    </StageCard>
  ),
};

// 10 · 变体媒体
const mediaPage: DemoEntry = {
  meta: {
    slug: "pc-media",
    title: "变体媒体切换",
    group: "compound",
    capability: "compound-media",
    intro: "主图 + 缩略图组，支持按选中规格换主图；aspectRatio 可配，切换不改变布局高度。",
    why: "颜色不同、图就不同。让用户点色板时图跟着换，比让他自己在一堆图里找要快得多。",
    plugs: [],
    props: ["<ProductCard.VariantMediaSwitcher aspectRatio=\"4 / 3\" showBorder />"],
    note: "缩略图与主图共用同一份 images；变体图通过 VariantImage 的 label 关联，不额外维护映射表。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Image />
      <ProductCard.VariantMediaSwitcher
        images={TEE.images}
        aspectRatio="4 / 3"
        showBorder
        enableManualSwitch
      />
      <ProductCard.Title />
    </StageCard>
  ),
};

// 11 · 品牌与搭配
const marketPage: DemoEntry = {
  meta: {
    slug: "pc-market",
    title: "品牌 / 徽章组 / 评分 / 搭配购",
    group: "compound",
    capability: "compound-market",
    intro: "品牌背书、一排徽章、星级评分、搭配购（组合价与单买价对比）。",
    why: "客单价不是靠涨价，是靠搭配。「买这个的人还买了」放在商详里，比拼团弹窗有效。",
    plugs: [],
    props: ["<ProductCard.BadgeGroup badges={[\"自营\",\"次日达\"]} />", "<ProductCard.UpsellBundle bundles={bundles} />"],
    note: "UpsellBundle 的组合价由业务给（bundle.price），组件不替你算折扣 —— 算错就是资损。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.Brand name={TEE.brand} />
      <ProductCard.BadgeGroup badges={["自营", "次日达", "7 天无理由"]} />
      <ProductCard.Title />
      <ProductCard.Rating />
      <ProductCard.UpsellBundle
        bundles={[
          {
            id: "b1",
            title: "T 恤 + 马克杯",
            bundlePrice: 399,
            savingsPercent: 15,
            items: [
              { id: "p-tee", title: "长绒棉 T 恤", image: TEE.image, price: 299 },
              { id: "p-mug", title: "手冲马克杯", image: MUG.image, price: 168 },
            ],
          },
        ]}
        showSavings
      />
    </StageCard>
  ),
};

// 12 · 无障碍工具条
const a11yPage: DemoEntry = {
  meta: {
    slug: "pc-a11y",
    title: "无障碍工具条与已选信息",
    group: "compound",
    capability: "compound-a11y",
    intro: "工具条提供对比度 / 字号 / 动效三个开关；已选信息把当前 attributes 与数量摊出来（可选 JSON 视图）。",
    why: "把无障碍做成用户可调的开关，比在系统层面一刀切更实用 —— 视力不同的用户需求差异很大。",
    plugs: [],
    props: ["<ProductCard.A11yToolbar applyTo=\"document\" />", "<ProductCard.SelectedInfo showJSON />"],
    note: "applyTo=\"document\" 会影响整页；只想影响卡片时请自行包一层容器并传入 scoped 场景。",
  },
  Stage: () => (
    <StageCard>
      <ProductCard.A11yToolbar />
      <ProductCard.Title />
      <ProductCard.ColorSwatches attributeName="颜色" />
      <ProductCard.SizeSelector sizes={["M", "L"]} attributeName="尺码" />
      <ProductCard.SelectedInfo showJSON />
    </StageCard>
  ),
};

// 13 · 价格区接缝（插件 ↔ 复合组件）
const seamPage: DemoEntry = {
  meta: {
    slug: "pc-seam",
    title: "价格区接缝：插件挂进复合组件",
    group: "compound",
    capability: "compound-seam",
    intro: "同一张复合组件卡，装上 SKU + PriceCalculator 后：选规格会改价，「省多少」也出现在价格区。这就是 priceArea 槽位。",
    why: "复合组件不该把价格算法抄一遍。它只提供「槽位」，谁的逻辑谁挂进来 —— 这是插件与版式解耦的关键。",
    plugs: [
      { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "提供规格选择并写总线" },
      { fn: "createPriceCalculatorPlugin", why: "把到手价 / 折扣 / 省多少挂进价格区槽位" },
    ],
    props: ["<ProductCard plugins={[...]} data={product}>", "  <ProductCard.Price />"],
    note: "<ProductCard.Price> 内部调用 usePluginSlot(\"priceArea\")：没有插件时它自己渲染单价，有插件时把插件片段拼进来。",
    dataCode: `// ProductCard 的 plugins 走的是同一套 withPlugins，只是包在复合组件外层
<ProductCard
  data={product}
  plugins={[createSKUPlugin({ attributes, variants }), createPriceCalculatorPlugin()]}
>
  <ProductCard.Price />
</ProductCard>`,
  },
  Stage: () => (
    <ProductCard
      productId="compound-seam"
      data={TEE}
      plugins={[
        createSKUPlugin({ attributes: ATTRS, variants: VARIANTS }),
        createPriceCalculatorPlugin({ showDiscount: true, showSavings: true }),
      ]}
    >
      <ProductCard.Image />
      <ProductCard.Title />
      <ProductCard.Price />
      <ProductCard.VariantSelector />
      <ProductCard.StockBadge showQuantity />
    </ProductCard>
  ),
};

export const COMPOUND_DEMOS: DemoEntry[] = [
  basicPage,
  pricePage,
  optionsPage,
  stockPage,
  actionsPage,
  couponPage,
  shippingPage,
  servicePage,
  contentPage,
  mediaPage,
  marketPage,
  a11yPage,
  seamPage,
];
