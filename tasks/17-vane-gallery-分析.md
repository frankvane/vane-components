# 17 · vane-gallery 分析（B1-B：并入 vane-lazy-image · 定位 / 边界 / 内核映射 / 体积口径 / SOP 命中）

> 状态：**决策已锁定（B1–B7 见第六章）· 待开工**（本文不改任何代码）
> 基线：仓库 `e:\react-plugin-component` @ 当前 HEAD，`vane-lazy-image@2.0.1`（已含 ~74 插件 + `GalleryPlugin`/`HoverZoomPlugin`/`VideoPosterPlugin`/`ComparisonPlugin`/`product-gallery` preset）
> 规划源：`next-batch-components-plan.html` 第 4 批（vane-gallery = 商品图库，chips：Magnifier / ThumbSync / VideoSlot / Spin360）
> 关联：实施清单见 `tasks/18-vane-gallery-实施清单.md`；家族范式见 `tasks/15`/`16`（vane-profile）
> 内核 API 权威定义：`packages/plugin-core/src/types.ts`、`src/react/{withPlugins,slots,usePluginRuntime}.tsx`

---

## 一、结论先行

1. **vane-gallery 不新建包，并入 `vane-lazy-image`（B1-B 已定）。** 规划原文的"独立组件 vane-gallery"被推翻：经核查，`vane-lazy-image@2.0.1` 已具备图集所需的放大镜、视频位、灯箱、对比图等能力（见第三章），独立成包只会重复造轮子且违背 ADR-6 子路径复用原则。

2. **真正缺口只有两块：缩略联动（ThumbSync，含 activeIndex 协调态）+ 360° 环物（Spin360）。** 规划 chips 的 4 个里，Magnifier=现有 `HoverZoomPlugin`、VideoSlot=现有 `VideoPosterPlugin`，仅 ThumbSync、Spin360 需新写。但用户要求"插件至少 15 个以上规划"，故在补齐 2 个核心缺口之外，再规划 8 个 gallery 域增强插件（轮播/计数/指示点/缩放控制/全屏/热点/收藏/预取），**形成 18 个 gallery 插件目录（8 现有 + 10 新增）**，其中 16 个为本期承诺范围，2 个为候选二期。

3. **新增"Gallery 子特性"，而非把图集塞进单图 `LazyLoadImageCore`。** 图集是多图容器（`images[]` + `activeIndex`），与单图 lazy-image 的内核实例模型不同。B3 决策：在 lazy-image 内新增 `src/gallery/`（GalleryCore 多图容器 + `useGalleryRuntime` 包内封装 `usePluginRuntime` + `renderGallerySlot` 领域槽），每个主图内部仍用 `LazyLoadImageCore + withPlugins` 渲染，从而**单图插件（HoverZoom/VideoPoster/PriceTag…）自动挂到主图**，零重复。

4. **体积口径分两层（B5/B7）：** ① lazy-image 根入口保持 28KB 预算（已成，含 1.x 兼容桶），**不动、不新增到桶**；② 新增 `vane-lazy-image/gallery` 子路径（GalleryCore + runtime + 领域槽 + gallery preset），gzip ≤ **4.0KB**（独立子路径预算，理由见 `package.json` 的 `vane.gallerySizeBudgetKb`）。规划原文给 vane-gallery 独立包 ≤2.5KB，并入后隔离边界从"独立包根"下移到"gallery 子路径"，该子路径需承载多图容器（比薄根更大），故据实上调到 4.0KB——**覆盖原 2.5KB 口径**。

5. **新 gallery 插件走 ADR-6 子路径，不进 1.x 兼容桶（B7）。** 现有 74 个插件在根桶里（这是 lazy-image 为 1.x 兼容刻意保留的，26.9KB/28KB 上界，已有意不统一）。为**保护根预算不被新插件撑大**，10 个新增 gallery 插件只经 `vane-lazy-image/custom-plugins/<Name>` 子路径 + `vane-lazy-image/gallery` preset 暴露，不加入根桶。

6. **SOP 命中 5/5、红线 0（B6）。** 图集引擎：核心职责薄而稳定（容器壳 + 生命周期转发）/ 需求长尾发散（16+ 插件）/ 有生命周期与事件（activeIndex 切换、帧切换、缩放态）/ 有天然渲染插槽（缩略区/主图区/工具条区/浮层）/ 按需加载能省体积。比 vane-profile（4/5）更贴合插件内核。

---

## 二、定位与范围

### 2.1 一句话定位

> **商品图集引擎（lazy-image 的子特性）**：以"缩略条 + 主图 + 工具条"三段式多图容器为骨架，把放大镜/视频位/灯箱/360环物/对比/价格/促销等能力外置为插件，GalleryCore 只做布局壳与 activeIndex 协调。

### 2.2 规划原文 vs 本次分析

| 维度 | 规划原文（next-batch-components-plan.html） | 本次分析结论 |
| --- | --- | --- |
| 批次 | 第 4 批 · 电商与转化 | 同（与 sku / coupon 同批） |
| 定位 | 商品图集引擎（缩略联动 / 放大镜 / 视频位 / 360° 环物） | 同，但**并入 vane-lazy-image**（B1-B） |
| 首发插件 | Magnifier / ThumbSync / VideoSlot / Spin360（4 chips） | **扩到 18 个目录（16 承诺 + 2 候选）**，见第四章 |
| 复用资产 | 未指定 | **复用 lazy-image 现有 8 插件**（HoverZoom/VideoPoster/Gallery/Comparison/PriceTag/PromoBadge/SocialShare/DownloadButton） |
| 体积预算 | ≤ 2.5KB（独立包根 gzip） | 推翻 → gallery 子路径 ≤4.0KB（B5/B7） |
| 工作量 | 未给 | 见 `tasks/18`：P0–P5，L 量级（10 新插件 + 子特性壳） |

### 2.3 不在范围内（明确排除，避免范围蔓延）

- ❌ 不新建 `vane-gallery` npm 包（B1-B 并入 lazy-image）
- ❌ 不把图集逻辑塞进单图 `LazyLoadImageCore`（那是单图组件，图集是多图容器，模型不同）
- ❌ 不重写现有 HoverZoom/VideoPoster/Gallery/Comparison/PriceTag 等（直接复用，仅做 gallery 适配接线）
- ❌ 不做"图片编辑器 / 裁剪 / 滤镜本体"（裁剪已有 `CropPlugin`、滤镜已有 `FilterPlugin`，属单图通用，非图集专属）
- ❌ 不做"AR/3D 试穿"（候选二期 `ARViewPlugin`，本期不立项，避免引入外部依赖）

---

## 三、与 lazy-image 现状的边界（B2 已定）

### 3.1 现状核查（实测，非推测）

`vane-lazy-image@2.0.1` 的 `src/custom-plugins/` 已含 ~74 个插件，与 gallery 域重叠/可复用的有：

| 现有插件 | 目录 | 对应 gallery 能力 | 用途 |
| --- | --- | --- | --- |
| `HoverZoomPlugin` | `src/custom-plugins/HoverZoomPlugin` | **Magnifier 放大镜** | 悬停放大看细节（= 规划 chip Magnifier） |
| `VideoPosterPlugin` | `src/custom-plugins/VideoPosterPlugin` | **VideoSlot 视频位** | 首帧海报 + 播放（= 规划 chip VideoSlot） |
| `GalleryPlugin` | `src/custom-plugins/GalleryPlugin` | **Lightbox 灯箱** | 点击放大进入全屏灯箱看原图（导出 `createGalleryPlugin`） |
| `ComparisonPlugin` | `src/custom-plugins/ComparisonPlugin` | **Before/After 对比** | 图集内对比场景（已存在） |
| `PriceTagPlugin` | `src/custom-plugins/PriceTagPlugin` | **价格标签** | 主图上叠加价格 |
| `PromoBadgePlugin` | `src/custom-plugins/PromoBadgePlugin` | **促销角标** | 角标/折扣标 |
| `SocialSharePlugin` | `src/custom-plugins/SocialSharePlugin` | **分享** | 分享当前主图 |
| `DownloadButtonPlugin` | `src/custom-plugins/DownloadButtonPlugin` | **下载大图** | 下载原图 |

> 结论：规划的 4 个 chip 中 Magnifier、VideoSlot 已存在；Lightbox（灯箱）作为图集标配也已存在（`GalleryPlugin`）。**真正需新写的核心仅 ThumbSync、Spin360。**

### 3.2 B2 决策：复用优先，不重写

**B2-A（已选）：gallery 直接复用上述 8 个现有插件，仅做"gallery 适配接线"。** 适配指：
- 这些插件原本挂在单图 `LazyLoadImageCore` 上；在 gallery 里，主图即一个 `LazyLoadImageCore` 实例，插件原样挂上即可（零改动或仅 config 默认值微调）。
- 新增的 gallery 域插件（ThumbSync 等）挂到 **GalleryCore 的 `useGalleryRuntime`**（见 B3），通过 `extendContext` 注入 `activeIndex`/`images`/`frameIndex`/`zoom` 等协调态，与单图插件解耦。

---

## 四、Gallery 插件目录（≥15，B4 · 18 个 = 8 现有 + 10 新增）

> 状态列：✅=lazy-image 已存在（仅接线）/ 🆕=本期新增。
> 承诺范围 = 前 16 个；候选二期 = 末 2 个（不阻塞主流程）。

| # | 插件 | 映射规划 chip | 状态 | 职责 | 钩子/槽位 | 现有文件 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `HoverZoomPlugin` | Magnifier | ✅ | 悬停放大镜看细节 | `renderOverlay` | `custom-plugins/HoverZoomPlugin` |
| 2 | `VideoPosterPlugin` | VideoSlot | ✅ | 视频位（海报+播放） | `renderOverlay` | `custom-plugins/VideoPosterPlugin` |
| 3 | `GalleryPlugin` | —（灯箱标配） | ✅ | 点击进入全屏灯箱 | `renderOverlay` | `custom-plugins/GalleryPlugin` |
| 4 | `ComparisonPlugin` | —（对比） | ✅ | Before/After 对比滑块 | `renderOverlay` | `custom-plugins/ComparisonPlugin` |
| 5 | `PriceTagPlugin` | — | ✅ | 主图价格标签 | `renderOverlay` | `custom-plugins/PriceTagPlugin` |
| 6 | `PromoBadgePlugin` | — | ✅ | 促销角标 | `renderOverlay` | `custom-plugins/PromoBadgePlugin` |
| 7 | `SocialSharePlugin` | — | ✅ | 分享当前主图 | `renderOverlay` | `custom-plugins/SocialSharePlugin` |
| 8 | `DownloadButtonPlugin` | — | ✅ | 下载原图 | `renderOverlay` | `custom-plugins/DownloadButtonPlugin` |
| 9 | **`ThumbSyncPlugin`** | **ThumbSync（核心）** | 🆕 | 缩略图条 + activeIndex 协调态；键盘左右切；点击缩略图切主图 | 领域钩子 `onThumbChange` + `extendContext(activeIndex/setActiveIndex)` | — |
| 10 | **`Spin360Plugin`** | **Spin360（核心）** | 🆕 | 360° 环物：帧序列拖拽/自动旋转；维护 `frameIndex` | 领域钩子 `onFrameChange` + `extendContext(frameIndex/setFrameIndex)` | — |
| 11 | `CarouselPlugin` | — | 🆕 | 主图自动轮播/箭头/滑动切换（区别于缩略联动，强调"自动流转"） | `onActiveChange` + `transformProps` | — |
| 12 | `CounterPlugin` | — | 🆕 | 计数指示器 "3 / 8"，绑定 activeIndex | `renderGallerySlot("galleryToolbarArea")` | — |
| 13 | `IndicatorPlugin` | — | 🆕 | 圆点指示器 dots，点击跳指定 index | `renderGallerySlot("galleryToolbarArea")` | — |
| 14 | `ZoomControlPlugin` | — | 🆕 | 按钮式放大/缩小/复位（非悬停，移动端/可控），缩放比例入 context | `renderGallerySlot("galleryToolbarArea")` + `extendContext(zoom)` | — |
| 15 | `FullscreenPlugin` | — | 🆕 | 全屏铺满查看主图（区别于灯箱，纯全屏） | `renderOverlay` | — |
| 16 | `ThumbPreloadPlugin` | — | 🆕 | 基于 activeIndex 预取相邻缩略图/主图（性能） | `onActiveChange` + `transformData` | — |
| — | `HotspotPlugin` | — | 🆕(候选) | 热点标注：图上打点，hover/click 弹说明（电商爆款图） | `renderOverlay` | — |
| — | `FavoritePlugin` | — | 🆕(候选) | 收藏/喜欢（心形切换，状态入 context） | `renderGallerySlot("galleryToolbarArea")` + `extendContext(favorited)` | — |

> **说明**：承诺 16 个已 ≥15（满足用户要求）。候选 `HotspotPlugin`/`FavoritePlugin` 不阻塞主流程，可在 P3 末尾视进度追加，追加后目录变 18。第 9、10 项（ThumbSync/Spin360）是规划的 2 个核心缺口，必须首发。

### 4.1 内核可提供的能力（复用 vane-plugin-core）

| 能力 | 内核钩子 / API | gallery 用法 |
| --- | --- | --- |
| 生命周期 | `onMount`/`onUnmount`/`onPropsChange`/`onError` | 主图/缩略图挂载、activeIndex 变化 |
| props 改写 | `transformProps(props)` | Carousel/ThumbPreload 改写 src 序列 |
| data 改写 | `transformData(context, data)` | ThumbPreload 注入预取列表 |
| 渲染插槽（3 类） | `renderHeader`/`renderOverlay`/`renderFooter` | 单图插件（HoverZoom/VideoPoster…）挂 `renderOverlay` |
| 领域钩子扩展 | 索引签名 `[hookName: string]: unknown` | `onThumbChange`/`onFrameChange`/`onActiveChange` |
| 上下文扩展 | `extendContext(ctx => ctx)` | 注入 `activeIndex`/`images`/`frameIndex`/`zoom`/`favorited` |
| 排序 | `config.order` 升序 → `priority` 降序 | 同 profile |
| 跨插件通信 | `context.bus`/`context.shared` | ThumbSync ↔ Carousel/Indicator/Counter 经 `activeIndex` 协调 |
| 强制刷新 | `context.forceUpdate`/`context.setState` | 缩略联动切图后主图重渲染（**必走 `forceUpdate`，勿用 `coreRef.forceUpdate`**——见 vane-waterfall 铁律） |

### 4.2 GalleryCore 多图容器设计（B3）

新增 `src/gallery/`：

- `GalleryCore.tsx`：三段式多图容器
  - `galleryThumbArea`（缩略图条，由 ThumbSync/Indicator 渲染）
  - `galleryMainArea`（主图区：内部用 `LazyLoadImageCore + withPlugins` 渲染当前 `images[activeIndex]`，单图插件自动挂上）
  - `galleryToolbarArea`（工具条：Counter/Indicator/ZoomControl/候选 Favorite 渲染）
  - `galleryOverlay`（灯箱/全屏/热点等浮层，复用 `renderOverlay`）
- `useGalleryRuntime.ts`：包内封装 `usePluginRuntime`，注入 gallery 协调态（`activeIndex`/`setActiveIndex`/`images`/`frameIndex`/`zoom`/`favorited`），`useCallback` 稳定；Core 回调 → 钩子链。
- `slots.tsx`：`renderGallerySlot(plugins, context, slotName)`，复用内核排序 + 逐插件 `PluginErrorBoundary`（仿 vane-profile 的 D3-A 模式）。
- `createGallery.tsx`：工厂 `createGallery(runtimePlugins?, opts?)`，复用 `withPlugins` 范式，返回可直接渲染的 Gallery 组件；默认注入 `galleryPreset()`。

> 关键：单图插件（#1–#8）**直接挂在主图实例的 `withPlugins` 上**，不进 GalleryCore 的插件链；GalleryCore 的插件链只收 gallery 域插件（#9–#16），二者通过 `context.bus`/`activeIndex` 协调。这样 8 个现有单图插件零改动复用。

---

## 五、SOP 命中与红线（B6）

### 5.1 五条 SOP 判定

| # | 判定 | 命中 | 说明 |
| --- | --- | --- | --- |
| 1 | 核心职责薄且稳定 | ✅ | GalleryCore 只做三段式多图壳 + activeIndex 协调，能力全外置 |
| 2 | 需求长尾发散 | ✅ | 16+ 插件（缩放/全屏/热点/收藏/对比/价格…）且可继续加 |
| 3 | 有清晰生命周期/事件 | ✅ | onMount/onUnmount + activeIndex 切换 + frame 切换 + zoom 态变化 |
| 4 | 有天然渲染插槽 | ✅ | 缩略区/主图区/工具条区/浮层 四段槽，比 profile 更完整 |
| 5 | 按需加载能省体积 | ✅ | 子路径导出每个插件 + `vane-lazy-image/gallery` 预设 |

**结论：命中 5/5（高于 vane-profile 的 4/5），与并入 lazy-image 的 B1-B 一致，无开工反对票。**

### 5.2 三条红线

| 红线 | 命中 | 说明 |
| --- | --- | --- |
| ① 框架原子件不立项 | 0 | gallery 是领域引擎，不是 Badge/Tag 原子件 |
| ② 生态成熟专库不立项 | 0 | 非 swiper / photoswipe / react-photo-gallery 之全盘替换；本方案是"在 lazy-image 体系内做图集"，复用其加载/占位/重试基座 |
| ③ 架构不匹配不立项 | 0 | 多图 + 插槽 + 生命周期 + 协调态，插件内核收益高 |

---

## 六、待拍板决策（已随 B1-B + "≥15 插件" 锁定）

### B1 · 包定位（已定 B：并入 lazy-image）

**B（已选）：不建 `vane-gallery` 包，作为 `vane-lazy-image` 的 `gallery` 子特性。** 推翻规划"独立组件"；复用 lazy-image 现有 8 插件基座。

### B2 · 与现有插件边界（已定 A：复用优先）

**A（已选）：8 个现有插件零改动/仅接线复用；仅新写 10 个 gallery 域插件（2 核心 + 8 增强）。** 不重写 HoverZoom/VideoPoster/Gallery/Comparison/PriceTag/PromoBadge/SocialShare/DownloadButton。

### B3 · Core 形态（已定：GalleryCore 多图容器 + 包内 runtime + 领域槽）

新增 `src/gallery/`：三段式多图容器 + `useGalleryRuntime`（封装 `usePluginRuntime`）+ `renderGallerySlot` 四段领域槽。单图插件挂主图实例，gallery 域插件挂 GalleryCore 链，二者经 `activeIndex`/`bus` 协调。

### B4 · 18 插件钩子/槽位映射（见第四章）

ThumbSync/Spin360 = 领域事件钩子 + context 注入（核心缺口）；Carousel/Counter/Indicator/ZoomControl/ThumbPreload = 事件/工具条槽；HoverZoom 等 8 个 = `renderOverlay`（挂主图实例）。详见 4.1/4.2。

### B5 · 体积口径（已定：两层）

- **根入口不动**：lazy-image 根保持 28KB 预算（含 1.x 兼容桶），不新增到桶。
- **gallery 子路径** `vane-lazy-image/gallery`（GalleryCore + runtime + 领域槽 + preset）gzip ≤ **4.0KB**；在 `package.json` 声明 `vane.gallerySizeBudgetKb: 4.0`。
- 新 gallery 插件各自子路径 `vane-lazy-image/custom-plugins/<Name>`，按需引入。
- 规划原 ≤2.5KB（独立包根）口径**被推翻**：并入后隔离边界下移到 gallery 子路径，需承载多图容器，上调到 4.0KB（理由见 `vane.gallerySizeBudgetNote`）。

### B6 · 验收与 SOP 命中（见第五章）

SOP 5/5；红线 0。验收门见 `tasks/18`。

### B7 · 导出策略（已定：新插件不进 1.x 桶）

10 个新增 gallery 插件**只经子路径 `vane-lazy-image/custom-plugins/<Name>` + `vane-lazy-image/gallery` preset 暴露，不加入根桶**，以保护 28KB 根预算。现有 74 插件桶保持不变。

---

## 七、目标结构（在 vane-lazy-image 内新增，非新包）

```
packages/vane-lazy-image/
├── src/
│   ├── index.ts                         # 根入口：保持现有（不新增 gallery 到桶）
│   ├── gallery/                         # 🆕 B1-B 新增子特性
│   │   ├── index.ts                     # 导出 GalleryCore + createGallery + 类型 + galleryPreset
│   │   ├── GalleryCore.tsx              # 三段式多图容器（缩略区/主图区/工具条区/浮层）
│   │   ├── useGalleryRuntime.ts         # 封装 usePluginRuntime + extendContext(activeIndex/images/frameIndex/zoom/favorited)
│   │   ├── slots.tsx                    # renderGallerySlot（四段领域槽 + 错误边界，仿 D3-A）
│   │   ├── createGallery.tsx            # 工厂：withPlugins 范式 + 默认 galleryPreset()
│   │   ├── types.ts                     # GalleryPluginContext（继承 LazyImagePluginContext + 协调态）
│   │   └── presets/gallery.ts           # galleryPreset()：组合 #9–#16 新增插件
│   ├── custom-plugins/                  # 现有 ~74 + 🆕 10 个 gallery 域插件（各自三件套）
│   │   ├── ThumbSyncPlugin/{doc.json,create.ts(x),index.ts}   # 🆕 核心
│   │   ├── Spin360Plugin/{...}                            # 🆕 核心
│   │   ├── CarouselPlugin/{...}                            # 🆕
│   │   ├── CounterPlugin/{...}                             # 🆕
│   │   ├── IndicatorPlugin/{...}                          # 🆕
│   │   ├── ZoomControlPlugin/{...}                        # 🆕
│   │   ├── FullscreenPlugin/{...}                         # 🆕
│   │   ├── ThumbPreloadPlugin/{...}                        # 🆕
│   │   ├── HotspotPlugin/{...}                            # 🆕 候选二期
│   │   └── FavoritePlugin/{...}                           # 🆕 候选二期
│   └── presets/                         # 现有 6 个 + 🆕 gallery
├── package.json                         # 新增 exports: "./gallery" + "./custom-plugins/<Name>"；vane.gallerySizeBudgetKb: 4.0
├── demo/                                # 新增 gallery 工坊 + 场景 + 逐项（复用现有 demo 基建）
└── test/                                # gallery 单测（≥30）
```

---

## 八、风险清单

| # | 风险 | 等级 | 影响 | 缓解 |
| --- | --- | --- | --- | --- |
| R1 | GalleryCore 多图容器与单图 `LazyLoadImageCore` 模型不同，插件实例作用域易混 | 高 | 单图插件挂错实例、activeIndex 不联动 | B3：单图插件挂主图实例；gallery 域插件挂 GalleryCore 链；协调态经 `context.bus`/`activeIndex` 解耦 |
| R2 | ThumbSync 的"缩略→主图切换"无渲染位可挂，是事件/状态驱动 | 中 | 点击缩略图切不了主图 | B4：`extendContext` 注入 `activeIndex`/`setActiveIndex` + 领域钩子 `onThumbChange`；主图消费 `activeIndex` 重渲染 |
| R3 | 缩略联动切图后主图不刷新（renderOverlay 只在宿主渲染时求值，漏 forceUpdate 即"点了没反应"） | 高 | 点击缩略图主图不动 | 铁律：事件里改了闭包状态必须调 `context.forceUpdate()`；**勿用 `coreRef.forceUpdate()`**（overlay element 引用没变，React bailout） |
| R4 | 根预算 28KB 被新插件撑大 | 中 | 触体积红线 | B7：新 gallery 插件不进根桶，只走子路径 + gallery preset |
| R5 | gallery 子路径 >4.0KB | 中 | 触子路径体积红线 | GalleryCore 极薄（壳 + 协调）；插件按需子路径；`check-packages` 把关 |
| R6 | Spin360 帧序列数据来源/格式未定（图片数组 vs sprite） | 中 | 实现分歧 | P3 开工前置：Spin360 先支持"图片数组（每帧一张）"，sprite 作为后续增强 |
| R7 | 候选 Hotspot/Favorite 若追加，目录变 18，需补 doc.json + 单测 | 低 | 范围漂移 | 候选不入承诺范围，P3 末尾视进度追加，追加即补文档与测试 |

---

## 九、验收口径（概要，明细见 `tasks/18`）

1. `pnpm --filter vane-lazy-image build` 通过；`exports` 含 `./gallery` + 10 个 `./custom-plugins/<Name>` 子路径，全部指向真实产物，**不允许死路径**；根桶不被新插件撑大（根体积仍 ≤28KB）；
2. `typecheck` 0 错、`lint` 0 error、`test` **≥30 通过**（GalleryCore 渲染 + 领域槽 + ThumbSync 联动 + Spin360 帧切换 + 8 增强插件表驱动）；
3. **16/16 承诺插件**在 demo 中真实装配运行过（脚本化覆盖闸门），每个都有 `doc.json`；现有 8 插件验证在 gallery 主图上仍工作；
4. **ThumbSync 联动有断言**：点击缩略图 → `activeIndex` 变化 → 主图重渲染（R3 铁律验证：`forceUpdate` 生效）；
5. 体积：gallery 子路径 ≤ **4.0KB gzip**；根入口仍 ≤28KB；`npm pack` 干净（无 demo 资产）；
6. demo 逐页几何体检 0 命中（越界/负坐标/零尺寸/重叠/滚不到底）；
7. 发布 `vane-lazy-image@2.1.0`（minor，含 gallery 子特性），README 增 gallery 段（由 `docs/components/vane-lazy-image/` 同步生成，首屏 `npm install vane-lazy-image`）。

---

## 十、与规划原文的偏差记录

1. **推翻"独立组件 vane-gallery"** → B1-B 并入 lazy-image，复用其 8 个现有插件基座。
2. **体积口径 2.5KB → 4.0KB**（gallery 子路径） → 独立包根下移到 gallery 子路径，需承载多图容器，据实上调，理由见 `vane.gallerySizeBudgetNote`。
3. **插件 4 chips → 18 目录（16 承诺）** → 用户要求"≥15"，补齐 2 核心缺口 + 8 增强 + 2 候选，超出原 4 chip。
4. **新增"GalleryCore 多图容器"设计**（规划未提） → 单图 `LazyLoadImageCore` 无法表达多图 activeIndex 协调，补 B3 式领域槽。
5. **新增 B7 导出策略**（规划未提） → 新 gallery 插件不进 1.x 兼容桶，保护根 28KB 预算。
