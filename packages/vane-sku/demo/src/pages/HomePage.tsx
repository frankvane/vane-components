import React from "react";
import { createSkuSelector } from "../../../src";
import { createPriceLinkPlugin } from "../../../src/custom-plugins/PriceLink";
import { createPriceRangePlugin } from "../../../src/custom-plugins/PriceRange";
import { createStockStatusPlugin } from "../../../src/custom-plugins/StockStatus";
import { createQuotaPlugin } from "../../../src/custom-plugins/Quota";
import { createQuantityPlugin } from "../../../src/custom-plugins/Quantity";
import { createResetBarPlugin } from "../../../src/custom-plugins/ResetBar";
import { createKeyboardNavPlugin } from "../../../src/custom-plugins/KeyboardNav";
import { createSkuCodePlugin } from "../../../src/custom-plugins/SkuCode";
import { ATTRIBUTES, VARIANTS } from "../data/sample";
import { PLUGIN_COUNT } from "../data/plugin-catalog";

// 组件类型必须在模块级创建（写在渲染函数里会导致每次渲染重建 → 重挂载 → 选择态丢失）
const Sku = createSkuSelector([
  createPriceRangePlugin(),
  createPriceLinkPlugin({ discountText: "限时8折" }),
  createStockStatusPlugin({ lowStockThreshold: 5 }),
  createQuotaPlugin({ purchasedCount: 1 }),
  createQuantityPlugin(),
  createSkuCodePlugin(),
  createResetBarPlugin(),
  createKeyboardNavPlugin(),
]);

export function HomePage() {
  const [log, setLog] = React.useState<string[]>([]);

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="hero-eyebrow">
            <i aria-hidden="true" />
            vane-sku · spec selector engine
          </div>
          <h1 className="hero-title">
            <span className="line">规格选择，</span>
            <span className="line">
              不该让用户<em>点了才发现没货</em>
            </span>
          </h1>
          <p className="hero-lede">
            组合矩阵 + <b>禁用推导</b> 内置在内核：选了「蓝」之后，所有没有蓝色变体的尺码
            自动置灰。价格联动 / 限购校验 / 数量步进 / 键盘漫游等长尾能力做成按需插件，
            用几个装几个。
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#/workshop">
              打开插件工坊
            </a>
            <a className="btn btn-ghost" href="#/scenarios">
              看场景集
            </a>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-value">{PLUGIN_COUNT}</span>
            <span className="stat-label">官方插件</span>
          </div>
          <div className="stat">
            <span className="stat-value">6.1</span>
            <span className="stat-label">根入口 KB (gzip)</span>
          </div>
          <div className="stat">
            <span className="stat-value">0</span>
            <span className="stat-label">运行时依赖</span>
          </div>
          <div className="stat">
            <span className="stat-value">41</span>
            <span className="stat-label">单元测试</span>
          </div>
        </div>
      </header>

      <h2 className="section-title">30 秒上手</h2>
      <div className="detail-grid">
        <div className="detail-left">
          <div className="preview-wrap">
            <div className="preview-stage">
              <div style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 3, padding: 16 }}>
                <Sku
                  attributes={ATTRIBUTES}
                  variants={VARIANTS}
                  defaultSelection={{ 颜色: "red", 尺码: "s" }}
                  onChange={(_sel, v) =>
                    setLog((l) => [...l.slice(-4), `${v ? v.sku : "未命中"} · ${new Date().toLocaleTimeString()}`])
                  }
                />
              </div>
            </div>
            <div className="preview-controls">
              <div className="block-title">事件</div>
              {log.length ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--text-2)" }}>
                  {log.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">点规格试试：选蓝色，L 会被禁用推导置灰。</p>
              )}
            </div>
          </div>
        </div>

        <div className="detail-right">
          <div className="block-title">典型用法</div>
          <pre className="src-pre">
            <code>{`import { createSkuSelector } from "vane-sku";
import { createPriceLinkPlugin }
  from "vane-sku/custom-plugins/PriceLink";

const Sku = createSkuSelector([
  createPriceRangePlugin(),   // 未选全显区间
  createPriceLinkPlugin(),    // 命中显单价
  createStockStatusPlugin(),  // 库存状态
  createQuotaPlugin({ purchasedCount: 1 }),
]);

<Sku
  attributes={attributes}
  variants={variants}
  defaultSelection={{ 颜色: "red", 尺码: "s" }}
/>`}</code>
          </pre>

          <div className="block-title">与 vane-card 的 SKUPlugin 什么关系</div>
          <p className="muted">
            vane-card 的 <code>SKUPlugin</code> 是「卡片内的轻量选规格」：每个选项永远可点，
            错配只是不命中，也没有限购校验。vane-sku 是独立领域引擎，补上禁用推导与限购，
            可脱离卡片单独使用。二者并存，互不替代。
          </p>
        </div>
      </div>

      <h2 className="section-title">能力地图</h2>
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">CORE</div>
          <h3>组合矩阵 + 禁用推导</h3>
          <p>候选选项临时代入选择，查是否存在匹配变体；不存在即置灰。纯函数，可单测。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">PLUGIN</div>
          <h3>按需子路径</h3>
          <p>12 个插件各自独立子路径，插件闭包约 1.0–1.8KB，不进根入口。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">SLOT</div>
          <h3>零改内核</h3>
          <p>插槽映射 vane-plugin-core 现有三槽（header/overlay/footer），内核保持 0.1.0 不变。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">A11Y</div>
          <h3>键盘可达</h3>
          <p>方向键在规格间漫游，自动跳过被置灰的死路选项。</p>
        </div>
      </div>
    </div>
  );
}
