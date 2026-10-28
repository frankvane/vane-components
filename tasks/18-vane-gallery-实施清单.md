# 18 · vane-gallery 实施清单（B1-B：并入 vane-lazy-image · 阶段 / 任务 / 验收门）

> 用法：每完成一项打勾；**每个阶段末尾有验收门，不过门不进下一阶段**。
> 关联：设计决策与内核映射见 `tasks/17-vane-gallery-分析.md`；家族范式见 `tasks/16`（vane-profile）
> 前置状态：`vane-lazy-image@2.0.1` 已存在于 `packages/vane-lazy-image`（含 ~74 插件 + `GalleryPlugin`/`HoverZoomPlugin`/`VideoPosterPlugin`/`ComparisonPlugin`/`product-gallery` preset）；**本次不新建包，只在其内新增 `gallery` 子特性 + 10 个 gallery 域插件**。

---

## 阶段总览

| 阶段 | 目标 | 主要产出 | 依赖 | 相对量 |
| --- | --- | --- | --- | --- |
| **P0** | 决策拍板（锁定 B1–B7） | 本文档 + `tasks/17` 结论 | — | S |
| **P1** | 子特性骨架（导出/预算/类型） | `src/gallery/` 可构建、`package.json` exports + `gallerySizeBudgetKb` | P0 | S |
| **P2** | GalleryCore + runtime + 领域槽 | `GalleryCore` + `useGalleryRuntime` + `renderGallerySlot` + `createGallery` | P1 | M |
| **P3** | 10 个 gallery 插件（2 核心 + 8 增强） | ThumbSync/Spin360/Carousel/Counter/Indicator/ZoomControl/Fullscreen/ThumbPreload + 候选 Hotspot/Favorite + 各 `doc.json` | P2 | L |
| **P4** | demo（图集组合场景） | gallery 工坊 + 场景 + 逐项 + 体检 | P3 | M |
| **P5** | 文档 / README / 体积 / 发布 | docs gallery 段、changeset、`2.1.0` | P4 | S |

> 量级口径：S ≈ 半天内、M ≈ 1–2 个专注时段、L ≈ 需要分批推进。本清单是**在 lazy-image 内增量**，比 vane-profile 新建包轻（无包骨架、无依赖策略决策），但 P3 插件数量多（10 个）。

---

## 基线（P0 固化，后续阶段以此为准）

| 指标 | 规划/预期 | 复现/确认命令 |
| --- | --- | --- |
| 包定位 | 商品图集引擎（并入 lazy-image B1-B） | 见 `next-batch-components-plan.html` 第 4 批 + `tasks/17` |
| 承诺插件 | 16 个（8 现有复用 + 10 新增中 8 主 + 2 候选） | `tasks/17` 第四章（#1–#16 承诺，Hotspot/Favorite 候选） |
| 核心缺口 | ThumbSync + Spin360（必首发） | `tasks/17` 3.1 |
| 体积预算 | gallery 子路径 ≤4.0KB gzip；根 ≤28KB 不动 | `tasks/17` B5/B7 |
| SOP 命中 | 5/5 | `tasks/17` 第五章 |
| 红线 | 0 命中 | `tasks/17` 第五章 |
| 复用现有 | 是（HoverZoom/VideoPoster/Gallery/Comparison/PriceTag/PromoBadge/SocialShare/DownloadButton 零改动） | `tasks/17` 3.2 |

---

## P0 · 决策拍板（已随"按 B1-B + ≥15 插件"锁定）

- [x] **P0.1 锁定 B1**：不建独立包，作为 `vane-lazy-image` 的 `gallery` 子特性；推翻规划"独立组件"
- [x] **P0.2 锁定 B2**：8 个现有插件零改动/仅接线复用；仅新写 10 个 gallery 域插件
- [x] **P0.3 锁定 B3**：新增 `src/gallery/`（GalleryCore 三段式多图容器 + `useGalleryRuntime` 封装 `usePluginRuntime` + `renderGallerySlot` 四段领域槽 + `createGallery` 工厂）
- [x] **P0.4 锁定 B4**：ThumbSync/Spin360=领域事件钩子+context 注入；Carousel/Counter/Indicator/ZoomControl/ThumbPreload=事件/工具条槽；HoverZoom 等 8 个挂主图实例 `renderOverlay`；详见 `tasks/17` 4.1/4.2
- [x] **P0.5 锁定 B5**：根不动（≤28KB）；gallery 子路径 ≤4.0KB（`vane.gallerySizeBudgetKb: 4.0`）；新插件各自子路径
- [x] **P0.6 锁定 B6**：SOP 5/5；红线 0；验收口径见 `tasks/17` 第九章
- [x] **P0.7 锁定 B7**：10 个新 gallery 插件只走子路径 + `vane-lazy-image/gallery` preset，**不进 1.x 根桶**

**验收门 P0**：`tasks/17` 与本文档结论一致；B1–B7 全部落纸。

---

## P1 · 子特性骨架（导出 / 预算 / 类型）

### P1.1 package.json 扩展

- [ ] `packages/vane-lazy-image/package.json`：
  - [ ] `exports` 新增 `"./gallery"` → `dist/gallery/index.js`（+ `.d.ts` + `style` 若有）
  - [ ] `exports` 新增 10 个子路径 `"./custom-plugins/<Name>"`（ThumbSync/Spin360/Carousel/Counter/Indicator/ZoomControl/Fullscreen/ThumbPreload/Hotspot/Favorite）→ 各自 `dist/custom-plugins/<Name>/index.js`
  - [ ] 新增 `vane.gallerySizeBudgetKb: 4.0` + `vane.gallerySizeBudgetNote: "GalleryCore 多图容器 + runtime + 领域槽 + preset；并入 lazy-image 后隔离边界从独立包根下移到 gallery 子路径，需承载多图容器，故 2.5→4.0KB"`
  - [ ] 根 `sizeBudgetKb` 保持 28（不动）
- [ ] 确认 `vite.config.ts`（lib 多入口）能产出 `dist/gallery/*` 与 `dist/custom-plugins/<Name>/*` 子路径产物
- [ ] `tsconfig.lib.json` / `vitest.config.ts` 不破坏现有 74 插件构建

### P1.2 类型与运行时预检

- [ ] `src/gallery/types.ts`：从 `LazyImagePluginContext` 派生 `GalleryPluginContext = LazyImagePluginContext & { activeIndex, setActiveIndex, images, frameIndex, setFrameIndex, zoom, favorited }`
- [ ] 确认 `vane-plugin-core` 的 `usePluginRuntime`/`extendContext`/`composeSlots`/`PluginErrorBoundary` 可被 `src/gallery/` 直接 import（lazy-image 当前 core 内联 vs 外部化，沿用现有约定，不引入新依赖）

**验收门 P1**：`build` 产出 `dist/gallery`（即便空壳）且 `exports` 有效；根体积仍 ≤28KB；`typecheck` 0 错；新子路径不进根桶（核对 `exports` 未向根桶追加 10 插件）。

---

## P2 · GalleryCore + runtime + 领域槽

### P2.1 useGalleryRuntime + 类型

- [ ] `src/gallery/useGalleryRuntime.ts`：
  - [ ] `usePluginRuntime({ plugins, props, containerRef, extendContext })`
  - [ ] `extendContext` 注入 `activeIndex`/`setActiveIndex`/`images`/`frameIndex`/`setFrameIndex`/`zoom`/`favorited`（**`useCallback` 稳定**）
  - [ ] Core 回调 → 钩子链：`onMount`/`onUnmount`/`onPropsChange`
  - [ ] 渲染：`composeSlots`（单图插件走主图实例）+ 包内 `renderGallerySlot`（gallery 域插件链）
  - [ ] `transformProps` 链式（Carousel/ThumbPreload 可改写 src 序列）

### P2.2 领域槽（仿 D3-A）

- [ ] 新增 `src/gallery/slots.tsx`：`renderGallerySlot(plugins, context, slotName)`
  - [ ] `slotName`：`galleryThumbArea` / `galleryMainArea` / `galleryToolbarArea` / `galleryOverlay`
  - [ ] 复用内核排序（`order` 升序 → `priority` 降序）+ 逐插件 `PluginErrorBoundary`

### P2.3 GalleryCore 多图容器

- [ ] `src/gallery/GalleryCore.tsx`（forwardRef）：
  - [ ] 三段式：`galleryThumbArea`（缩略条）→ `galleryMainArea`（主图，内部 `LazyLoadImageCore + withPlugins` 渲染 `images[activeIndex]`，单图插件挂此）→ `galleryToolbarArea`（工具条）
  - [ ] `galleryOverlay`（灯箱/全屏/热点）
  - [ ] `containerRefExternal` 双通道；`onMount`/`onUnmount` 透传内核钩子

### P2.4 createGallery 工厂 + 预设骨架

- [ ] `src/gallery/createGallery.tsx`：`createGallery(runtimePlugins?, opts?)` 复用 `withPlugins` 范式，默认注入 `galleryPreset()`
- [ ] `src/gallery/presets/gallery.ts`：`galleryPreset()` 先返回空/占位，P3 填充 #9–#16
- [ ] `src/gallery/index.ts`：导出 `GalleryCore` + `createGallery` + 类型 + `galleryPreset`

### P2.5 单测（第一批）

- [ ] `test/gallery-core.test.ts`：三段顺序（缩略区在上、主图在中、工具条在下）、空插件时三段不渲染
- [ ] `test/gallery-context.test.ts`：`extendContext` 注入 `activeIndex`/`setActiveIndex`/`images`/`frameIndex` 可被插件读到；`forceUpdate` 契约
- [ ] `test/gallery-slots.test.ts`：领域槽按 order/priority 排序、单插件抛错只丢自己那段（错误边界）

**验收门 P2**：`build` 通过；`typecheck` 0 错；`test` ≥8 通过；三段顺序与错误边界有断言；`extendContext` 字段可消费；gallery 子路径体积预检不超 4.0KB（空壳阶段应远小于）。

---

## P3 · 10 个 gallery 插件（2 核心 + 8 增强）

> 统一动作（每个插件）：三件套 `create.ts(x)`（工厂返回 `{ name, hooks }`）+ `doc.json`（name/description/since/tags/config/example/useCases）+ `index.ts` 挂 `.meta` + 桶/预设登记。
> **R3 铁律**：凡在事件/钩子里改了闭包状态（activeIndex/frameIndex/zoom），必须调 `context.forceUpdate()`；**勿用 `coreRef.forceUpdate()`**（overlay element 引用未变，React bailout，表现即"点了没反应、滚动才跳"）。
> 现有 8 插件（#1–#8）**不在此阶段重写**，仅在 P4 demo 中验证它们在 gallery 主图上仍工作。

### P3.1 ThumbSyncPlugin（事件/状态 · 缩略联动 · 核心，必首发）

- [ ] `galleryThumbArea`：渲染缩略图条；点击缩略图 → `setActiveIndex(i)`；键盘左右键切换
- [ ] 领域钩子 `onThumbChange`（经索引签名）；`extendContext` 注入 `activeIndex`/`setActiveIndex`
- [ ] 改 activeIndex 后**必须 `forceUpdate`**（R3）
- [ ] `doc.json`：config 含 `position`(bottom/left)/`gap`/`showActiveRing`
- [ ] 单测：点击缩略图 → `activeIndex` 变化 → 主图消费重渲染（断言主图 src 随 activeIndex 变）

### P3.2 Spin360Plugin（事件/状态 · 360 环物 · 核心，必首发）

- [ ] 帧序列：先支持"图片数组（每帧一张）"（R6 前置）；拖拽/自动旋转切 `frameIndex`
- [ ] 领域钩子 `onFrameChange` + `extendContext(frameIndex/setFrameIndex)`；`forceUpdate`（R3）
- [ ] `doc.json`：config 含 `frames: string[]`/`autoPlay`/`speed`
- [ ] 单测：切帧 → `frameIndex` 变 → 主图渲染对应帧

### P3.3 CarouselPlugin（事件 · 主图轮播）

- [ ] `onActiveChange` + `transformProps`：自动播放/箭头/滑动切换主图（强调"自动流转"，区别于缩略联动）
- [ ] `doc.json`：config 含 `interval`/`showArrows`/`pauseOnHover`
- [ ] 单测：自动播放推进 activeIndex；箭头点击切图（与 ThumbSync 不冲突，经同一 activeIndex 协调）

### P3.4 CounterPlugin（渲染 · 工具条 · 计数）

- [ ] `galleryToolbarArea`：渲染 "3 / 8"，绑定 `activeIndex` + `images.length`
- [ ] 单测：计数随 activeIndex 更新

### P3.5 IndicatorPlugin（渲染 · 工具条 · 圆点）

- [ ] `galleryToolbarArea`：圆点 indicators，点击跳指定 index（经 `setActiveIndex` + `forceUpdate`）
- [ ] 单测：点击第 N 点 → activeIndex=N

### P3.6 ZoomControlPlugin（渲染+状态 · 工具条 · 缩放）

- [ ] `galleryToolbarArea`：放大/缩小/复位按钮（非悬停，移动端/可控）；`extendContext(zoom)` + `forceUpdate`
- [ ] 单测：点击放大 → `zoom` 增大 → 主图缩放态生效

### P3.7 FullscreenPlugin（渲染 · 浮层 · 全屏）

- [ ] `galleryOverlay`：全屏铺满查看主图（区别于灯箱，纯全屏，无缩略）
- [ ] 单测：进入/退出全屏状态切换

### P3.8 ThumbPreloadPlugin（事件 · 性能 · 预取）

- [ ] `onActiveChange` + `transformData`：基于 activeIndex 预取相邻缩略图/主图
- [ ] 单测：activeIndex=3 时预取队列含 2/4（不预取全部）

### P3.9 候选 · HotspotPlugin（渲染 · 浮层 · 热点，视进度追加）

- [ ] `galleryOverlay`：图上打点，hover/click 弹说明（电商爆款图）
- [ ] `doc.json` + 单测：打点渲染 + 点击弹层

### P3.10 候选 · FavoritePlugin（渲染+状态 · 工具条 · 收藏，视进度追加）

- [ ] `galleryToolbarArea`：心形切换；`extendContext(favorited)` + `forceUpdate`
- [ ] `doc.json` + 单测：切换 favorited 状态

### P3.11 预设 + 文档生成

- [ ] `src/gallery/presets/gallery.ts`：填充 `galleryPreset()` = [#9 ThumbSync, #10 Spin360, #11 Carousel, #12 Counter, #13 Indicator, #14 ZoomControl, #15 Fullscreen, #16 ThumbPreload]（候选 #17/#18 不默认包含，留作 opt-in）
- [ ] `src/gallery/index.ts` 导出 `galleryPreset`
- [ ] `docs:plugins` 生成目录（确认生成器扫 `src/custom-plugins/<Name>/doc.json`；路径不符参考 vane-card C3.4 修复经验）

**验收门 P3**：`doc.json` **16/16 承诺**（候选若追加则 18/18）；`docs:plugins` 行数对齐；`typecheck` 0 错；`test` ≥30 通过（8 增强表驱动 + 领域槽 + ThumbSync 联动 + Spin360 帧切换）；**ThumbSync 切换 activeIndex 后主图重渲染有断言（R3 铁律验证）**；gallery 子路径体积 ≤4.0KB。

---

## P4 · demo（图集组合场景）

### P4.1 骨架

- [ ] `demo/vite.config.ts`：包名 alias（`vane-lazy-image`/`/gallery`/`/custom-plugins/*` → `src`），base `./`，新端口（避开现有）
- [ ] HashRouter 视角：`#/` 总览、`#/gallery` 图集工坊、`#/gallery/scenarios` 场景、`#/gallery/demos/:slug` 逐项
- [ ] 视觉沿用家族"深色编辑部 / 规格板"版式

### P4.2 图集工坊（`#/gallery`）

- [ ] `import.meta.glob("/src/custom-plugins/*/doc.json")` 驱动 gallery 域插件勾选（10 个）
- [ ] 勾选即实时装配（`useGallery`，按插件名集合记忆组件类型）

### P4.3 场景库（`#/gallery/scenarios`）

- [ ] 电商商品图集：缩略联动 + 放大镜 + 视频位 + 灯箱 + 价格/促销 + 对比（组合 #1–#8 现有 + #9–#16 新增）
- [ ] 360 环物展示：Spin360 + 缩略 + 计数
- [ ] 一卡两栏 + 通栏代码（`?raw` 读同一 `.tsx`）

### P4.4 逐项示例（`#/gallery/demos/:slug`，16 页 = 8 现有 + 8 新增）

- [ ] 每页 `meta` + 装配函数（骨架由 `DemoPage` 提供）；8 现有插件验证在 gallery 主图上仍工作

### P4.5 体检闸门（替代截图）

- [ ] `scripts/audit-gallery.mjs`：断言越界/负坐标/零尺寸/重叠/`scrollHeight` 盖不住底边
- [ ] 结果：所有 gallery 路由 **0 命中**

**验收门 P4**：`build:demo` 通过；体检 **0 命中**；每卡有代码块 + 复制按钮；**16/16 承诺插件装配过**；逐项示例 16 页可打开；现有 8 插件在 gallery 主图上验证仍工作。

---

## P5 · 文档 / README / 体积 / 发布

- [ ] **P5.1** `docs/components/vane-lazy-image/` 增 gallery 段：
  - [ ] `gallery.md`：卖点 + 安装 + 30 秒示例 + 导入体积表（gallery 子路径 4.0KB）+ 插件速览（18 目录）+ 演示站入口
  - [ ] `api.md` 补：`GalleryCoreProps`/`GalleryCoreRef`/`GalleryPluginContext` 全字段/领域槽名表/ThumbSync 与 Spin360 协调态说明
  - [ ] `plugins.md` 补：18 插件 + priority / 渲染位置 / 与现有单图插件的关系（挂主图实例 vs 挂 GalleryCore 链）
  - [ ] `recipes.md` 补：图集组合配方 + 组合经验（单图插件 vs gallery 域插件分工 / activeIndex 协调 / R3 forceUpdate 铁律）
- [ ] **P5.2** README：`node scripts/sync-readme.mjs` 生成，首屏 `npm install vane-lazy-image` + gallery 段
- [ ] **P5.3** `docs/guide/decisions.md` 补 ADR（gallery 并入 lazy-image / GalleryCore 多图容器 / 新插件不进 1.x 桶 / 子路径 4.0KB）
- [ ] **P5.4** `.changeset/vane-lazy-image-210.md`（minor）：gallery 子特性 + 10 新插件
- [ ] **P5.5** `npm pack --dry-run`：只含 `dist` + `README.md` + `package.json`，无 demo 资产
- [ ] **P5.6** 回归：`eslint` 0 error、`tsc --noEmit` 0 错、`vitest` 通过、`check-packages` 根 ≤28KB + gallery 子路径 ≤4.0KB、`vitepress build` 通过
- [ ] **P5.7** 发布 `vane-lazy-image@2.1.0`（发布动作单独确认；注意 `.npmrc` token 写用户级、不提交；publish 显式 `--registry`）

**验收门 P5**：`check-packages` 全绿（根 ≤28KB + gallery ≤4.0KB）；`docs:build` 通过；README 由 docs 同步生成；pack 干净；changeset 就位。

---

## 验收门汇总

| 阶段 | 硬指标 |
| --- | --- |
| P0 | B1–B7 落纸、与分析文档一致 |
| P1 | gallery 子路径产物有效 / 根 ≤28KB 不进新插件到桶 / typecheck 0 |
| P2 | 三段式顺序 + 错误边界有断言 / context 字段可消费 / test ≥8 / 子路径体积预检 |
| P3 | doc.json 16/16 承诺 / docs:plugins 对齐 / test ≥30 / ThumbSync 联动有断言（R3）/ 子路径 ≤4.0KB |
| P4 | demo build 通过 / 体检 0 命中 / 16 插件装配过 / ≥16 页可打开 / 现有 8 插件验证仍工作 |
| P5 | check-packages（根+子路径）全绿 / docs:build 通过 / pack 干净 / changeset 就位 |

---

## 不做清单（明确排除，避免范围蔓延）

- ❌ 不新建 `vane-gallery` 包（B1-B 并入 lazy-image）
- ❌ 不把图集塞进单图 `LazyLoadImageCore`（图集是多图容器，模型不同）
- ❌ 不重写现有 8 插件（HoverZoom/VideoPoster/Gallery/Comparison/PriceTag/PromoBadge/SocialShare/DownloadButton）
- ❌ 不把 10 个新 gallery 插件加进 1.x 兼容根桶（B7，保护 28KB）
- ❌ 不做 AR/3D 试穿（`ARViewPlugin` 不立项，避免外部依赖）
- ❌ 不在 P1–P3 顺手做 lazy-image 视觉重设计（样式若动，独立提交）

---

## 依赖与并行

```
P0（决策）── P1（骨架）── P2（GalleryCore+runtime+槽）── P3（10 插件）── P4（demo）── P5（文档/发布）
```

- **P3 十个插件之间可分批推进**（无相互依赖，各自独立 `doc.json` + 单测）；ThumbSync/Spin360 必首发，其余可并行。
- **P4.2 工坊可与 P3 交叉**（场景只依赖已写好的插件）。
- 候选 Hotspot/Favorite 在 P3 末尾视进度追加，追加即补文档与测试。
- 每个阶段结束都跑一次 `pnpm verify`（根目录），把回归锁在阶段内。

---

## 执行记录（P1 起逐阶段追加）

| 阶段 | 计划指标 | 实测 |
| --- | --- | --- |
| P0 | B1–B7 落纸 | ✅ 见 `tasks/17` + 本文档 |
| P1 | 子特性骨架 + 导出 + 预算 | ⏳ 待开工 |
| P2 | GalleryCore + runtime + 领域槽 | ⏳ |
| P3 | 10 插件 + doc.json（16 承诺） | ⏳ |
| P4 | demo + 体检 0 命中 | ⏳ |
| P5 | 文档 + 发布 2.1.0 | ⏳ |
