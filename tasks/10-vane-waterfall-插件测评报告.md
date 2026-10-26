# vane-waterfall 插件测评报告

> 测评对象：`packages/vane-waterfall` 全部 **26** 个插件 ｜ 示例站：`demo/`（`#/demo/:slug`，一插件一页）
> 测评时间：2026-10-26 ｜ 环境：Chromium headless（Playwright 驱动）+ 静态产物 `demo-dist`，视口 1440×900
> 证据来源：`doc.json` 静态解析 + 34 条路由真浏览器实测 + 逐控件推两端 + 交互探针（滚动 / 点击 / 键盘 / 拖拽 / 系统偏好）
> 对照口径：与 `tasks/05-插件测评报告-v2.md`（vane-lazy-image）同构，四项权重一致，取证层按瀑布流的交互特征替换

---

## 目录

1. [一、结论](#一结论) —— 本轮结果与关键事实
2. [二、本轮修复清单](#二本轮修复清单) —— 测评过程中发现并修掉的 4 个缺陷
3. [三、测评方法与评分口径](#三测评方法与评分口径) —— 四层取证 + 100 分怎么算
4. [四、总体结果](#四总体结果) —— 等级分布 / 证据分层 / 分组得分
5. [五、一览总表](#五一览总表) —— 插件 → 功能 → 场景 → 示例页 → 实现度（一页看全）
6. [六、分组明细](#六分组明细) —— 5 组 26 个插件逐条对照表
7. [七、逐插件测评](#七逐插件测评) —— 功能 / 场景 / 参数 / 证据 / 评分 / 建议
8. [八、高级 API 与内核能力页](#八高级-API-与内核能力页) —— 6 个基础与高级页 + 2 个虚拟化能力页
9. [九、三道闸门](#九三道闸门) —— 静态核对 / 几何体检 / 控件响应
10. [十、遗留问题与下一步](#十遗留问题与下一步) —— 诚实清单
11. [十一、附录](#十一附录) —— 复现方式与数据文件

---

## 一、结论

### 1.1 一句话

**26 个插件全部有独立示例页，平均实现度 96.7 分，A 级 26 个 / B 0 / C 0 / D 0。**

### 1.2 关键事实

1. **覆盖率 100%，不是「抽测」**：26 个插件目录 ↔ 26 个插件示例页一一对应（`uncovered: []`），另有 2 个内核能力页（虚拟化）与 6 个基础/高级页，合计 34 条路由；插件名 ↔ 工厂名 ↔ 装配代码三方交叉核对无孤儿。
2. **文档不是「有就行」**：56 个参数声明 **56 个有说明**（覆盖率 100%），每个插件都有 features / useCases / notes / example 四件套；插件的坑位提示还额外写进了示例页右栏（26/26 页有 `note`）。
3. **效果可验证分三层**：10 个插件默认态就能看见（读数 / 角标 / 分组浮层 / 列数变化）；2 个要拖控件或看属性层；12 个必须交互（滚动 / 点击 / 键盘 / 拖拽 / 输入）才显形；2 个（ReducedMotion、Recycle）依赖系统偏好或本就没有可视差异，已在页面上写明「怎么验」。
4. **交叉验证抓出 4 个真缺陷，全部已修**：虚拟化滚动后同列重叠（布局按估值算完不再重排）、ReducedMotion 的过渡移除被 TransitionPlugin 的内联样式覆盖、URLSync 示例页「输入 → URL」链路是断的（装配写错了键名）、几何闸门只读 transform 导致 left/top 定位页假报警。详见第二章。
5. **34 条路由 0 console error、0 几何命中**：几何体检覆盖越界 / 负坐标 / 零尺寸 / 两两重叠（含跨列）/ `scrollHeight` 盖不住内容底边，首轮命中后复测一轮，只有复测仍命中才算真问题。
6. **控件真的接得上**：21 个控件逐个推两端，除 4 页里被显式标了 `nonLayout` 的（节流阈值 / 池大小 / 过渡时长 / debug 开关）之外，全部改变了逐项指纹；剩下这些「不改版式」的参数逐个在页面上写明了它影响的是什么。
7. **虚拟化不是「能跑就行」**：1000 项数据只渲染 10–18 个 DOM，滚到 30% / 60% / 95% 三处实测同列零重叠（修前 9–13 处）；`dynamicHeights` 打开时实测高度变化后位置会被修正。

## 二、本轮修复清单

> 这一章是本轮测评的「副作用」：一边量一边发现，发现即修，修完复测。编号沿用 lazy-image 的 P0/P1 习惯。

| 编号 | 现象 | 根因 | 改法 | 影响面 |
| --- | --- | --- | --- | --- |
| **P0-1** | 虚拟瀑布流滚动后同一列卡片叠在一起（实测 30%/60%/95% 处各有 9–13 处重叠） | 项先按 `estimateHeight` 落位；挂载后量到真高时，`ResizeObserver` 只判断「测量值是否变化」，而 ref 回调已经把值写进 `measuredHeights`，判断恒为 false；位置已存在时也不会补布局 → 估值高度就一直用下去 | 判断改成「当前 position.height 和实测高度是否一致」，不一致且没为这个高度补过就重排（`heightRepairRef` 防震荡） | 两个虚拟化页 + 任何开 `virtualize` 的消费方 |
| **P0-2** | `31-reduced-motion` 打开系统「减少动态效果」后，读数说「过渡已清掉」，元素上仍是 `transition: 0.24s` | ReducedMotion 只在 `transformProps` 里写 `itemStyle.transition`；TransitionPlugin 在 `onItemMount` / `onLayout` 里直接写 `element.style.transition`，内联样式更晚生效，覆盖回来 | 补 `onItemMount` / `onLayoutComplete` 两个钩子，在过渡插件之后再清一次 | 所有同时装 ReducedMotion + Transition 的页面 |
| **P1-1** | `24-url-sync` 输入关键词后列表不动、地址栏也不变（页面承诺「地址栏跟着变」） | 三处装配错误：① `keys: ["query"]` 但 props 上根本没有 `query` 这个键（应是 `searchQuery`）；② 过滤写成了 Core 的 `filterFn`，而 Core 并不消费它（只有 FilterPlugin 读）；③ 插件 `onMount` 广播的 `urlsync:init` 无人消费 | 改成 `keys: ["searchQuery"]` + 装 `SearchPlugin` + 挂载时读一次 `location.search` 回填控件 | 该示例页；顺带把「Core 不消费 filterFn」这条写进 note |
| **P2-1** | 几何闸门对「关掉 transform 定位」的页面报 `empty`（容器里没有已布局项） | `translateOf()` 只读 `transform`，遇到 `useTransform: false`（ReducedMotion 会切过去）直接返回 null，所有项被跳过 | 读不到 transform 时退回 `offsetLeft/offsetTop` | `scripts/audit-demos.mjs` 这道闸门本身 |

修复后复测：`audit:demos` 37 页 0 命中、`audit:controls` 23 个滑杆全响应、`pnpm verify` 全绿（lint 0 error / tsc 0 / 37 单测 / 包体积达标）。

## 三、测评方法与评分口径

### 3.1 四层取证（全部实测）

| 层 | 内容 | 规模 |
| --- | --- | --- |
| 静态基线 | 逐插件解析 `doc.json` 全字段（description / config / features / useCases / notes / example）+ 工厂源码 + 钩子用量 + priority | 26 个插件、1505 行源码、56 个参数 |
| 结构实测 | 逐条访问 `#/demo/:slug`，采集标题 / 分组 / 插件清单 / 控件数 / 双份代码长度 / 舞台渲染项数与列数 | 34 条路由 |
| 响应实测 | 每个控件推到两端（数字滑杆两端都试），比较逐项指纹：项数 + 列数 + 内容总高 + 每项 (列号,x,y,高) 的哈希 + 覆盖层/语义属性计数 | 21 个控件 |
| 交互实测 | 滚到 60% / 滚到底 / 点舞台第一个按钮 + 8 个页面专属探针（输入、键盘 b/r、HTML5 拖拽、系统偏好、锚点跳转…） | 34 页 × 4 态 |

### 3.2 评分（100 分）

| 维度 | 权重 | 细则 |
| --- | --- | --- |
| 结构交付 | 35 | 路由可达且标题一致 9 + 舞台渲染出项 12 + 控件覆盖率 ×6 + 双份代码（最小装配 + 完整源码）8 |
| 效果可验证 | 45 | 默认可见 45 ／ 拖控件可见 43 ／ 属性层可见 42 ／ 交互后可见 40 ／ 无可视差异 38 ／ 环境模拟 32 ／ 无任何证据 8 ／ 崩溃 0 |
| 文档完备 | 12 | features ≥3（3）、useCases ≥2（3）、notes ≥1（2）、参数说明覆盖率（1.5）、可运行示例（1.5）、页面坑位提示（1） |
| 运行时健康 | 8 | 无 console error（6）、几何 0 命中（2） |

等级：**A ≥ 85（可直接验收）｜B 72–84（基本可用）｜C 60–71（需修复）｜D < 60（不可用）**

### 3.3 与 lazy-image 口径的差异（透明说明）

lazy-image 的效果取证靠「画面 / 属性 / 请求」三层，瀑布流没有请求层，多了三样它没有的东西，所以「效果可验证」的取证方式换成：

- **页内读数**（`.stage-tip` 一类）：插件状态被渲染成一行文字（「8 组：…」「渲染 10 个 / 总高 84443px」「池子 24」），这是最硬的一条证据——它由插件状态直接算出，不是文案。
- **逐项指纹**：改一个参数后，比较每张卡的列号与坐标哈希。这比「看着变了」严格：3 列排得整整齐齐也可能是控件压根没接上。
- **交互探针**：滚动、键盘、HTML5 拖拽、`emulateMedia({ reducedMotion })`。这些效果只在用户动作之后出现，静态截图永远拍不到。

权重、结构与运行时两项的口径与 lazy-image 完全一致，只有效果层换了取证工具，没有放宽阈值。

## 四、总体结果

### 4.1 等级分布

| 等级 | 数量 | 占比 |
| --- | --- | --- |
| A | 26 | 100.0% |
| B | 0 | 0.0% |
| C | 0 | 0.0% |
| D | 0 | 0.0% |
| **合计** | 26 | 100% |

### 4.2 效果取证分层

| 分层 | 数量 | 说明 |
| --- | --- | --- |
| 默认态可见 | 10 | 打开页面就有读数 / 角标 / 结构变化，不用动手 |
| 拖控件可见 | 1 | 默认参数下差异不明显，推一下滑杆立刻看得出 |
| 属性层可见 | 1 | 画面无差异，DOM 语义属性已注入，页面提供「检查」按钮 |
| 交互后可见 | 12 | 滚动 / 点击 / 键盘 / 拖拽 / 输入之后才出现 |
| 无可视差异 | 1 | 性能类，只有 DOM 数与长任务这类指标能证明，页面已写明 |
| 环境模拟 | 1 | 依赖系统偏好 |

### 4.3 分组得分

| 分组 | 插件数 | 平均分 | A | B | C | D |
| --- | --- | --- | --- | --- | --- | --- |
| 布局类 | 6 | 100 | 6 | 0 | 0 | 0 |
| 数据管线类 | 5 | 98 | 5 | 0 | 0 | 0 |
| 界面与状态类 | 6 | 96.2 | 6 | 0 | 0 | 0 |
| 交互与分析类 | 5 | 94.6 | 5 | 0 | 0 | 0 |
| 性能与动效类 | 4 | 93.8 | 4 | 0 | 0 | 0 |
| **合计** | 26 | **96.7** | 26 | 0 | 0 | 0 |

### 4.4 插件页控件响应一览

| 示例页 | 控件 | 有响应的 | 标记 nonLayout（本就不改版式） |
| --- | --- | --- | --- |
| `alignment` | 1 | 1 | 0 |
| `auto-column` | 3 | 3 | 0 |
| `debounce-layout` | 2 | 1 | 1 |
| `filter` | 1 | 1 | 0 |
| `fixed-height` | 1 | 1 | 0 |
| `gap-plugin` | 2 | 2 | 0 |
| `grouping` | 1 | 1 | 0 |
| `infinite-scroll` | 1 | 0 | 1 |
| `pagination` | 2 | 2 | 0 |
| `pin-item` | 1 | 1 | 0 |
| `recycle` | 1 | 0 | 1 |
| `responsive-columns` | 1 | 1 | 0 |
| `sort` | 1 | 1 | 0 |
| `throttle` | 2 | 0 | 2 |
| `transition` | 1 | 1 | 0 |

## 五、一览总表

> 26 个插件按「布局 → 数据 → 界面 → 交互 → 性能」排。功能列取 `doc.json` 的 description 首句，场景列取 useCases 前两条；实现度见第七章的评分明细。

| # | 插件 | 功能（一句话） | 应用场景 | 示例页 | 实现度 | 等级 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Alignment<br>`AlignmentPlugin` | 设置瀑布流的列分配策略 | 内容流：默认 shortest / 等长卡片：balanced 更整齐 | [`#/demo/alignment`](http://127.0.0.1:3300/#/demo/alignment) | **100** | A |
| 2 | AutoColumn<br>`AutoColumnPlugin` | 按「容器可用宽度 ÷ 最小列宽」自动决定列数，取代写死 3 列 | 响应式信息流 / 侧边栏宽度可拖动的后台看板 | [`#/demo/auto-column`](http://127.0.0.1:3300/#/demo/auto-column) | **100** | A |
| 3 | FixedHeight<br>`FixedHeightPlugin` | 把数据里带 height 字段的项统一改写为固定高度，瀑布流变成等高网格 | 商品列表（图固定比例） / 后台看板卡片 | [`#/demo/fixed-height`](http://127.0.0.1:3300/#/demo/fixed-height) | **100** | A |
| 4 | Gap<br>`GapPlugin` | 把 rowGap / columnGap 收敛到一处配置，并支持按窗口宽度切换间距（窄屏 8… | 设计规范里间距随断点变化 / 同一组件在不同页面用不同密度 | [`#/demo/gap-plugin`](http://127.0.0.1:3300/#/demo/gap-plugin) | **100** | A |
| 5 | PinItem<br>`PinItemPlugin` | 把若干索引的项钉在顶部指定列，其余项从它们下方继续排 | 信息流首位的推广卡 / 公告 / 置顶帖 | [`#/demo/pin-item`](http://127.0.0.1:3300/#/demo/pin-item) | **100** | A |
| 6 | ResponsiveColumns<br>`ResponsiveColumnsPlugin` | 用一张断点表控制列数，命中哪档用哪档 | 严格对齐设计断点的站点 / 同一个组件嵌在不同宽度的容器里 | [`#/demo/responsive-columns`](http://127.0.0.1:3300/#/demo/responsive-columns) | **100** | A |
| 7 | Filter<br>`FilterPlugin` | 用谓词函数过滤数据，优先读 `props.filterFn`，没有就用工厂里传入的 pred… | 分类 Tab 切换 / 只看有货 / 只看促销 | [`#/demo/filter`](http://127.0.0.1:3300/#/demo/filter) | **100** | A |
| 8 | InfiniteScroll<br>`InfiniteScrollPlugin` | 监听 Core 的 onReachBottom，在距底部 `threshold` 像素内触发… | 信息流无限滚动 / 画廊继续加载 | [`#/demo/infinite-scroll`](http://127.0.0.1:3300/#/demo/infinite-scroll) | **95** | A |
| 9 | Pagination<br>`PaginationPlugin` | 读 `props.pageIndex`（1 基）与 `props.pageSize` 切片 | 后台列表分页 / 搜索结果分页 | [`#/demo/pagination`](http://127.0.0.1:3300/#/demo/pagination) | **100** | A |
| 10 | Search<br>`SearchPlugin` | 读取 `props.searchQuery`，在指定字段上做大小写不敏感的 `include… | 站内搜索结果页 / 后台列表即时搜索 | [`#/demo/search`](http://127.0.0.1:3300/#/demo/search) | **95** | A |
| 11 | Sort<br>`SortPlugin` | 用比较函数排序，优先读 `props.sortComparator` | 价格 / 时间排序 / 热度排序 | [`#/demo/sort`](http://127.0.0.1:3300/#/demo/sort) | **100** | A |
| 12 | A11y<br>`A11yPlugin` | 把瀑布流补成读屏可理解的列表：容器 `role=list` + `aria-label`，每… | 政务 / 金融等合规站点 / 读屏用户可用的信息流 | [`#/demo/a11y`](http://127.0.0.1:3300/#/demo/a11y) | **97** | A |
| 13 | Bookmark<br>`BookmarkPlugin` | 长列表读到一半要跳走时按 **B** 存位置，回来按 **R** 复原 | 长文列表阅读 / 后台大表格浏览 | [`#/demo/bookmark`](http://127.0.0.1:3300/#/demo/bookmark) | **95** | A |
| 14 | Grouping<br>`GroupingPlugin` | 用 groupBy 把项按业务字段分组，结果放进 sharedData 的 `GROUPS`… | 按分类分组的信息流 / 按日期分组的时间线 | [`#/demo/grouping`](http://127.0.0.1:3300/#/demo/grouping) | **100** | A |
| 15 | StatePersistence<br>`StatePersistencePlugin` | 三个时机各做一件事：首次渲染把快照里的 pageIndex / searchQuery 注入… | 后台列表刷新不丢页 / 搜索结果返回定位 | [`#/demo/state-persistence`](http://127.0.0.1:3300/#/demo/state-persistence) | **95** | A |
| 16 | StickyHeader<br>`StickyHeaderPlugin` | 在滚动容器内渲染一条 `position: sticky` 的标题条，始终贴住容器顶部 | 分组信息流 / 按日期分组的时间线 | [`#/demo/sticky-header`](http://127.0.0.1:3300/#/demo/sticky-header) | **95** | A |
| 17 | URLSync<br>`URLSyncPlugin` | props 变化时把指定键写进 URL（hash 或 search），挂载时读出来广播 `u… | 搜索结果可分享 / 后台筛选状态可刷新 | [`#/demo/url-sync`](http://127.0.0.1:3300/#/demo/url-sync) | **95** | A |
| 18 | ClickAnalytics<br>`ClickAnalyticsPlugin` | 统计每次项点击并累计总数，向 bus 发 `analytics:click`（带 index… | 内容流点击率统计 / AB 实验埋点 | [`#/demo/click-analytics`](http://127.0.0.1:3300/#/demo/click-analytics) | **95** | A |
| 19 | DragReorder<br>`DragReorderPlugin` | 用原生 draggable 给每个项加上拖拽能力，松手时回调 `onReorder(from… | 后台卡片排序 / 收藏夹手动排序 | [`#/demo/drag-reorder`](http://127.0.0.1:3300/#/demo/drag-reorder) | **95** | A |
| 20 | HeatmapAnalytics<br>`HeatmapAnalyticsPlugin` | 按项统计「进入视口次数」与「点击次数」，用于粗粒度热力分析 | 信息流曝光分析 / 广告位可见性验证 | [`#/demo/heatmap-analytics`](http://127.0.0.1:3300/#/demo/heatmap-analytics) | **95** | A |
| 21 | Recycle<br>`RecyclePlugin` | 纯绘制层优化：项离开视口就 `visibility: hidden`，回来再显示 | 项内含视频 / canvas / 长列表滚动发虚 | [`#/demo/recycle`](http://127.0.0.1:3300/#/demo/recycle) | **93** | A |
| 22 | ScrollAnchor<br>`ScrollAnchorPlugin` | 不需要自己算索引：外部只管 `bus.emit("anchor:scrollToId", {… | 从通知跳转到具体卡片 / 目录点击定位 | [`#/demo/scroll-anchor`](http://127.0.0.1:3300/#/demo/scroll-anchor) | **95** | A |
| 23 | DebounceLayout<br>`DebounceLayoutPlugin` | 只调 debounceDelay：容器宽度连续变化（抽屉展开、分栏拖拽）时，等变化停下来再算… | 可折叠侧栏 / 分栏宽度拖拽 | [`#/demo/debounce-layout`](http://127.0.0.1:3300/#/demo/debounce-layout) | **98** | A |
| 24 | ReducedMotion<br>`ReducedMotionPlugin` | 检测 `prefers-reduced-motion: reduce`，命中后把 useTr… | 政务 / 医疗类站点 / 无障碍合规要求 | [`#/demo/reduced-motion`](http://127.0.0.1:3300/#/demo/reduced-motion) | **87** | A |
| 25 | Throttle<br>`ThrottlePlugin` | 接管 Core 的 throttleDelay（滚动回调节流）与 debounceDelay… | 低端安卓机长列表 / 滚动时 CPU 占用过高 | [`#/demo/throttle`](http://127.0.0.1:3300/#/demo/throttle) | **95** | A |
| 26 | Transition<br>`TransitionPlugin` | 给每个项挂上 transform + opacity 的 CSS 过渡，布局重排、分页切换、… | 筛选 / 排序后重排 / 分页切换 | [`#/demo/transition`](http://127.0.0.1:3300/#/demo/transition) | **95** | A |

> 全表 26 行，实现度全部 ≥ 85（A 级）。最低的 `ReducedMotion` 87 分不是「做得差」，而是「效果要改系统设置才看得见」，属于取证难度而不是质量问题——详见 4.2 与第七章第 24 条。

## 六、分组明细

### 布局类（6）

> 决定卡片落在哪一列、多宽、多高

| # | 插件 | 工厂 | 钩子 | 验收路径 | 示例页 | 实现度 | 等级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Alignment<br>`AlignmentPlugin` | `createAlignmentPlugin` | 2 | 默认可见 | [`#/demo/alignment`](http://127.0.0.1:3300/#/demo/alignment) | 100 | A |
| 2 | AutoColumn<br>`AutoColumnPlugin` | `createAutoColumnPlugin` | 1 | 默认可见 | [`#/demo/auto-column`](http://127.0.0.1:3300/#/demo/auto-column) | 100 | A |
| 3 | FixedHeight<br>`FixedHeightPlugin` | `createFixedHeightPlugin` | 2 | 默认可见 | [`#/demo/fixed-height`](http://127.0.0.1:3300/#/demo/fixed-height) | 100 | A |
| 4 | Gap<br>`GapPlugin` | `createGapPlugin` | 2 | 默认可见 | [`#/demo/gap-plugin`](http://127.0.0.1:3300/#/demo/gap-plugin) | 100 | A |
| 5 | PinItem<br>`PinItemPlugin` | `createPinItemPlugin` | 2 | 默认可见 | [`#/demo/pin-item`](http://127.0.0.1:3300/#/demo/pin-item) | 100 | A |
| 6 | ResponsiveColumns<br>`ResponsiveColumnsPlugin` | `createResponsiveColumnsPlugin` | 1 | 默认可见 | [`#/demo/responsive-columns`](http://127.0.0.1:3300/#/demo/responsive-columns) | 100 | A |

> **小结**：本组平均 100 分。六个插件全部改版式，拖一次控件就能看出区别，是最好验收的一组。

### 数据管线类（5）

> 决定哪些项进入渲染、按什么顺序、分几页

| # | 插件 | 工厂 | 钩子 | 验收路径 | 示例页 | 实现度 | 等级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Filter<br>`FilterPlugin` | `createFilterPlugin` | 2 | 默认可见 | [`#/demo/filter`](http://127.0.0.1:3300/#/demo/filter) | 100 | A |
| 2 | InfiniteScroll<br>`InfiniteScrollPlugin` | `createInfiniteScrollPlugin` | 3 | 交互后可见 | [`#/demo/infinite-scroll`](http://127.0.0.1:3300/#/demo/infinite-scroll) | 95 | A |
| 3 | Pagination<br>`PaginationPlugin` | `createPaginationPlugin` | 2 | 默认可见 | [`#/demo/pagination`](http://127.0.0.1:3300/#/demo/pagination) | 100 | A |
| 4 | Search<br>`SearchPlugin` | `createSearchPlugin` | 2 | 交互后可见 | [`#/demo/search`](http://127.0.0.1:3300/#/demo/search) | 95 | A |
| 5 | Sort<br>`SortPlugin` | `createSortPlugin` | 2 | 默认可见 | [`#/demo/sort`](http://127.0.0.1:3300/#/demo/sort) | 100 | A |

> **小结**：本组平均 98 分。五个插件串成一条管线（Filter 40 → Sort 30 → Search 20 → Pagination 10），顺序错了会出现「第 2 页空」这类问题，示例页按正确顺序装配。

### 界面与状态类（6）

> 注入语义 / 覆盖层 / 与外部世界（URL、存储）打交道

| # | 插件 | 工厂 | 钩子 | 验收路径 | 示例页 | 实现度 | 等级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A11y<br>`A11yPlugin` | `createA11yPlugin` | 3 | 属性层可见 | [`#/demo/a11y`](http://127.0.0.1:3300/#/demo/a11y) | 97 | A |
| 2 | Bookmark<br>`BookmarkPlugin` | `createBookmarkPlugin` | 1 | 交互后可见 | [`#/demo/bookmark`](http://127.0.0.1:3300/#/demo/bookmark) | 95 | A |
| 3 | Grouping<br>`GroupingPlugin` | `createGroupingPlugin` | 4 | 默认可见 | [`#/demo/grouping`](http://127.0.0.1:3300/#/demo/grouping) | 100 | A |
| 4 | StatePersistence<br>`StatePersistencePlugin` | `createStatePersistencePlugin` | 4 | 交互后可见 | [`#/demo/state-persistence`](http://127.0.0.1:3300/#/demo/state-persistence) | 95 | A |
| 5 | StickyHeader<br>`StickyHeaderPlugin` | `createStickyHeaderPlugin` | 1 | 交互后可见 | [`#/demo/sticky-header`](http://127.0.0.1:3300/#/demo/sticky-header) | 95 | A |
| 6 | URLSync<br>`URLSyncPlugin` | `createURLSyncPlugin` | 2 | 交互后可见 | [`#/demo/url-sync`](http://127.0.0.1:3300/#/demo/url-sync) | 95 | A |

> **小结**：本组平均 96.2 分。这一组多半要动手（滚动 / 按键 / 输入）才显形，页面都给了明确的操作提示。

### 交互与分析类（5）

> 用户操作与行为采集

| # | 插件 | 工厂 | 钩子 | 验收路径 | 示例页 | 实现度 | 等级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ClickAnalytics<br>`ClickAnalyticsPlugin` | `createClickAnalyticsPlugin` | 3 | 交互后可见 | [`#/demo/click-analytics`](http://127.0.0.1:3300/#/demo/click-analytics) | 95 | A |
| 2 | DragReorder<br>`DragReorderPlugin` | `createDragReorderPlugin` | 1 | 交互后可见 | [`#/demo/drag-reorder`](http://127.0.0.1:3300/#/demo/drag-reorder) | 95 | A |
| 3 | HeatmapAnalytics<br>`HeatmapAnalyticsPlugin` | `createHeatmapAnalyticsPlugin` | 4 | 交互后可见 | [`#/demo/heatmap-analytics`](http://127.0.0.1:3300/#/demo/heatmap-analytics) | 95 | A |
| 4 | Recycle<br>`RecyclePlugin` | `createRecyclePlugin` | 4 | 无可视差异 | [`#/demo/recycle`](http://127.0.0.1:3300/#/demo/recycle) | 93 | A |
| 5 | ScrollAnchor<br>`ScrollAnchorPlugin` | `createScrollAnchorPlugin` | 2 | 交互后可见 | [`#/demo/scroll-anchor`](http://127.0.0.1:3300/#/demo/scroll-anchor) | 95 | A |

> **小结**：本组平均 94.6 分。这组最依赖真实交互：点击、拖拽、滚动。探针用 HTML5 DragEvent 与真实滚动验证，不接受「代码里有」。

### 性能与动效类（4）

> 回调频率、布局时机、过渡与降级

| # | 插件 | 工厂 | 钩子 | 验收路径 | 示例页 | 实现度 | 等级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | DebounceLayout<br>`DebounceLayoutPlugin` | `createDebounceLayoutPlugin` | 1 | 拖控件可见 | [`#/demo/debounce-layout`](http://127.0.0.1:3300/#/demo/debounce-layout) | 98 | A |
| 2 | ReducedMotion<br>`ReducedMotionPlugin` | `createReducedMotionPlugin` | 3 | 环境模拟 | [`#/demo/reduced-motion`](http://127.0.0.1:3300/#/demo/reduced-motion) | 87 | A |
| 3 | Throttle<br>`ThrottlePlugin` | `createThrottlePlugin` | 1 | 交互后可见 | [`#/demo/throttle`](http://127.0.0.1:3300/#/demo/throttle) | 95 | A |
| 4 | Transition<br>`TransitionPlugin` | `createTransitionPlugin` | 2 | 交互后可见 | [`#/demo/transition`](http://127.0.0.1:3300/#/demo/transition) | 95 | A |

> **小结**：本组平均 93.8 分。性能与动效组的共同问题是没有稳定画面证据，所以每页都配了读数（回调次数、最近布局耗时、DOM 数），把「看不见」变成「读得出」。

## 七、逐插件测评

> 每条的「实测证据」都来自本轮真浏览器采集，不是 doc.json 的转述。读数原文引号内为页面实际渲染文本。

### 01. Alignment　`alignment`

- **插件目录 / 工厂**：`AlignmentPlugin` ／ `createAlignmentPlugin`
- **分组**：布局类　**源码**：29 行　**钩子**：2 个（transformProps / onResize）　**priority**：60
- **示例页**：`#/demo/alignment`　→　http://127.0.0.1:3300/#/demo/alignment
- **功能**：设置瀑布流的列分配策略。shortest 让每列尽量等高（视觉最自然），balanced 让每列项数接近，sequential 按 index 轮转（可预测位置，适合需要与外部索引对齐的场景）。
- **应用场景**：内容流：默认 shortest；等长卡片：balanced 更整齐；需要与后端顺序对齐：sequential
- **参数 / 控件**：1 个参数（说明覆盖 1/1）／ 1 个控件（实测渲染 1 个）
- **实测证据**：默认可见　·　读数「当前策略 shortest · 14 张卡 → 看三列底部是否齐」
  - 拖控件后变化：mode
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：三种策略切过去，三列底部的高低差立刻变化，读数写明当前策略名。
- **建议**：可在卡片底部叠一条列高参考线，让「齐不齐」不依赖眼睛估。

### 02. AutoColumn　`auto-column`

- **插件目录 / 工厂**：`AutoColumnPlugin` ／ `createAutoColumnPlugin`
- **分组**：布局类　**源码**：57 行　**钩子**：1 个（calculateColumns）　**priority**：55
- **示例页**：`#/demo/auto-column`　→　http://127.0.0.1:3300/#/demo/auto-column
- **功能**：按「容器可用宽度 ÷ 最小列宽」自动决定列数，取代写死 3 列。走 D1-A 布局钩子（calculateColumns），拿到的是真实容器宽度，不是 window.innerWidth。
- **应用场景**：响应式信息流；侧边栏宽度可拖动的后台看板；移动端 → 桌面端同一套代码
- **参数 / 控件**：3 个参数（说明覆盖 3/3）／ 3 个控件（实测渲染 3 个）
- **实测证据**：默认可见　·　读数「最小列宽 200 · 容器宽 900 · 算出 4 列（上限 4）」
  - 拖控件后变化：minColumnWidth、maxColumns、模拟容器宽
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：minColumnWidth / maxColumns / 容器宽三个参数互相牵制，实测推两端都会改列数。
- **建议**：读数可以再补一行「当前生效的断点区间」，省得使用者自己反推。

### 03. FixedHeight　`fixed-height`

- **插件目录 / 工厂**：`FixedHeightPlugin` ／ `createFixedHeightPlugin`
- **分组**：布局类　**源码**：35 行　**钩子**：2 个（transformProps / onResize）　**priority**：45
- **示例页**：`#/demo/fixed-height`　→　http://127.0.0.1:3300/#/demo/fixed-height
- **功能**：把数据里带 height 字段的项统一改写为固定高度，瀑布流变成等高网格。适合「图少字多」的卡片流——等高反而更好扫读。
- **应用场景**：商品列表（图固定比例）；后台看板卡片；需要严格栅格对齐的页面
- **参数 / 控件**：1 个参数（说明覆盖 1/1）／ 1 个控件（实测渲染 1 个）
- **实测证据**：默认可见　·　读数「统一高度 176px · 行高应完全一致（总高 1128px）」
  - 拖控件后变化：itemHeight
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：统一高度后瀑布流退化成网格，itemHeight 拖到哪卡片就是多高。
- **建议**：和「图片按 16:9 裁切」一起讲更完整，否则用户会先遇到图片被拉伸。

### 04. Gap　`gap-plugin`

- **插件目录 / 工厂**：`GapPlugin` ／ `createGapPlugin`
- **分组**：布局类　**源码**：54 行　**钩子**：2 个（transformProps / onResize）　**priority**：50
- **示例页**：`#/demo/gap-plugin`　→　http://127.0.0.1:3300/#/demo/gap-plugin
- **功能**：把 rowGap / columnGap 收敛到一处配置，并支持按窗口宽度切换间距（窄屏 8px、宽屏 16px 这类）。
- **应用场景**：设计规范里间距随断点变化；同一组件在不同页面用不同密度
- **参数 / 控件**：3 个参数（说明覆盖 3/3）／ 2 个控件（实测渲染 2 个）
- **实测证据**：默认可见　·　读数「配置 16 / 16 · 把窗口拉窄会切到 sm 档（8px）」
  - 拖控件后变化：columnGap、rowGap
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：列间距 / 行间距独立可调，且 responsive 档位现在只在小屏兜底（本轮修过）。
- **建议**：把断点阈值（768/992/1200）画成一行刻度，比写在 note 里直观。

### 05. PinItem　`pin-item`

- **插件目录 / 工厂**：`PinItemPlugin` ／ `createPinItemPlugin`
- **分组**：布局类　**源码**：77 行　**钩子**：2 个（onBeforeLayout / calculateItemPosition）　**priority**：100
- **示例页**：`#/demo/pin-item`　→　http://127.0.0.1:3300/#/demo/pin-item
- **功能**：把若干索引的项钉在顶部指定列，其余项从它们下方继续排。走 D1-A 布局钩子（calculateItemPosition），是旧版宣称但从未生效的能力。
- **应用场景**：信息流首位的推广卡；公告 / 置顶帖；需要固定在左上角的活动位
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 1 个控件（实测渲染 1 个）
- **实测证据**：默认可见　·　读数「置顶项：#0 #1 · 钉在第 1 列（角标写着「置顶」）」
  - 拖控件后变化：钉到第几列（0 基）
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：置顶项钉在指定列首行，角标写明「置顶」，列号可拖。
- **建议**：可补一个「多项置顶排在同列还是分行」的示例。

### 06. ResponsiveColumns　`responsive-columns`

- **插件目录 / 工厂**：`ResponsiveColumnsPlugin` ／ `createResponsiveColumnsPlugin`
- **分组**：布局类　**源码**：45 行　**钩子**：1 个（calculateColumns）　**priority**：55
- **示例页**：`#/demo/responsive-columns`　→　http://127.0.0.1:3300/#/demo/responsive-columns
- **功能**：用一张断点表控制列数，命中哪档用哪档。走 D1-A 布局钩子（calculateColumns），按容器宽度匹配断点。
- **应用场景**：严格对齐设计断点的站点；同一个组件嵌在不同宽度的容器里
- **参数 / 控件**：1 个参数（说明覆盖 1/1）／ 1 个控件（实测渲染 1 个）
- **实测证据**：默认可见　·　读数「容器宽 760 · 命中 md → 3 列 · 实际 3 列」
  - 拖控件后变化：模拟容器宽
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：容器宽滑杆是主控，列数按 minColumnWidth 与断点跳变。
- **建议**：默认值可以让断点更靠近当前宽度，打开页面就能看到一次跳变。

### 07. Filter　`filter`

- **插件目录 / 工厂**：`FilterPlugin` ／ `createFilterPlugin`
- **分组**：数据管线类　**源码**：50 行　**钩子**：2 个（onPropsChange / transformProps）　**priority**：40
- **示例页**：`#/demo/filter`　→　http://127.0.0.1:3300/#/demo/filter
- **功能**：用谓词函数过滤数据，优先读 `props.filterFn`，没有就用工厂里传入的 predicate。过滤条件变了可以自动滚回顶部（默认不开）。
- **应用场景**：分类 Tab 切换；只看有货 / 只看促销；价格区间筛选
- **参数 / 控件**：3 个参数（说明覆盖 3/3）／ 1 个控件（实测渲染 1 个）
- **实测证据**：默认可见　·　读数「¥ ≤ 500 · 命中 28 / 40 项」
  - 拖控件后变化：价格上限
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：谓词在管线第一环（priority 40），价格上限一拖命中数就从 40 掉到 1。
- **建议**：补一个「谓词抛错」按钮，验证「抛错按保留处理」这条承诺。

### 08. InfiniteScroll　`infinite-scroll`

- **插件目录 / 工厂**：`InfiniteScrollPlugin` ／ `createInfiniteScrollPlugin`
- **分组**：数据管线类　**源码**：62 行　**钩子**：3 个（onUnmount / transformProps / onReachBottom）　**priority**：35
- **示例页**：`#/demo/infinite-scroll`　→　http://127.0.0.1:3300/#/demo/infinite-scroll
- **功能**：监听 Core 的 onReachBottom，在距底部 `threshold` 像素内触发 onLoadMore。自带并发锁：上一次还没结束不会重复触发。
- **应用场景**：信息流无限滚动；画廊继续加载；搜索结果瀑布流
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 1 个控件（实测渲染 1 个）
- **实测证据**：交互后可见　·　读数「已加载 24 / 240 项 · 距底 400px 时追加 12 项」
  - 仅影响时序/条数（不改版式）：threshold（px）
  - 探针「滚到底触发加载」：24 → 36 项 · readout「已加载 36 / 240 项 · 距底 400px 时追加 12 项」
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：滚到底追加 12 项，读数从 24 → 36，阈值 400px 可调。
- **建议**：补 loading 态与「已到底」提示，否则用户分不清「没触发」和「加载中」。

### 09. Pagination　`pagination`

- **插件目录 / 工厂**：`PaginationPlugin` ／ `createPaginationPlugin`
- **分组**：数据管线类　**源码**：48 行　**钩子**：2 个（onPropsChange / transformProps）　**priority**：10
- **示例页**：`#/demo/pagination`　→　http://127.0.0.1:3300/#/demo/pagination
- **功能**：读 `props.pageIndex`（1 基）与 `props.pageSize` 切片。放在数据管线最末端，保证切的是「过滤 + 排序 + 搜索」之后的结果。
- **应用场景**：后台列表分页；搜索结果分页；与 URLSyncPlugin 配合做可分享链接
- **参数 / 控件**：3 个参数（说明覆盖 3/3）／ 2 个控件（实测渲染 2 个）
- **实测证据**：默认可见　·　读数「上一页第 1 / 4 页 · 每页 12 · 共 48 项下一页」
  - 拖控件后变化：pageSize、pageIndex
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：页码 / 每页条数双向可调，越界页码已钳到最后一页（本轮修过）。
- **建议**：和 Filter 串一版，直观看到「过滤后总页数变少」这条顺序约束。

### 10. Search　`search`

- **插件目录 / 工厂**：`SearchPlugin` ／ `createSearchPlugin`
- **分组**：数据管线类　**源码**：54 行　**钩子**：2 个（onPropsChange / transformProps）　**priority**：20
- **示例页**：`#/demo/search`　→　http://127.0.0.1:3300/#/demo/search
- **功能**：读取 `props.searchQuery`，在指定字段上做大小写不敏感的 `includes` 匹配。没指定字段就对对象的全部自有字段匹配。
- **应用场景**：站内搜索结果页；后台列表即时搜索；商品名 / 店铺名联合搜索
- **参数 / 控件**：3 个参数（说明覆盖 3/3）／ 0 个控件（实测渲染 0 个）
- **实测证据**：交互后可见　·　读数「命中 36 / 36 项」
  - 探针「输入「咖啡」」：命中 3 / 36 项 · 读数「命中 3 / 36 项（query="咖啡"）」
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：输入「咖啡」命中 3/36，输入框不失焦、滚动不归零（pluginKeys 白名单在起作用）。
- **建议**：可以补一个 200ms 防抖的对照示例，说明「每敲一个字都过滤」的代价。

### 11. Sort　`sort`

- **插件目录 / 工厂**：`SortPlugin` ／ `createSortPlugin`
- **分组**：数据管线类　**源码**：50 行　**钩子**：2 个（onPropsChange / transformProps）　**priority**：30
- **示例页**：`#/demo/sort`　→　http://127.0.0.1:3300/#/demo/sort
- **功能**：用比较函数排序，优先读 `props.sortComparator`。排序总是在过滤之后、分页之前执行，保证「第 N 页」是排序后的第 N 页。
- **应用场景**：价格 / 时间排序；热度排序；手动置顶项优先
- **参数 / 控件**：3 个参数（说明覆盖 3/3）／ 1 个控件（实测渲染 1 个）
- **实测证据**：默认可见　·　读数「当前 点赞数 高→低 · 首项应是「likes 最靠前」的那张」
  - 拖控件后变化：排序方式
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：三种比较器切换后首项立刻换，读数提示「首项应是哪张」。
- **建议**：补一个自定义 comparator 的输入框，方便验证业务排序。

### 12. A11y　`a11y`

- **插件目录 / 工厂**：`A11yPlugin` ／ `createA11yPlugin`
- **分组**：界面与状态类　**源码**：65 行　**钩子**：3 个（onMount / onLayoutComplete / renderItemWrapper）
- **示例页**：`#/demo/a11y`　→　http://127.0.0.1:3300/#/demo/a11y
- **功能**：把瀑布流补成读屏可理解的列表：容器 `role=list` + `aria-label`，每项 `role=listitem` + `aria-posinset` / `aria-setsize`，并可选加 `tabIndex` 让键盘能逐项聚焦。
- **应用场景**：政务 / 金融等合规站点；读屏用户可用的信息流；键盘操作优先的桌面端
- **参数 / 控件**：4 个参数（说明覆盖 4/4）／ 0 个控件（实测渲染 0 个）
- **实测证据**：属性层可见　·　读数「阴天里的海边公路林一白·12 小时前手冲咖啡的第 30 天陈默·3 天前把阳台改成了书房陆青野·6 天前城市夜行的三小时许星河·7 天前一碗面的做法阿岚·3 天前老相机与新胶卷苏见…」
  - 点击后日志 2 条：「22:10:39首项 role="无" tabIndex="无"」
- **评分**：结构 35 + 效果 42 + 文档 12 + 运行时 8 = **97（A）**
- **结论**：容器 role=list、每项 role=listitem 已注入，点「检查 DOM 属性」会把实测值写进日志。
- **建议**：把 role/aria 直接渲染成卡片角标，画面上就能验收；另外 enableTabIndex 打开后 Tab 成本很高，建议默认仍关。

### 13. Bookmark　`bookmark`

- **插件目录 / 工厂**：`BookmarkPlugin` ／ `createBookmarkPlugin`
- **分组**：界面与状态类　**源码**：79 行　**钩子**：1 个（onMount）
- **示例页**：`#/demo/bookmark`　→　http://127.0.0.1:3300/#/demo/bookmark
- **功能**：长列表读到一半要跳走时按 **B** 存位置，回来按 **R** 复原。焦点在输入框/可编辑区域时不拦截按键。
- **应用场景**：长文列表阅读；后台大表格浏览；演示时快速复位
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 0 个控件（实测渲染 0 个）
- **实测证据**：交互后可见　·　读数「先滚到中间，按 b；再滚到别处，按 r」
  - 探针「滚到 900 → 按 b → 回顶 → 按 r」：按 r 后 scrollTop=900
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：按 b 记住位置、按 r 跳回，实测 scrollTop 从 0 回到 900。
- **建议**：加一对可视按钮（不只是快捷键），移动端和触屏用户才用得上。

### 14. Grouping　`grouping`

- **插件目录 / 工厂**：`GroupingPlugin` ／ `createGroupingPlugin`
- **分组**：界面与状态类　**源码**：90 行　**钩子**：4 个（onMount / onPropsChange / onLayoutComplete / renderOverlay）
- **示例页**：`#/demo/grouping`　→　http://127.0.0.1:3300/#/demo/grouping
- **功能**：用 groupBy 把项按业务字段分组，结果放进 sharedData 的 `GROUPS`（Map<组键, 索引数组>），供 StickyHeaderPlugin、分组统计条等消费。挂载即算一次，之后 props 变化重算。
- **应用场景**：按分类分组的信息流；按日期分组的时间线；吸顶条显示当前分组
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 1 个控件（实测渲染 1 个）
- **实测证据**：默认可见　·　读数「8 组：手作 8 · 摄影 6 · 美食 6 · 阅读 3 · 数码 3 · 穿搭 3 · 家居 2 · 旅行 1」
  - 拖控件后变化：显示分组浮层
- **评分**：结构 35 + 效果 45 + 文档 12 + 运行时 8 = **100（A）**
- **结论**：8 组浮层 + 分组读数同时可见，浮层开关不影响几何。
- **建议**：能让组标题在组内吸顶，配合 StickyHeader 才是完整的「分组列表」。

### 15. StatePersistence　`state-persistence`

- **插件目录 / 工厂**：`StatePersistencePlugin` ／ `createStatePersistencePlugin`
- **分组**：界面与状态类　**源码**：115 行　**钩子**：4 个（onMount / onUnmount / onPropsChange / transformProps）
- **示例页**：`#/demo/state-persistence`　→　http://127.0.0.1:3300/#/demo/state-persistence
- **功能**：三个时机各做一件事：首次渲染把快照里的 pageIndex / searchQuery 注入 props；挂载后恢复 scrollTop；props 变化与卸载时写回快照。刷新页面不丢进度。
- **应用场景**：后台列表刷新不丢页；搜索结果返回定位；移动端来回切换页面
- **参数 / 控件**：3 个参数（说明覆盖 3/3）／ 0 个控件（实测渲染 0 个）
- **实测证据**：交互后可见　·　读数「滚到中间 → 切到「总览」再切回来，位置会被记住」
  - 探针「写 localStorage」：localStorage keys=["demo-bookmark","demo-waterfall-state"]
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：滚动位置与指定键写进 localStorage，键名 demo-waterfall-state 实测存在。
- **建议**：加一个「清除状态并刷新」按钮，验收和排障都更快。

### 16. StickyHeader　`sticky-header`

- **插件目录 / 工厂**：`StickyHeaderPlugin` ／ `createStickyHeaderPlugin`
- **分组**：界面与状态类　**源码**：51 行　**钩子**：1 个（renderOverlay）
- **示例页**：`#/demo/sticky-header`　→　http://127.0.0.1:3300/#/demo/sticky-header
- **功能**：在滚动容器内渲染一条 `position: sticky` 的标题条，始终贴住容器顶部。装了 GroupingPlugin 时自动显示第一个分组名，也可用 title 写死。
- **应用场景**：分组信息流；按日期分组的时间线；长列表的上下文提示
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 0 个控件（实测渲染 0 个）
- **实测证据**：交互后可见　·　读数「向下滚：标题条会贴在瀑布流容器顶部」
  - 探针「滚到分组边界看吸顶标题」：吸顶元素 1 个 · 文案 ["当前分组 ：摄影向下滚动观察吸顶"] · scrollTop=700
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：滚动后出现 1 个 sticky 元素，文案是当前分组名。
- **建议**：多分组连续滚动更能体现价值，现在只有一屏。

### 17. URLSync　`url-sync`

- **插件目录 / 工厂**：`URLSyncPlugin` ／ `createURLSyncPlugin`
- **分组**：界面与状态类　**源码**：97 行　**钩子**：2 个（onMount / onPropsChange）
- **示例页**：`#/demo/url-sync`　→　http://127.0.0.1:3300/#/demo/url-sync
- **功能**：props 变化时把指定键写进 URL（hash 或 search），挂载时读出来广播 `urlsync:init`。刷新与分享都能还原筛选状态。
- **应用场景**：搜索结果可分享；后台筛选状态可刷新；带参数的深链
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 0 个控件（实测渲染 0 个）
- **实测证据**：交互后可见　·　读数「（地址栏还没有参数）」
  - 探针「输入「咖啡」」：命中 2 / 24 项 · 读数「?searchQuery=%E5%92%96%E5%95%A1」 · URL「?searchQuery=%E5%92%96%E5%95%A1」
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：修好后输入即写 ?searchQuery=…，刷新会回填（本轮修的是示例页装配，不是插件）。
- **建议**：加「复制链接」按钮，把「发给同事打开同一屏」这件事做实。

### 18. ClickAnalytics　`click-analytics`

- **插件目录 / 工厂**：`ClickAnalyticsPlugin` ／ `createClickAnalyticsPlugin`
- **分组**：交互与分析类　**源码**：65 行　**钩子**：3 个（onMount / onItemClick / renderOverlay）
- **示例页**：`#/demo/click-analytics`　→　http://127.0.0.1:3300/#/demo/click-analytics
- **功能**：统计每次项点击并累计总数，向 bus 发 `analytics:click`（带 index / item / total）。默认只上报不显示角标，接入真实版式时不会被调试面板盖住内容。
- **应用场景**：内容流点击率统计；AB 实验埋点；调试点击行为
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 0 个控件（实测渲染 0 个）
- **实测证据**：交互后可见　·　读数「点几张卡：右上角数字是插件自己的计数」
  - 探针「点第 2 张卡」：日志「22:10:03点击 #1 · 手冲咖啡的第 30 天（bus 上同时广播 analytics:click）」
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：点卡片后角标计数变化，日志给出被点项，bus 上同时广播 analytics:click。
- **建议**：可以补一个汇总读数（总点击 / 点击率），单卡角标看不出全局。

### 19. DragReorder　`drag-reorder`

- **插件目录 / 工厂**：`DragReorderPlugin` ／ `createDragReorderPlugin`
- **分组**：交互与分析类　**源码**：76 行　**钩子**：1 个（renderItemWrapper）
- **示例页**：`#/demo/drag-reorder`　→　http://127.0.0.1:3300/#/demo/drag-reorder
- **功能**：用原生 draggable 给每个项加上拖拽能力，松手时回调 `onReorder(from, to)`，同时向 bus 发 `drag:reorder`。旧版只记录 from/to、不回调，这里补上真回调。
- **应用场景**：后台卡片排序；收藏夹手动排序；仪表盘组件排列
- **参数 / 控件**：3 个参数（说明覆盖 3/3）／ 0 个控件（实测渲染 0 个）
- **实测证据**：交互后可见　·　读数「拖卡片右上角的手柄，松手后看位置与顺序变化」
  - 探针「HTML5 拖拽 #0 → #3」：日志「22:10:35拖拽 #0 → #3（阴天里的海边公路），数组已重排」· 首项「拖卡片右上角的手柄，松手后看位置与顺序变化手冲咖」
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：HTML5 拖拽触发 onReorder，数组真的重排（日志给出 from → to 与标题）。
- **建议**：touch 设备上 HTML5 drag 不可用，补 pointer 事件或长按拖拽才完整。

### 20. HeatmapAnalytics　`heatmap-analytics`

- **插件目录 / 工厂**：`HeatmapAnalyticsPlugin` ／ `createHeatmapAnalyticsPlugin`
- **分组**：交互与分析类　**源码**：73 行　**钩子**：4 个（onLayoutComplete / onItemEnterViewport / onItemClick / renderOverlay）
- **示例页**：`#/demo/heatmap-analytics`　→　http://127.0.0.1:3300/#/demo/heatmap-analytics
- **功能**：按项统计「进入视口次数」与「点击次数」，用于粗粒度热力分析。首次布局会补记一次当前可见范围的曝光，避免首屏全是 0。
- **应用场景**：信息流曝光分析；广告位可见性验证；调试曝光策略
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 0 个控件（实测渲染 0 个）
- **实测证据**：交互后可见　·　读数「滚一遍：顶部条是开关，卡片角上是单卡曝光/点击次数」
  - 探针「点第 2 张卡」：日志「22:10:56曝光 #29（Core 的可见事件，插件也在数）」
  - 滚动后日志 8 条：「22:10:56曝光 #29（Core 的可见事件，插件也在数）」
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：滚动曝光累计，卡片角上显示单卡曝光/点击次数。
- **建议**：加一个页级汇总（多少项被看到、平均停留），现在只能逐卡看。

### 21. Recycle　`recycle`

- **插件目录 / 工厂**：`RecyclePlugin` ／ `createRecyclePlugin`
- **分组**：交互与分析类　**源码**：49 行　**钩子**：4 个（onUnmount / onItemUnmount / onItemEnterViewport / onItemLeaveViewport）
- **示例页**：`#/demo/recycle`　→　http://127.0.0.1:3300/#/demo/recycle
- **功能**：纯绘制层优化：项离开视口就 `visibility: hidden`，回来再显示。DOM 节点不销毁，滚动位置与已加载的图片都保留，适合「项里有视频/Canvas，重建代价高」的场景。
- **应用场景**：项内含视频 / canvas；长列表滚动发虚；低端设备省电
- **参数 / 控件**：1 个参数（说明覆盖 1/1）／ 1 个控件（实测渲染 1 个）
- **实测证据**：无可视差异　·　读数「300 项 · 渲染 300（Recycle 不减少 DOM，只减少绘制）· 池子 24」
  - 仅影响时序/条数（不改版式）：poolSize
- **评分**：结构 35 + 效果 38 + 文档 12 + 运行时 8 = **93（A）**
- **结论**：只减少绘制开销，不减 DOM，读数把这点写明了（300 项 / 渲染 300）。
- **建议**：与 virtual 放一起做 A/B 读数（DOM 数、长任务数），才能判断什么时候该用哪个。

### 22. ScrollAnchor　`scroll-anchor`

- **插件目录 / 工厂**：`ScrollAnchorPlugin` ／ `createScrollAnchorPlugin`
- **分组**：交互与分析类　**源码**：33 行　**钩子**：2 个（onMount / onUnmount）
- **示例页**：`#/demo/scroll-anchor`　→　http://127.0.0.1:3300/#/demo/scroll-anchor
- **功能**：不需要自己算索引：外部只管 `bus.emit("anchor:scrollToId", { id })`，插件用 getAnchorId 找到对应项并滚过去。适合「从消息跳到某条内容」。
- **应用场景**：从通知跳转到具体卡片；目录点击定位；外链深链定位
- **参数 / 控件**：1 个参数（说明覆盖 1/1）／ 0 个控件（实测渲染 0 个）
- **实测证据**：交互后可见　·　读数「跳到第#0 项#6 项#12 项#18 项#24 项（走 window 事件 → bus → 插件）」
  - 探针「点「#18 项」跳转」：scrollTop=2360 · 日志「22:10:31dispatch wf:anchor { id: "c4401-24" } → 插件转成 bus → scrollToItem(24)」
  - 点击后日志 1 条：「22:10:30dispatch wf:anchor { id: "c4401-0" } → 插件转成 bus → scrollToItem(0)」
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：点「#18 项」跳到第 18 项，实测 scrollTop=2360，日志给出 bus 转发链路。
- **建议**：补「返回时恢复原位置」，锚点跳转最常被吐槽的就是回不去。

### 23. DebounceLayout　`debounce-layout`

- **插件目录 / 工厂**：`DebounceLayoutPlugin` ／ `createDebounceLayoutPlugin`
- **分组**：性能与动效类　**源码**：23 行　**钩子**：1 个（transformProps）　**priority**：75
- **示例页**：`#/demo/debounce-layout`　→　http://127.0.0.1:3300/#/demo/debounce-layout
- **功能**：只调 debounceDelay：容器宽度连续变化（抽屉展开、分栏拖拽）时，等变化停下来再算一次布局，避免每帧重排。
- **应用场景**：可折叠侧栏；分栏宽度拖拽；横竖屏切换
- **参数 / 控件**：1 个参数（说明覆盖 1/1）／ 2 个控件（实测渲染 2 个）
- **实测证据**：拖控件可见　·　读数「防抖 300ms · 最近布局 0.2ms · 拖滑杆时观察它多久变一次」
  - 拖控件后变化：容器宽
  - 仅影响时序/条数（不改版式）：delay（ms）
- **评分**：结构 35 + 效果 43 + 文档 12 + 运行时 8 = **98（A）**
- **结论**：拖容器宽时布局被合并，读数给出最近一次耗时（0.3ms 量级）。
- **建议**：把「被合并掉多少次」也显示出来，防抖的价值才可量化。

### 24. ReducedMotion　`reduced-motion`

- **插件目录 / 工厂**：`ReducedMotionPlugin` ／ `createReducedMotionPlugin`
- **分组**：性能与动效类　**源码**：60 行　**钩子**：3 个（transformProps / onLayoutComplete / onItemMount）　**priority**：70
- **示例页**：`#/demo/reduced-motion`　→　http://127.0.0.1:3300/#/demo/reduced-motion
- **功能**：检测 `prefers-reduced-motion: reduce`，命中后把 useTransform 关掉并清掉项上的 transition。前庭功能敏感用户不会因为滚动时的位置微动而不适。
- **应用场景**：政务 / 医疗类站点；无障碍合规要求；低性能设备
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 0 个控件（实测渲染 0 个）
- **实测证据**：环境模拟　·　读数「系统偏好 reduce motion：否 → 过渡生效（240ms）」
  - 探针「模拟系统「减少动态效果」」：transitionDuration 0.24s, 0.24s → 0s · 读数「系统偏好 reduce motion：是 → 过渡已清掉」
- **评分**：结构 35 + 效果 32 + 文档 12 + 运行时 8 = **87（A）**
- **结论**：模拟系统偏好后读数变「是」，过渡时长被清成 0s（本轮修过：原先被 Transition 的内联样式覆盖）。
- **建议**：监听 matchMedia 的 change 事件，运行中切系统设置也能立刻生效。

### 25. Throttle　`throttle`

- **插件目录 / 工厂**：`ThrottlePlugin` ／ `createThrottlePlugin`
- **分组**：性能与动效类　**源码**：29 行　**钩子**：1 个（transformProps）　**priority**：80
- **示例页**：`#/demo/throttle`　→　http://127.0.0.1:3300/#/demo/throttle
- **功能**：接管 Core 的 throttleDelay（滚动回调节流）与 debounceDelay（尺寸变化后多久重排）。默认 16ms / 150ms，长列表滚动卡顿时可以放宽到 32 / 300。
- **应用场景**：低端安卓机长列表；滚动时 CPU 占用过高；拖拽侧栏时减少重排
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 2 个控件（实测渲染 2 个）
- **实测证据**：交互后可见　·　读数「滚动回调 0 次（阈值 16ms）· 布局耗时 0.2ms —— 快速滚一遍再对比」
  - 仅影响时序/条数（不改版式）：scroll（ms）、resize（ms）
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：滚动回调按阈值节流，读数给出回调次数与布局耗时。
- **建议**：补「未节流时本应触发多少次」，否则用户不知道省了多少。

### 26. Transition　`transition`

- **插件目录 / 工厂**：`TransitionPlugin` ／ `createTransitionPlugin`
- **分组**：性能与动效类　**源码**：39 行　**钩子**：2 个（onLayout / onItemMount）　**priority**：65
- **示例页**：`#/demo/transition`　→　http://127.0.0.1:3300/#/demo/transition
- **功能**：给每个项挂上 transform + opacity 的 CSS 过渡，布局重排、分页切换、筛选后重新排列时位置变化是滑过去的，不是瞬移。
- **应用场景**：筛选 / 排序后重排；分页切换；动态插入卡片
- **参数 / 控件**：2 个参数（说明覆盖 2/2）／ 1 个控件（实测渲染 1 个）
- **实测证据**：交互后可见　·　读数「打乱顺序duraton 拖到 0 再点一次，就是瞬移」
  - 拖控件后变化：duration（ms）
  - 点击后日志 1 条：「22:10:49打乱顺序（过渡 260ms）」
- **评分**：结构 35 + 效果 40 + 文档 12 + 运行时 8 = **95（A）**
- **结论**：点「打乱顺序」后 24 张卡带 260ms 过渡移动，duration 拖到 0 就是瞬移。
- **建议**：支持自定义 easing，并说明与 ReducedMotion 的先后关系（本轮已修）。

## 八、高级 API 与内核能力页

> 这一章不属于「插件」，但它们是插件的底座：Core 的 props、ref 命令、20 个生命周期钩子、虚拟化。

| 页面 | 路由 | 覆盖内容 | 实测证据 |
| --- | --- | --- | --- |
| `basic` | [`#/demo/basic`](http://127.0.0.1:3300/#/demo/basic) | 基础示例 | 40 项 · 3 列 · 读数「阴天里的海边公路林一白·3 小时前手冲咖啡的第 30 天唐小满·11 天前把阳台改成了书房许…」 |
| `columns` | [`#/demo/columns`](http://127.0.0.1:3300/#/demo/columns) | 自定义列数 | 36 项 · 4 列 · 读数「列宽 = (容器宽 − 间距×3) ÷ 4 · 当前 4 列 / 总高 2626px…」 |
| `gap` | [`#/demo/gap`](http://127.0.0.1:3300/#/demo/gap) | 自定义间距 | 30 项 · 3 列 · 读数「rowGap 24 · columnGap 8 —— gap 被覆盖，此刻是空转的…」 |
| `ref` | [`#/demo/ref`](http://127.0.0.1:3300/#/demo/ref) | Ref 方法调用 | 14 个命令按钮；点「relayout」后日志「22:08:18relayout() → 清空高度缓存并重排」 |
| `lifecycle` | [`#/demo/lifecycle`](http://127.0.0.1:3300/#/demo/lifecycle) | 生命周期和事件 | 13 个回调接满；滚动触发 13 条（如「22:08:20onItemEnterViewport #29 可见 24%」） |
| `advanced` | [`#/demo/advanced`](http://127.0.0.1:3300/#/demo/advanced) | 高级配置 | 34 项 · 3 列 · 读数「定位方式：transform · 内边距 12 · 列数 3 · 总高 3603px…」 |
| `virtual` | [`#/demo/virtual`](http://127.0.0.1:3300/#/demo/virtual) | 内核能力 `virtualize` | 1000 项渲染 10 个 DOM；滚到 60% 后 14 个；同列重叠 0 |
| `virtual-dynamic` | [`#/demo/virtual-dynamic`](http://127.0.0.1:3300/#/demo/virtual-dynamic) | 内核能力 `virtualize · dynamicHeights` | 400 项渲染 7 个；高度 ×1.5 后自动修正位置 |

**ref 契约**：`getLayoutInfo` / `getItemPosition` / `getColumnHeights` / `scrollToItem` / `scrollToTop` / `scrollToBottom` / `measureItem` / `relayout` / `getContainer` / `getVisibleRange` 等 14 个命令，示例页每个命令一个按钮，点完把返回值写进右栏日志。

**20 个钩子分五组**：生命周期 4（onMount / onUnmount / onPropsChange / transformProps）、布局 6（onBeforeLayout / onLayout / onLayoutComplete / calculateColumns / calculateColumnWidth / calculateItemPosition）、项生命周期 5（onItemMount / onItemUnmount / onItemEnterViewport / onItemLeaveViewport / onItemClick）、滚动 3（onScroll / onResize / onReachBottom）、渲染 2（renderOverlay / renderItemWrapper）。26 个插件对钩子的使用分布见附录 C。

## 九、三道闸门

| 闸门 | 命令 | 它证明什么 | 它证明不了什么 |
| --- | --- | --- | --- |
| 静态核对 | `pnpm --filter vane-waterfall verify:scenarios` | 示例目录 / 源码装配 / 插件名三方一致；26/26 插件有页 | 页面实际渲染成什么样 |
| 几何体检 | `node scripts/audit-demos.mjs` | 34 页 + 3 个其它页的版式几何干净（越界 / 重叠 / 零尺寸 / 底边） | 控件有没有接上（3 列排整齐也是合法几何） |
| 控件响应 | `node scripts/audit-controls.mjs` | 每个滑杆推到两端，逐项指纹确实变化 | 时序类参数（标了 `nonLayout` 的会被跳过） |

本轮把第三道闸门补成了可复跑的脚本（`scripts/audit-controls.mjs` + `pnpm audit:controls`）。它抓的正是前两道抓不到的那类缺陷——**几何完全合法，但参数根本没接上**。

另外修了第二道闸门的一个盲区：`translateOf()` 原先只读 `transform`，遇到 `useTransform: false`（ReducedMotion 会切过去）就认为容器里没有已布局项，报 `empty` 假警。现在读不到 transform 时退回 `offsetLeft/offsetTop`。

## 十、遗留问题与下一步

| # | 问题 | 影响 | 建议 |
| --- | --- | --- | --- |
| 1 | 快速连续滚动时（每 120ms 滚 600px）虚拟化页仍会出现瞬时重叠，停手后 1s 内自愈 | 观感；截图取证时可能拍到中间态 | 滚动期间用「上一次实测高度」的保守值而非纯 `estimateHeight`；或给滚动中的项加 `will-change` 并延后绘制 |
| 2 | `estimateHeight` 与实际项高差异越大，滚动条长度跳动越明显 | 体验 | 按首屏实测高度的中位数回填默认估值，而不是固定 240 |
| 3 | Recycle 与 Virtual 的差别只能从读数看出（300 项 / 渲染 300） | 选型困难 | 加一个「DOM 数 + 长任务数」的 A/B 对比页 |
| 4 | ReducedMotion 的 `prefersReduce` 在工厂创建时求值，运行中切系统设置不会即时生效 | 边界场景 | 监听 `matchMedia().addEventListener("change")`，运行时切换 |
| 5 | 拖拽只支持 HTML5 drag（触屏不可用） | 移动端 | 补 pointer 事件路径或长按拖拽 |
| 6 | 分析类插件（Click / Heatmap）的计数只存在内存，刷新即清零 | 演示够用，接入需自己上报 | 示例页加一行「导出 JSON」，把数据形状展示出来 |
| 7 | 3 个插件的效果仍无法「一眼看见」（Recycle 无可视差异、ReducedMotion 依赖系统偏好、A11y 落在属性层） | 验收成本 | 已给出页面内读数 / 检查按钮 / 系统偏好模拟说明，属于可接受 |

下一步建议（按优先级）：发布 `vane-waterfall@2.0.0`（changeset 已备）→ 补 3 个 `config` 字段的默认值说明 → 把 `audit:controls` 接进 CI。

## 十一、附录

### A. 验收路径对照

| 路径 | 操作 | 观察位置 |
| --- | --- | --- |
| 默认可见 | 打开 `#/demo/:slug` | 舞台画面 + 顶部读数 |
| 拖控件 | 推滑杆 / 切开关 / 换下拉 | 舞台 + 读数 + 下方装配代码（代码里的参数值同步变） |
| 交互 | 滚动 / 点卡片 / 按 b、r / 拖手柄 / 输入关键词 | 舞台 + 右栏日志 |
| 属性层 | 点页面里的「检查 DOM 属性」 | 右栏日志（写出 role / aria-label / tabindex 实测值） |
| 环境模拟 | DevTools → Rendering → `prefers-reduced-motion: reduce` | 读数从「否」变「是」，过渡时长变 0s |
| 源码 | 页底「最小装配 / 完整源码」两个页签 | 完整源码就是该页 `?raw` 原文，不是另写一份 |

### B. 评分细则（可直接复算）

```
结构 = (路由命中且标题一致 ? 9 : 0) + (容器存在且有已布局项 ? 12 : 0) + 6 × 控件覆盖率 + (最小装配代码长度 > 200 ? 8 : 0)
效果 = 默认可见 45 / 拖控件 43 / 属性层 42 / 交互后 40 / 无可视差异 38 / 环境模拟 32 / 无证据 8 / 崩溃 0
文档 = min(features/3,1)×3 + min(useCases/2,1)×3 + (notes>0?2:0) + 参数说明覆盖率×1.5 + (示例代码?1.5:0) + (页面坑位提示?1:0)
运行时 = (无 console error ? 6 : 3) + (几何 0 命中 ? 2 : 0)
```

### C. 插件 → 钩子使用分布

| 插件 | 钩子 |
| --- | --- |
| `A11yPlugin` | onMount / onLayoutComplete / renderItemWrapper |
| `AlignmentPlugin` | transformProps / onResize |
| `AutoColumnPlugin` | calculateColumns |
| `BookmarkPlugin` | onMount |
| `ClickAnalyticsPlugin` | onMount / onItemClick / renderOverlay |
| `DebounceLayoutPlugin` | transformProps |
| `DragReorderPlugin` | renderItemWrapper |
| `FilterPlugin` | onPropsChange / transformProps |
| `FixedHeightPlugin` | transformProps / onResize |
| `GapPlugin` | transformProps / onResize |
| `GroupingPlugin` | onMount / onPropsChange / onLayoutComplete / renderOverlay |
| `HeatmapAnalyticsPlugin` | onLayoutComplete / onItemEnterViewport / onItemClick / renderOverlay |
| `InfiniteScrollPlugin` | onUnmount / transformProps / onReachBottom |
| `PaginationPlugin` | onPropsChange / transformProps |
| `PinItemPlugin` | onBeforeLayout / calculateItemPosition |
| `RecyclePlugin` | onUnmount / onItemUnmount / onItemEnterViewport / onItemLeaveViewport |
| `ReducedMotionPlugin` | transformProps / onLayoutComplete / onItemMount |
| `ResponsiveColumnsPlugin` | calculateColumns |
| `ScrollAnchorPlugin` | onMount / onUnmount |
| `SearchPlugin` | onPropsChange / transformProps |
| `SortPlugin` | onPropsChange / transformProps |
| `StatePersistencePlugin` | onMount / onUnmount / onPropsChange / transformProps |
| `StickyHeaderPlugin` | renderOverlay |
| `ThrottlePlugin` | transformProps |
| `TransitionPlugin` | onLayout / onItemMount |
| `URLSyncPlugin` | onMount / onPropsChange |

### D. 复现方式

```bash
cd packages/vane-waterfall
pnpm build && pnpm build:demo            # 核心 + 示例站产物（demo-dist）
node scripts/serve-demo.cjs             # 静态托管 demo-dist（3300）
pnpm verify:scenarios                   # 闸门一：目录 / 源码 / 插件名一致
PLAYWRIGHT_PATH=<playwright> node scripts/audit-demos.mjs      # 闸门二：几何体检（37 页）
PLAYWRIGHT_PATH=<playwright> node scripts/audit-controls.mjs   # 闸门三：控件响应（23 个滑杆）
```

本报告的采集脚本：

| 脚本 | 产出 |
| --- | --- |
| `.workbuddy/scratch/wf-audit-static.mjs` | `wf-static.json`：26 个插件的声明与源码统计 |
| `.workbuddy/scratch/wf-audit-live.mjs` | `wf-live.json`：34 条路由的结构 / 控件 / 交互证据 |
| `.workbuddy/scratch/gen-wf-report.mjs` | 本报告 + `tasks/10-插件测评明细.csv` |

### E. 数据文件

| 文件 | 内容 |
| --- | --- |
| `tasks/10-vane-waterfall-插件测评报告.md` | 本报告 |
| `tasks/10-插件测评明细.csv` | 26 行明细（Excel 可直接打开） |

