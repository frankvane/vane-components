# 电商卡片

> 一张商品卡上有十几件互不相干的事：主图、角标、规格选择、数量、到手价、优惠券、库存、比价、倒计时、埋点。揉进一个组件，两个月后就没人敢动了。

`vane-card` 把它拆成 **22 个领域插件 + 38 个复合组件**，`CardCore` 只负责「一个盒子 + 三个回调 + 一个 ref」。装配出来的仍是**一个普通 React 组件**，不是运行时容器。

## 特性

- **装配即组件**：`withPlugins(CardCore, { plugins })` 返回的是普通组件类型，没有 Provider 树、没有运行时解释器，ref 直通 DOM
- **两个正交的排序轴**：`priority` 管钩子执行顺序（越大越先），`config.order` 管插槽渲染位置（越小越靠前）—— 这两件事混在一起，就是「按钮跑到价格上面」那类 bug 的根源
- **价格区只有一个决策者**：所有价格类插件都往 `renderPriceArea` 这个领域槽写片段，由复合组件统一决定插在哪，插件之间零耦合
- **总线 6 个键**：`sku.*` / `quantity` / `coupon.applied`。SKU 是唯一「源」，其余全是消费者 —— 加一个插件不需要改已有插件
- **钩子面 15 个**（内核 9 + 领域 6），每一个都有真实执行点；旧版声称有 24 个，其中 9 个从未被执行过
- **样式可选**：不引 `style.css` 也能渲染（核心只内联 `position` / `box-sizing` / padding），引了则由 CSS 变量统一换肤，暗色靠 `data-vc-theme="dark"`
- **零运行时依赖**：`react` / `react-dom` 只进 peer，`vane-plugin-core` 构建时内联

## 安装

```bash
npm install vane-card
```

## 30 秒上手

```tsx
import { CardCore, withPlugins } from "vane-card";
import { createImagePlugin } from "vane-card/custom-plugins/ImagePlugin";
import { createBadgePlugin } from "vane-card/custom-plugins/BadgePlugin";
import { createPriceCalculatorPlugin } from "vane-card/custom-plugins/PriceCalculatorPlugin";
import "vane-card/style.css"; // 可选：不引也能渲染

// 装配：模块顶层调一次，得到一个组件类型
const ProductCard = withPlugins(CardCore, {
  plugins: [
    createImagePlugin({ alt: "商品主图" }),
    createBadgePlugin({ text: "热卖", type: "hot" }),
    createPriceCalculatorPlugin({ showSavings: true }),
  ],
});

export function Wall({ item }: { item: ProductData }) {
  return <ProductCard cardId={item.id} data={item} />;
}
```

**`withPlugins` 不要在渲染里调**。它每次调用都返回新的组件类型，React 看到类型变了就整棵卸载重建 —— `onMount` 重跑、内部状态全丢、图片重新加载。要按条件换插件，用「按插件名记忆」的写法（见 [API · 装配](api.md#装配-withplugins)）。

## 导入方式与体积

根入口**不桶导出**插件与复合组件 —— 只用一个插件的人不该为 22 个插件付钱。

| 导入 | 内容 | 实测 Gzip |
| --- | --- | --- |
| `vane-card` | Core + 装配 + 总线键 + 类型（不含任何插件） | **6.8 KB** |
| `vane-card/core` | 只有 `CardCore`，插件全部自己写 | **1.7 KB** |
| `vane-card/plugins` | 装配层 + 15 钩子契约 + 领域槽 | 5.2 KB |
| `vane-card/compound` | 38 个复合组件 + `ProductCard` | 17.6 KB |
| `vane-card/custom-plugins` | 22 个插件的桶（逃生口，常规不推荐） | 23.5 KB |
| `vane-card/custom-plugins/XxxPlugin` | 单个插件 | **1.6–1.8 KB** |
| `vane-card/presets/product-card` | 配方（含它装的那几个插件） | 4.3 KB |
| `vane-card/style.css` | 全部样式（24.8 KB 源码） | 5.1 KB |

全量并集（22 插件 + 38 复合组件 + 3 配方**全都用上**）**31.5 KB gzip**。三个口径都在 `package.json` 的 `vane` 字段里设了上限（根入口 12 / core 5 / 全量 36），`pnpm check` 会实测，不是口号。

## 包内有什么

```
CardCore            一个盒子：布局 / padding / 点击 / 悬停 / 可见性 / ref
withPlugins         装配层：内核 runtime + 领域上下文 + Core 回调桥接
plugins/            15 钩子契约 + 总线键 + 领域槽（priceArea）
compound/           38 个复合组件 + ProductCard（读 ProductData 的整套布局）
custom-plugins/     22 个领域插件（5 组），每个目录一份 doc.json 作为文档真相
presets/            product-card / sku-flow / checkout
styles/             tokens.css + components.css（CSS 变量 + vc- 前缀 class）
demo/               演示站：38 页逐项示例 + 9 版式 + 16 场景（不随包发布）
```

## 样式与主题

样式是**可选增强**——不引 `style.css` 组件照常渲染、照常交互，只是没有这套视觉：

| 不引 `style.css` 时 | 说明 |
| --- | --- |
| 结构仍在 DOM 里 | `<table>` / `<button>` / `<ul><li>` / `<label>+<select>` 等语义标签原样保留，读屏、键盘 Tab、表单提交都不受影响 |
| 功能属性仍内联 | 容器的 `position` / `box-sizing` / `padding` 留在内联样式上（overlay 靠它定位，padding 参与盒模型），绝对定位的浮层不会跑到别的祖先上去 |
| 无障碍开关仍生效 | `<A11yToolbar>` 五个开关对应的 `:root[data-a11y-*]` 规则是**运行时注入**的，不依赖样式表 |
| 缺的是纯外观 | 间距、字号、颜色、圆角、边框、状态色（售罄红 / 低库存橙 / 在售绿） |

`demo/no-style.html` 就是这个形态的对照页，与 `demo/index.html` 用同一份数据渲染。

换肤优先级从低到高：`:root` 默认值 → 容器上加 `data-vc-theme="dark"` → 行内覆盖单个变量。

```tsx
// 整块区域切暗色
<div data-vc-theme="dark">
  <ProductCard cardId="p1" data={data} />
</div>

// 单点覆盖：只改强调色
<ProductCard cardId="p1" data={data} containerStyle={{ "--vc-accent": "#7c3aed" } as React.CSSProperties} />
```

常用变量：`--vc-fg` `--vc-fg-dim` `--vc-fg-muted` `--vc-bg` `--vc-bg-subtle` `--vc-border` `--vc-accent`
`--vc-price` `--vc-danger` `--vc-success` `--vc-warning` `--vc-radius` `--vc-gap` `--vc-fs-xs..lg`。

样式文件分两层：`styles/tokens.css` 放 `--vc-*` 变量（换肤改这里），`styles/components.css` 放 `vc-` 前缀 class（改排布改这里），构建时由 `@vane/build-config` 的 `cssCopyPlugin` 合并输出为 `dist/style.css`。class 命名是 `vc-<component>[__<element>][--<modifier>]`、状态用 `.is-*`；`test/styles.test.ts` 会静态对账源码与样式表（源码里出现的 class 必须有定义，定义的必须有人用），所以 class 拼错会在 CI 变红而不是悄悄掉样式。

## 插件目录速览

| 组 | 插件 | 管什么 |
| --- | --- | --- |
| 媒体 | Image / Video / Gallery | 主图兜底与变体换图、视频播放、图集切换 |
| 交易 | SKU / Quantity / PriceCalculator / ComparePrice / Coupon / CouponRecommend / OrderSummary / Inventory | 规格 → 数量 → 到手价 → 优惠 → 汇总 → 库存，一条链 |
| 展示 | Badge / UserTag / Countdown / Review / Animation | 角标、用户标签、倒计时、评价、入场动画 |
| 交互 | Actions / Hover | 加购与收藏、悬停反馈 |
| 基础设施 | State / Analytics / A11y / Responsive | 状态初值、埋点、无障碍、尺寸自适应 |

每个插件的 priority、配置项、坑位说明见 [插件](plugins.md)；现成组合见 [组合配方](recipes.md)。

## 两个排序轴，别混

这是本包最容易踩的地方，单独说清楚：

| 轴 | 作用域 | 方向 | 例子 |
| --- | --- | --- | --- |
| `priority` | 钩子的**执行顺序** | 越大越先 | SKU 60 先写总线，Analytics 50 后读，保证读到的是新值 |
| `config.order` | 插槽内的**渲染位置** | 越小越靠前 | 价格区：券条 0 → 价格 10 → 按钮 20 |

只调 `priority` 去改视觉顺序是错的：它不会移动任何 DOM，只会改执行顺序。反过来只调 `config.order` 也不会影响谁先跑。`footer` / `header` / `overlay` 三个内核插槽由 `config.order` 排序，`priceArea` 领域槽同样。

## 从 1.x 迁移

2.0.0 是破坏性大版本：插件系统内核换成 `vane-plugin-core`（与 `vane-lazy-image` / `vane-waterfall` 同一套），根入口不再桶导出。

| 变化 | 影响 | 怎么改 |
| --- | --- | --- |
| 插件系统换内核 | 自建 `PluginBus` / `PluginManager` / `SlotsContext`（1154 行）删除 | 不要再 import 它们；`withPlugins` / `usePluginSlot` 从包里取 |
| 钩子面 24 → 15 | 9 个从未被执行的钩子删除（`onSelectionChange` / `onCartChange` / `onWishlistChange` / `onBeforeDataChange` / `onDataChange` / `renderContainer` / `renderContentWrapper` / `renderBadge` / `renderActions`） | 状态变化用 `onStateChange`（带前后快照），覆盖层用 `renderOverlay` |
| 根入口瘦身 | 插件与复合组件不再从 `vane-card` 导出 | `import { createXxxPlugin } from "vane-card/custom-plugins/XxxPlugin"`；复合组件走 `vane-card/compound` |
| 入口路径统一 | 旧的 `vane-card/entries/core` 不存在了 | 改 `vane-card` 或 `vane-card/core` |
| 事件语义 | `priority` **同向**（大 = 先执行） | 与 1.x 一致，不要按 `vane-lazy-image` 的 `1000 - x` 去改 |
| `onMount` 返回值 | 统一当清理函数，卸载时逆序执行 | 旧版 `.catch(() => {})` 丢弃返回值，订阅会泄漏；把 `unsubscribe` 放回返回值 |
| 状态更新时机 | `onStateChange` 从 updater 内移到 state 变化后的 effect | updater 必须保持纯函数，不要在里面发事件 |
| 样式 | 内联样式搬进 `style.css`，class 统一 `vc-` 前缀 | 引一次 `vane-card/style.css`；覆盖样式请改 CSS 变量，不要再依赖内联优先级 |
| 变体匹配 | `matchVariant` 语义修正：从「每个已选属性都对上」改为「属性集一一对上」 | 只选了颜色时不再拿「红/M」的价格；未选全回退商品级字段 |

## 在线示例

演示站四个视角，各管一件事：

| 页面 | 数量 | 解决什么 |
| --- | --- | --- |
| **逐项示例** | 38 页 | 一插件一页：拖参数看行为变化，装配代码跟着参数实时变 |
| **插件工坊** | 22 插件 | 组合实验台：勾选任意组合，现场看冲突提示并生成装配代码 |
| **场景库** | 16 版式 / 7 行业 | 组合视角：真实业务场景（商详 / 秒杀 / 优惠叠加 / 比价 / 低库存 / 视频 / 评价墙…），每卡两份源码 |
| **布局专区** | 9 版式 | 结构视角：同一份数据摆成九种形状（垂直 / 横向 / 右图 / 下图 / Banner / 网格 / 极简 / 背景图 / 双列），源码可整段抄 |

**为什么场景要分行业**：同一件商品在不同平台里，卡的形状根本不一样 —— 生鲜按重量卖（500g / 1kg，数量是「份」）、3C 是版本组合 + 全网比价、美妆色号即 SKU 且换色要换图、家居先确认尺寸与送装费、票务是「场次 × 票档」加放票倒计时、课程要试看。只给一套服饰示例，读者会把「服饰的 SKU 写法」直接套到票务上。所以场景库除了「形态」（列表 / 商详 / 交易 / 内容）还有第二维「行业」，两个维度可叠加筛选。

**布局专区不是插件示例**：九个版式的插件几乎都是同一批（Hover / Image 而已），差别全在 `children` 的结构 —— 图占多少、文字留多少 padding、什么时候让图通栏、什么时候干脆不要图。所以每块的源码就是结构本身，可以整段抄走改。

逐项示例分七组：基础 3（props / ref / 生命周期）、媒体 3、交易 8、展示 5、交互 2、基础设施 4、复合组件 13。

每页固定四块：一句话 + 什么时候用 → 参数控件 → 可交互舞台（含事件日志）→ 通栏代码（最小装配 / 完整源码）。**页面贴的完整源码就是真在跑的那份文件**（`import.meta.glob` 双 glob，`?raw` 读同源），所以文档不会漂移。

::: tip 卡顶那条虚线框是什么
38 页里有 22 页只装功能插件（SKU / 数量 / 价格 / 倒计时 / 状态…），不装 `ImagePlugin` / `GalleryPlugin` / `VideoPlugin`，于是卡片顶部空着。demo 会给这些页画一条**虚线斜纹的空媒体位**，写清「本页未装媒体插件」。

它不是图片加载失败，也不是占位图 —— 这两页的「最小装配」要能直接抄进项目，多塞一个 `ImagePlugin` 就不叫最小了。想看真实媒体位：媒体组三页（Image / Gallery / Video）和复合组件页（`pc-basic` / `pc-media` …）都装着。
:::

本地跑：

```bash
pnpm --filter vane-card dev               # 开发（端口 3301）
pnpm --filter vane-card demo              # 构建 + 静态托管 demo-dist
pnpm --filter vane-card verify:scenarios  # 场景目录 / 源码 / 插件名一致性闸门
pnpm --filter vane-card verify:layouts    # 版式编号 / id / 宽度闸门
pnpm --filter vane-card verify:controls   # 控件契约：拖了要读、读了要有控件、代码占位要对得上
PLAYWRIGHT_PATH=<playwright> node scripts/audit-cards.mjs      # 42 个页面逐页几何体检
PLAYWRIGHT_PATH=<playwright> node scripts/audit-controls.mjs   # 逐个拨 31 个控件，看舞台认不认
```

四道闸门各管一段：

| 闸门 | 抓什么 | 抓不到什么 |
| --- | --- | --- |
| `verify:scenarios` | 场景编号 / `meta.id` 与文件名 / `plugs` 与源码里真实调用双向对不上；22 插件覆盖率 | 运行时行为 |
| `verify:controls` | 控件声明了但 Stage 没读、Stage 读了但没声明控件、代码里的 `{{key}}` 没有对应控件 | 读了之后有没有真的作用到卡片上 |
| `audit:cards` | 真浏览器里的几何坏味道：卡片没渲染 / 零尺寸 / 溢出容器 / 破图 / 无内容 / 缺价格 | 「插件装了但没生效」—— 结构合法不等于行为正确 |
| `audit:controls` | 逐个把控件拨到另一端，看卡片有没有重建 / 内容有没有变 | 悬停才生效、只改 console 的行为（这些按设计不可见） |

体检判据同时存在两份（`demo/src/lib/audit.ts` 与 `scripts/audit-cards.mjs`），刻意的：前者能在浏览器里手点复现，后者能进 CI。横滑场景（移动端横滑卡）跳过溢出判定 —— 那本来就该溢出。

::: warning 拖控件会「重挂」一次卡片
`withPlugins(CardCore, { plugins })` 返回的是一个**闭包住那批插件实例**的组件类型。示例页的插件配置都是控件现算的，所以「控件变了」在语义上就等于「换一个组件类型」（`stage.tsx` 里用控件世代号做 memo 的 key）。

这条曾经写错成「只按插件名缓存」：名字没变 → 命中缓存 → 拿回第一次那个类型，里面的插件实例还是初始配置。表现是**控件在动、代码块在变、舞台上纹丝不动**（BadgePlugin 的「文案 / 语义 / 位置」就是这么被抓到的，另有 10 个页面同病）。

重挂的代价是卡片内部状态复位（选中规格、步进器数量），这在「拖控件 = 改代码」的语境下是正确的：改完配置的卡，本来就该是一张新卡。
:::
