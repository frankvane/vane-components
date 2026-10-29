import React from "react";
import { Link } from "react-router-dom";
import { createSkuSelector } from "vane-sku";
import { createImageLinkPlugin } from "vane-sku/custom-plugins/ImageLinkPlugin";
import { createKeyboardNavPlugin } from "vane-sku/custom-plugins/KeyboardNavPlugin";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLinkPlugin";
import { createPriceRangePlugin } from "vane-sku/custom-plugins/PriceRangePlugin";
import { createQuantityPlugin } from "vane-sku/custom-plugins/QuantityPlugin";
import { createQuotaPlugin } from "vane-sku/custom-plugins/QuotaPlugin";
import { createResetBarPlugin } from "vane-sku/custom-plugins/ResetBarPlugin";
import { createSkuCodePlugin } from "vane-sku/custom-plugins/SkuCodePlugin";
import { createStockStatusPlugin } from "vane-sku/custom-plugins/StockStatusPlugin";
import { CodeBlock } from "../components/CodeBlock";
import { ATTRIBUTES, VARIANTS } from "../data/sample";
import { SCENARIOS } from "../scenarios/catalog";
import { PLUGINS } from "../data/plugins";
import { DEMOS } from "../demos/registry";

// 组件类型必须在模块级创建（渲染函数里每次调用都会造出新类型 → 重挂载 → 选择态丢失）
const HeroSku = createSkuSelector([
  createPriceRangePlugin(),
  createPriceLinkPlugin({ discountText: "限时8折" }),
  createStockStatusPlugin({ lowStockThreshold: 5 }),
  createQuotaPlugin({ purchasedCount: 1 }),
  createQuantityPlugin(),
  createSkuCodePlugin(),
  createResetBarPlugin(),
  createKeyboardNavPlugin(),
  createImageLinkPlugin(),
]);

const QUICK_START = `import { createSkuSelector } from "vane-sku";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLinkPlugin";
import { createPriceRangePlugin } from "vane-sku/custom-plugins/PriceRangePlugin";
import { createQuotaPlugin } from "vane-sku/custom-plugins/QuotaPlugin";
import { createStockStatusPlugin } from "vane-sku/custom-plugins/StockStatusPlugin";
import type { SkuAttribute, SkuVariant } from "vane-sku";

// 1. 装配：一个组件类型，模块顶层调一次
const Sku = createSkuSelector([
  createPriceRangePlugin(),            // 未选全显区间
  createPriceLinkPlugin(),             // 命中显单价
  createStockStatusPlugin(),           // 库存状态
  createQuotaPlugin({ purchasedCount: 1 }),  // 限购校验
]);

// 2. 使用：和普通组件一样
export function BuyPanel({
  attributes,
  variants,
}: {
  attributes: SkuAttribute[];
  variants: SkuVariant[];
}) {
  return (
    <Sku
      attributes={attributes}
      variants={variants}
      defaultSelection={{ 颜色: "red", 尺码: "s" }}
    />
  );
}`;

const FEATURES = [
  ["内核只做矩阵与推导", "组合矩阵 + 禁用推导内置在内核：候选选项临时代入选择，查是否存在匹配变体，不存在即置灰"],
  ["能力都是插件", "12 个官方插件各管一块（价格 / 库存 / 限购 / 数量 / 货号 / 键盘…），不想付的代价不装"],
  ["三插槽零改内核", "插件走 vane-plugin-core 现有三槽映射（header / overlay / footer），内核保持 0.1.0 不变"],
  ["键盘可达", "方向键在规格间漫游，自动跳过被禁用推导置灰的死路选项"],
  ["插件可单测", "12 个插件都能在 happy-dom 里直接调钩子断言，不依赖浏览器"],
  ["深层子路径不进根入口", "官方插件走 vane-sku/custom-plugins/<Name>，根入口只含内核与装配器（≤6KB gzip）"],
  ["纯函数矩阵可单测", "buildAvailability / matchVariant / isSelectionComplete 从根入口导出，组合逻辑不上 DOM 就能测"],
];

const NOTES = [
  ["装配一次", "createSkuSelector 放模块顶层（纯配置）或 useMemo（工厂要读闭包）。每次渲染都调会造出新组件类型，React 直接卸载重建，用户刚选的规格会被清空。"],
  ["一插件一职责", "价格区间 / 价格联动 / 库存 / 限购 / 数量 / 货号 / 清空 / 键盘 / 主图 / 埋点 / URL / 本机记忆，12 个插件按 priority 串联，互不覆盖。"],
  ["子路径不进根入口", "官方插件走 vane-sku/custom-plugins/<Name>，根入口只含 Core + 装配器 + 矩阵纯函数（实测 6.08KB gzip）。"],
];

export function HomePage() {
  const stats = [
    { k: `${PLUGINS.length}`, v: "领域插件", s: `${PLUGINS.length} 块 · 按 priority 串联` },
    { k: `${SCENARIOS.length}`, v: "组合场景", s: "每卡两份可复制源码" },
    { k: `${DEMOS.length}`, v: "逐项示例", s: "一插件一页 · 参数可拖" },
    { k: "3", v: "内核纯函数", s: "矩阵/匹配/完整性" },
  ];

  return (
    <div>
      <div className="masthead">
        <b>specimen № 04</b>
        <s aria-hidden />
        <span>sku · plugin-composed</span>
        <s aria-hidden />
        <span>
          {PLUGINS.length} plugins / {SCENARIOS.length} plates
        </span>
      </div>

      <section className="hero">
        <h1>
          规格选择很简单，
          <em>难的是用户点了才发现没货。</em>
        </h1>

        <div className="hero-copy">
          <p className="lede">
            组合矩阵与<b>禁用推导</b>内置在内核：选了「蓝」之后，所有没有蓝色变体的尺码自动置灰。
            价格联动 / 限购校验 / 数量步进 / 键盘漫游这些长尾能力做成
            <b>{PLUGINS.length} 个按需插件</b>，用几个装几个。
          </p>
          <ul className="feature-list">
            {FEATURES.map(([title, desc], i) => (
              <li key={title}>
                <em aria-hidden>{String(i + 1).padStart(2, "0")}</em>
                <div>
                  <b>{title}</b>
                  <span>{desc}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="hero-links">
            <Link to="/demo/disable">从「禁用推导」开始</Link>
            <Link to="/scenarios">看 {SCENARIOS.length} 个真实版式</Link>
          </p>
        </div>

        <figure className="plate hero-demo">
          <figcaption className="plate-cap">
            <b>plate 00</b>
            <span>9 plugins · composed</span>
            <em>live</em>
          </figcaption>
          <div className="plate-ruler" aria-hidden />
          <div className="plate-body">
            {/* SKU 面板自带浅色系样式，垫一层白底更清晰（旧版首页同款写法） */}
            <HeroSku
              attributes={ATTRIBUTES}
              variants={VARIANTS}
              defaultSelection={{ 颜色: "red", 尺码: "s" }}
              containerClassName="sku-card"
              containerStyle={{
                maxWidth: 460,
                margin: "0 auto",
                background: "#fff",
                padding: 16,
                borderRadius: 3,
              }}
            />
          </div>
        </figure>
      </section>

      <section className="ledger" aria-label="项目规模">
        {stats.map((s) => (
          <div key={s.v}>
            <b>{s.k}</b>
            <span>{s.v}</span>
            <em>{s.s}</em>
          </div>
        ))}
      </section>

      <section className="two-col">
        <div>
          <div className="section-head">
            <h2>五分钟上手</h2>
            <code>2 steps</code>
          </div>
          <p>
            两步：装配成组件类型，然后当普通组件用。所有长尾行为都来自插件，
            内核的 props 只有数据与回调那几个（attributes / variants /
            defaultSelection / onChange）。
          </p>
          <ul className="notes">
            {NOTES.map(([t, d], i) => (
              <li key={t}>
                <em aria-hidden>{String(i + 1).padStart(2, "0")}</em>
                <span>
                  <b>{t}</b> —— {d}
                </span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 14 }}>
            想逐个插件看效果，走{" "}
            <Link to={`/demo/${DEMOS[0].meta.slug}`}>逐项示例</Link>
            （{DEMOS.length} 页：一插件一页，带参数控件与随参数变化的装配代码）。
          </p>
        </div>
        <CodeBlock code={QUICK_START} title="buy-panel.tsx" collapseAfter={0} maxHeight={520} />
      </section>

      <section>
        <div className="section-head">
          <h2>目录</h2>
          <code>contents</code>
        </div>
        <div className="index-list">
          <Link className="index-row" to="/plugins">
            <em>02</em>
            <span>
              <strong>插件工坊</strong>
              <span>勾选 {PLUGINS.length} 个插件，实时看效果并生成装配代码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
          <Link className="index-row" to="/scenarios">
            <em>03</em>
            <span>
              <strong>场景示例</strong>
              <span>{SCENARIOS.length} 个真实版式（商品详情 / 营销活动 / 状态恢复 / 轻量嵌入），每卡带可复制的完整源码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
          <Link className="index-row" to={`/demo/${DEMOS[0].meta.slug}`}>
            <em>04</em>
            <span>
              <strong>逐项示例</strong>
              <span>{DEMOS.length} 页：一插件一页，带参数控件与随参数变化的装配代码</span>
            </span>
            <i aria-hidden>→</i>
          </Link>
        </div>
      </section>
    </div>
  );
}
