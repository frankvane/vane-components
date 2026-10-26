/**
 * 26 个插件的迁移元数据（目录名 / 工厂 / 分组 / priority / 文档内容）。
 *
 * 这是"人工校对"的那一半：源码里的 config 类型与工厂默认值决定 `config` 列表，
 * 这里补的是一句话描述、典型用法、适用/不适用场景与坑。
 * 迁移脚本 `migrate-waterfall-plugins.mjs` 用它生成 doc.json 与 index.ts。
 *
 * 注意：旧仓 27 个插件，`VirtualWaterfall` 不下沉为插件（见 tasks/07 · D2-A），
 * 能力进了 Core 的 `virtualize` 选项，因此这里只有 26 个。
 */

export const PLUGIN_META = [
  // ============================== layout ==============================
  {
    dir: "AlignmentPlugin",
    from: "Alignment",
    factory: "createAlignmentPlugin",
    configType: "AlignmentConfig",
    group: "layout",
    priority: 60,
    summary: "指定列分配策略：最矮列优先（shortest）/ 项数均衡（balanced）/ 顺序轮转（sequential）。",
    doc: {
      description:
        "设置瀑布流的列分配策略。shortest 让每列尽量等高（视觉最自然），balanced 让每列项数接近，sequential 按 index 轮转（可预测位置，适合需要与外部索引对齐的场景）。",
      tags: ["layout", "布局"],
      config: [
        { name: "mode", type: '"shortest" | "balanced" | "sequential"', default: "shortest", description: "列分配策略" },
      ],
      features: ["三种列分配策略", "只改 props.alignmentMode，不影响其他配置", "与 ResponsiveColumns / AutoColumn 正交"],
      useCases: ["内容流：默认 shortest", "等长卡片：balanced 更整齐", "需要与后端顺序对齐：sequential"],
      notes: ["balanced 与 shortest 在列高相同时都取最左列，视觉上左偏是预期行为。"],
    },
  },
  {
    dir: "AutoColumnPlugin",
    from: "AutoColumn",
    factory: "createAutoColumnPlugin",
    configType: "AutoColumnConfig",
    group: "layout",
    priority: 55,
    summary: "按容器宽与最小列宽自动算列数，窄屏自动降列。",
    doc: {
      description:
        "按「容器可用宽度 ÷ 最小列宽」自动决定列数，取代写死 3 列。走 D1-A 布局钩子（calculateColumns），拿到的是真实容器宽度，不是 window.innerWidth。",
      tags: ["layout", "layout-hook", "响应式"],
      config: [
        { name: "minColumnWidth", type: "number", default: "—", description: "每列最小宽度 px（必填）" },
        { name: "maxColumns", type: "number", default: "Infinity", description: "列数上限" },
        { name: "minColumns", type: "number", default: "1", description: "列数下限" },
      ],
      features: ["按容器宽度（不是视口宽度）算列数", "列数上下限可夹", "与 Gap / Padding 一起算，留白不吞列宽"],
      useCases: ["响应式信息流", "侧边栏宽度可拖动的后台看板", "移动端 → 桌面端同一套代码"],
      notes: ["与 ResponsiveColumnsPlugin 同时装会互相覆盖列数，只选一个。"],
    },
  },
  {
    dir: "ResponsiveColumnsPlugin",
    from: "ResponsiveColumns",
    factory: "createResponsiveColumnsPlugin",
    configType: null,
    group: "layout",
    priority: 55,
    summary: "按断点表决定列数（如 640 → 2 列、1024 → 3 列、1440 → 4 列）。",
    doc: {
      description:
        "用一张断点表控制列数，命中哪档用哪档。走 D1-A 布局钩子（calculateColumns），按容器宽度匹配断点。",
      tags: ["layout", "layout-hook", "响应式"],
      config: [
        { name: "breakpoints", type: "Record<string, { width: number; columns: number }>", default: "—", description: "断点表，按 width 升序匹配" },
      ],
      features: ["断点表驱动，设计稿几档就写几档", "按容器宽度而非视口宽度匹配", "未命中任何断点时回退到 props.columns"],
      useCases: ["严格对齐设计断点的站点", "同一个组件嵌在不同宽度的容器里"],
      notes: ["与 AutoColumnPlugin 互斥。"],
    },
  },
  {
    dir: "GapPlugin",
    from: "Gap",
    factory: "createGapPlugin",
    configType: "GapConfig",
    group: "layout",
    priority: 50,
    summary: "统一控制行/列间距，支持按断点给不同间距。",
    doc: {
      description:
        "把 rowGap / columnGap 收敛到一处配置，并支持按窗口宽度切换间距（窄屏 8px、宽屏 16px 这类）。",
      tags: ["layout", "间距"],
      config: [
        { name: "columnGap", type: "number", default: "props.columnGap", description: "列间距 px" },
        { name: "rowGap", type: "number", default: "props.rowGap", description: "行间距 px" },
        { name: "responsive", type: "{ sm?, md?, lg?, xl? }", default: "—", description: "断点覆盖（按 window 宽度）" },
      ],
      features: ["行列间距一处配置", "断点覆盖（sm/md/lg/xl）", "不填则回退到 props"],
      useCases: ["设计规范里间距随断点变化", "同一组件在不同页面用不同密度"],
      notes: ["断点判断用的是 window.innerWidth（间距通常跟视口走，与列数按容器算不一样）。"],
    },
  },
  {
    dir: "FixedHeightPlugin",
    from: "FixedHeight",
    factory: "createFixedHeightPlugin",
    configType: "FixedHeightConfig",
    group: "layout",
    priority: 45,
    summary: "把项高度统一成固定值，瀑布流退化为等高网格。",
    doc: {
      description:
        "把数据里带 height 字段的项统一改写为固定高度，瀑布流变成等高网格。适合「图少字多」的卡片流——等高反而更好扫读。",
      tags: ["layout", "网格"],
      config: [{ name: "itemHeight", type: "number", default: "—", description: "统一项高 px（必填）" }],
      features: ["等高网格（严格对齐）", "只改数据里已有的 height 字段", "与 Pagination / Filter 组合仍然成立"],
      useCases: ["商品列表（图固定比例）", "后台看板卡片", "需要严格栅格对齐的页面"],
      notes: ["数据里没有 height 字段时不会生效——高度由 renderItem 自己的内容决定。"],
    },
  },
  {
    dir: "PinItemPlugin",
    from: "PinItem",
    factory: "createPinItemPlugin",
    configType: "PinItemConfig",
    group: "layout",
    priority: 100,
    summary: "把指定索引的项钉在顶部同一列，不参与常规列高推进（广告位 / 公告卡）。",
    doc: {
      description:
        "把若干索引的项钉在顶部指定列，其余项从它们下方继续排。走 D1-A 布局钩子（calculateItemPosition），是旧版宣称但从未生效的能力。",
      tags: ["layout", "layout-hook", "置顶"],
      config: [
        { name: "pinnedIndices", type: "number[]", default: "[]", description: "要钉住的项索引" },
        { name: "column", type: "number", default: "0", description: "钉到第几列" },
      ],
      features: [
        "置顶项不占常规列高：后续项从置顶块下方开始",
        "支持多列分别置顶（column 可不同）",
        "每次布局前重置偏移，items 变化后不会累加错位",
      ],
      useCases: ["信息流首位的推广卡", "公告 / 置顶帖", "需要固定在左上角的活动位"],
      notes: [
        "置顶项之间按 pinnedIndices 顺序纵向堆叠，同一列多条会依次往下排。",
        "置顶会挤掉该列的正常网格位置，pinnedIndices 建议控制在 1~2 条。",
      ],
    },
  },

  // ============================== perf ==============================
  {
    dir: "ThrottlePlugin",
    from: "Throttle",
    factory: "createThrottlePlugin",
    configType: "ThrottleConfig",
    group: "perf",
    priority: 80,
    summary: "调整滚动节流与尺寸防抖，弱网/低端机可放宽。",
    doc: {
      description:
        "接管 Core 的 throttleDelay（滚动回调节流）与 debounceDelay（尺寸变化后多久重排）。默认 16ms / 150ms，长列表滚动卡顿时可以放宽到 32 / 300。",
      tags: ["perf", "性能"],
      config: [
        { name: "scroll", type: "number", default: "—", description: "滚动节流 ms（必填）" },
        { name: "resize", type: "number", default: "props.debounceDelay", description: "布局防抖 ms" },
      ],
      features: ["滚动节流与布局防抖分开调", "只改 props，不改算法", "与 DebounceLayoutPlugin 叠加时后者优先"],
      useCases: ["低端安卓机长列表", "滚动时 CPU 占用过高", "拖拽侧栏时减少重排"],
      notes: ["scroll 低于 16ms 没有意义（浏览器帧率上限）。"],
    },
  },
  {
    dir: "DebounceLayoutPlugin",
    from: "DebounceLayout",
    factory: "createDebounceLayoutPlugin",
    configType: "DebounceConfig",
    group: "perf",
    priority: 75,
    summary: "单独放大布局防抖，容器频繁变宽时（抽屉/侧栏动画）不抖。",
    doc: {
      description:
        "只调 debounceDelay：容器宽度连续变化（抽屉展开、分栏拖拽）时，等变化停下来再算一次布局，避免每帧重排。",
      tags: ["perf", "性能"],
      config: [{ name: "delay", type: "number", default: "—", description: "布局防抖 ms（必填）" }],
      features: ["只影响布局时机，不影响渲染", "可被 ThrottlePlugin 覆盖", "对移动端软键盘弹出也有效"],
      useCases: ["可折叠侧栏", "分栏宽度拖拽", "横竖屏切换"],
      notes: ["delay 过大会让「展开后布局」明显滞后，建议 120–250ms。"],
    },
  },
  {
    dir: "ReducedMotionPlugin",
    from: "ReducedMotion",
    factory: "createReducedMotionPlugin",
    configType: "ReducedMotionConfig",
    group: "perf",
    priority: 70,
    summary: "尊重系统「减少动画」偏好：关掉 transform 定位与项过渡。",
    doc: {
      description:
        "检测 `prefers-reduced-motion: reduce`，命中后把 useTransform 关掉并清掉项上的 transition。前庭功能敏感用户不会因为滚动时的位置微动而不适。",
      tags: ["perf", "a11y"],
      config: [
        { name: "disableTransform", type: "boolean", default: "true", description: "命中偏好时改用 left/top 定位" },
        { name: "removeTransitions", type: "boolean", default: "true", description: "命中偏好时清掉项过渡" },
      ],
      features: ["系统偏好驱动，零配置生效", "两项能力可分别关闭", "与 TransitionPlugin 同装时优先生效"],
      useCases: ["政务 / 医疗类站点", "无障碍合规要求", "低性能设备"],
      notes: ["偏好只在挂载时读一次；用户中途改系统设置需刷新页面。"],
    },
  },
  {
    dir: "TransitionPlugin",
    from: "Transition",
    factory: "createTransitionPlugin",
    configType: "TransitionConfig",
    group: "perf",
    priority: 65,
    summary: "布局变化时给项加 transform/opacity 过渡，插入新数据不「闪现」。",
    doc: {
      description:
        "给每个项挂上 transform + opacity 的 CSS 过渡，布局重排、分页切换、筛选后重新排列时位置变化是滑过去的，不是瞬移。",
      tags: ["perf", "动效"],
      config: [
        { name: "duration", type: "number", default: "300", description: "过渡时长 ms" },
        { name: "easing", type: "string", default: "ease", description: "缓动函数" },
      ],
      features: ["项位置变化平滑过渡", "挂载时即生效（onItemMount）", "与 ReducedMotionPlugin 互斥"],
      useCases: ["筛选 / 排序后重排", "分页切换", "动态插入卡片"],
      notes: ["首屏大量项同时过渡会有一次「整体滑入」，想要更克制可以把 duration 降到 150ms。"],
    },
  },

  // ============================== data ==============================
  {
    dir: "FilterPlugin",
    from: "Filter",
    factory: "createFilterPlugin",
    configType: "FilterConfig",
    group: "data",
    priority: 40,
    summary: "按谓词过滤 items，参数变化可自动回顶。",
    doc: {
      description:
        "用谓词函数过滤数据，优先读 `props.filterFn`，没有就用工厂里传入的 predicate。过滤条件变了可以自动滚回顶部（默认不开）。",
      tags: ["data", "数据管线"],
      config: [
        { name: "predicate", type: "(item, index) => boolean", default: "—", description: "默认谓词，可被 props.filterFn 覆盖" },
        { name: "scrollToTop", type: "boolean", default: "false", description: "条件变化后回顶" },
        { name: "scrollBehavior", type: '"auto" | "smooth"', default: '"auto"', description: "回顶行为" },
      ],
      features: ["谓词抛错时按「保留」处理，不会整表消失", "props.filterFn 优先，便于页面动态换过滤条件", "可与 Sort / Search / Pagination 串联"],
      useCases: ["分类 Tab 切换", "只看有货 / 只看促销", "价格区间筛选"],
      notes: [
        "数据管线的执行顺序由 priority 决定：Filter(40) → Sort(30) → Search(20) → Pagination(10)。",
        "先过滤再分页，页码总数才是过滤后的总数——顺序反了会出现「第 2 页空」。",
      ],
    },
  },
  {
    dir: "SortPlugin",
    from: "Sort",
    factory: "createSortPlugin",
    configType: "SortConfig",
    group: "data",
    priority: 30,
    summary: "按比较函数排序 items，比较函数变化可自动回顶。",
    doc: {
      description:
        "用比较函数排序，优先读 `props.sortComparator`。排序总是在过滤之后、分页之前执行，保证「第 N 页」是排序后的第 N 页。",
      tags: ["data", "数据管线"],
      config: [
        { name: "comparator", type: "(a, b) => number", default: "—", description: "默认比较函数，可被 props.sortComparator 覆盖" },
        { name: "scrollToTop", type: "boolean", default: "false", description: "排序变化后回顶" },
        { name: "scrollBehavior", type: '"auto" | "smooth"', default: '"auto"', description: "回顶行为" },
      ],
      features: ["稳定排序（不改原数组）", "比较函数抛错按相等处理", "与 Filter / Search 顺序固定"],
      useCases: ["价格 / 时间排序", "热度排序", "手动置顶项优先"],
      notes: ["排序会复制数组（`[...items].sort`），不会改调用方传入的 items。"],
    },
  },
  {
    dir: "SearchPlugin",
    from: "Search",
    factory: "createSearchPlugin",
    configType: "SearchConfig",
    group: "data",
    priority: 20,
    summary: "按 props.searchQuery 做大小写不敏感的多字段包含匹配。",
    doc: {
      description:
        "读取 `props.searchQuery`，在指定字段上做大小写不敏感的 `includes` 匹配。没指定字段就对对象的全部自有字段匹配。",
      tags: ["data", "数据管线", "搜索"],
      config: [
        { name: "fields", type: "(keyof T)[]", default: "[]", description: "参与匹配的字段；空则匹配全部自有字段" },
        { name: "scrollToTop", type: "boolean", default: "false", description: "关键词变化后回顶" },
        { name: "scrollBehavior", type: '"auto" | "smooth"', default: '"auto"', description: "回顶行为" },
      ],
      features: ["大小写不敏感", "多字段 OR 匹配", "空关键词直接放行（不触发过滤）"],
      useCases: ["站内搜索结果页", "后台列表即时搜索", "商品名 / 店铺名联合搜索"],
      notes: ["纯前端 `includes`，不排序也不做拼音；要相关性排序请在 Search 之后接 SortPlugin。"],
    },
  },
  {
    dir: "PaginationPlugin",
    from: "Pagination",
    factory: "createPaginationPlugin",
    configType: "PaginationConfig",
    group: "data",
    priority: 10,
    summary: "按 props.pageIndex / pageSize 切片，页码从 1 开始。",
    doc: {
      description:
        "读 `props.pageIndex`（1 基）与 `props.pageSize` 切片。放在数据管线最末端，保证切的是「过滤 + 排序 + 搜索」之后的结果。",
      tags: ["data", "数据管线", "分页"],
      config: [
        { name: "pageSize", type: "number", default: "props.pageSize ?? 20", description: "每页条数" },
        { name: "scrollToTop", type: "boolean", default: "false", description: "翻页后回顶" },
        { name: "scrollBehavior", type: '"auto" | "smooth"', default: '"auto"', description: "回顶行为" },
      ],
      features: ["1 基页码（与 UI 分页器一致）", "pageIndex 非法值自动夹到 1", "翻页自动回顶可选"],
      useCases: ["后台列表分页", "搜索结果分页", "与 URLSyncPlugin 配合做可分享链接"],
      notes: ["pageSize 优先级：props.pageSize > 工厂 config.pageSize > 20。"],
    },
  },
  {
    dir: "InfiniteScrollPlugin",
    from: "InfiniteScroll",
    factory: "createInfiniteScrollPlugin",
    configType: "InfiniteScrollConfig",
    group: "data",
    priority: 35,
    summary: "滚动到距底部阈值内触发加载更多，带并发锁防重复请求。",
    doc: {
      description:
        "监听 Core 的 onReachBottom，在距底部 `threshold` 像素内触发 onLoadMore。自带并发锁：上一次还没结束不会重复触发。",
      tags: ["data", "加载更多"],
      config: [
        { name: "threshold", type: "number", default: "300", description: "触发距离 px" },
        { name: "onLoadMore", type: "() => void | Promise<void>", default: "props.onLoadMore", description: "加载回调" },
      ],
      features: ["距底 300px 预加载，滚到底时数据已就位", "并发锁：加载中不重复触发", "context.hasMore 为 false 时自动停"],
      useCases: ["信息流无限滚动", "画廊继续加载", "搜索结果瀑布流"],
      notes: [
        "阈值不要小于一屏（约 600px），否则用户滚到底会看到空白等待。",
        "翻页类场景请用 PaginationPlugin，两者不要同装。",
      ],
    },
  },

  // ============================== interaction ==============================
  {
    dir: "ClickAnalyticsPlugin",
    from: "ClickAnalytics",
    factory: "createClickAnalyticsPlugin",
    configType: "ClickAnalyticsConfig",
    group: "interaction",
    priority: 0,
    summary: "统计项点击次数，发 `analytics:click` 事件，可选角标与日志。",
    doc: {
      description:
        "统计每次项点击并累计总数，向 bus 发 `analytics:click`（带 index / item / total）。默认只上报不显示角标，接入真实版式时不会被调试面板盖住内容。",
      tags: ["interaction", "埋点"],
      config: [
        { name: "log", type: "boolean", default: "false", description: "是否在控制台打印每次点击" },
        { name: "showOverlay", type: "boolean", default: "false", description: "是否显示右上角计数角标" },
      ],
      features: ["点击总量统计（sharedData）", "bus 事件可被外部订阅上报", "角标默认关闭"],
      useCases: ["内容流点击率统计", "AB 实验埋点", "调试点击行为"],
      notes: ["生产环境请把数据从 bus 事件接到自己的埋点 SDK，不要让插件直接打日志。"],
    },
  },
  {
    dir: "HeatmapAnalyticsPlugin",
    from: "HeatmapAnalytics",
    factory: "createHeatmapAnalyticsPlugin",
    configType: "HeatmapAnalyticsConfig",
    group: "interaction",
    priority: 0,
    summary: "统计每项曝光次数与点击次数，可显示汇总条。",
    doc: {
      description:
        "按项统计「进入视口次数」与「点击次数」，用于粗粒度热力分析。首次布局会补记一次当前可见范围的曝光，避免首屏全是 0。",
      tags: ["interaction", "埋点", "曝光"],
      config: [
        { name: "showOverlay", type: "boolean", default: "false", description: "是否显示顶部汇总条" },
        { name: "showOverlaySummary", type: "boolean", default: "—", description: "showOverlay 的旧别名" },
      ],
      features: ["逐项曝光 / 点击计数", "首屏曝光自动补记", "汇总条默认关闭"],
      useCases: ["信息流曝光分析", "广告位可见性验证", "调试曝光策略"],
      notes: ["计数只存在内存里，刷新即清零；要持久化请订阅 bus 事件自行上报。"],
    },
  },
  {
    dir: "DragReorderPlugin",
    from: "DragReorder",
    factory: "createDragReorderPlugin",
    configType: "DragReorderConfig",
    group: "interaction",
    priority: 0,
    summary: "给项加 HTML5 拖拽，松手时回调 onReorder(from, to)。",
    doc: {
      description:
        "用原生 draggable 给每个项加上拖拽能力，松手时回调 `onReorder(from, to)`，同时向 bus 发 `drag:reorder`。旧版只记录 from/to、不回调，这里补上真回调。",
      tags: ["interaction", "拖拽"],
      config: [
        { name: "enabled", type: "boolean", default: "true", description: "是否启用拖拽" },
        { name: "onReorder", type: "(from, to, item) => void", default: "—", description: "重排回调" },
        { name: "showHandle", type: "boolean", default: "false", description: "是否显示虚线边框提示可拖" },
      ],
      features: ["原生 HTML5 拖拽，无额外依赖", "onReorder 回调真正可用", "bus `drag:reorder` 事件"],
      useCases: ["后台卡片排序", "收藏夹手动排序", "仪表盘组件排列"],
      notes: [
        "插件只负责「拖」和「告诉你从哪到哪」，数组重排由调用方在 onReorder 里做。",
        "触屏浏览器不支持 HTML5 拖拽；移动端请自行接 pointer 事件。",
      ],
    },
  },
  {
    dir: "ScrollAnchorPlugin",
    from: "ScrollAnchor",
    factory: "createScrollAnchorPlugin",
    configType: "ScrollAnchorConfig",
    group: "interaction",
    priority: 0,
    summary: "监听 `anchor:scrollToId` 事件，按业务 id 滚动到对应项。",
    doc: {
      description:
        "不需要自己算索引：外部只管 `bus.emit(\"anchor:scrollToId\", { id })`，插件用 getAnchorId 找到对应项并滚过去。适合「从消息跳到某条内容」。",
      tags: ["interaction", "滚动"],
      config: [
        { name: "getAnchorId", type: "(item, index) => string | number | undefined", default: "item.id", description: "从项里取锚点 id" },
      ],
      features: ["按业务 id 定位，不用算下标", "onMount 订阅 / onUnmount 退订（不泄漏）", "平滑滚动"],
      useCases: ["从通知跳转到具体卡片", "目录点击定位", "外链深链定位"],
      notes: ["目标项必须已在 items 里；分页场景请先切到对应页再发事件。"],
    },
  },
  {
    dir: "RecyclePlugin",
    from: "Recycle",
    factory: "createRecyclePlugin",
    configType: "RecycleConfig",
    group: "interaction",
    priority: 0,
    summary: "视口外的项设 `visibility: hidden`，降低长列表的绘制压力。",
    doc: {
      description:
        "纯绘制层优化：项离开视口就 `visibility: hidden`，回来再显示。DOM 节点不销毁，滚动位置与已加载的图片都保留，适合「项里有视频/Canvas，重建代价高」的场景。",
      tags: ["interaction", "性能"],
      config: [{ name: "poolSize", type: "number", default: "—", description: "同时保持可见的项数上限（超出则回收最早的）" }],
      features: ["不销毁 DOM，只隐藏", "项内媒体不重新加载", "与虚拟化正交（一个省绘制、一个省节点）"],
      useCases: ["项内含视频 / canvas", "长列表滚动发虚", "低端设备省电"],
      notes: [
        "与 Core 的 `virtualize` 同开会让项被卸载又隐藏，收益互相抵消，建议只选一个。",
        "只改 visibility 不改布局，所以不会引起重排。",
      ],
    },
  },

  // ============================== ui ==============================
  {
    dir: "A11yPlugin",
    from: "A11y",
    factory: "createA11yPlugin",
    configType: "A11yConfig",
    group: "ui",
    priority: 0,
    summary: "给容器与项补 ARIA role / label / posinset，支持键盘 Tab 遍历。",
    doc: {
      description:
        "把瀑布流补成读屏可理解的列表：容器 `role=list` + `aria-label`，每项 `role=listitem` + `aria-posinset` / `aria-setsize`，并可选加 `tabIndex` 让键盘能逐项聚焦。",
      tags: ["ui", "a11y"],
      config: [
        { name: "containerRole", type: "string", default: '"list"', description: "容器 role" },
        { name: "itemRole", type: "string", default: '"listitem"', description: "项 role" },
        { name: "enableTabIndex", type: "boolean", default: "true", description: "项是否可 Tab 聚焦" },
        { name: "containerLabel", type: "string", default: '"Waterfall list"', description: "容器 aria-label" },
      ],
      features: ["容器 / 项 role 成对补齐", "aria-posinset + aria-setsize 正确标注序号", "键盘可逐项聚焦"],
      useCases: ["政务 / 金融等合规站点", "读屏用户可用的信息流", "键盘操作优先的桌面端"],
      notes: ["项数很多时 `tabIndex=0` 会让 Tab 变长，建议配合「跳转主内容」链接使用。"],
    },
  },
  {
    dir: "GroupingPlugin",
    from: "Grouping",
    factory: "createGroupingPlugin",
    configType: "GroupingConfig",
    group: "ui",
    priority: 0,
    summary: "按字段把项分组，结果写进 sharedData(GROUPS) 供吸顶条 / 统计用。",
    doc: {
      description:
        "用 groupBy 把项按业务字段分组，结果放进 sharedData 的 `GROUPS`（Map<组键, 索引数组>），供 StickyHeaderPlugin、分组统计条等消费。挂载即算一次，之后 props 变化重算。",
      tags: ["ui", "分组"],
      config: [
        { name: "groupBy", type: "(item, index) => string | number", default: "item.category ?? \"default\"", description: "分组函数" },
        { name: "showOverlay", type: "boolean", default: "false", description: "是否显示分组统计角标" },
      ],
      features: ["挂载即计算（旧版只在 props 变化时算，首屏永远拿不到分组）", "结果写 sharedData，跨插件可读", "统计角标默认关闭"],
      useCases: ["按分类分组的信息流", "按日期分组的时间线", "吸顶条显示当前分组"],
      notes: ["分组只产出索引映射，不改变渲染顺序；要视觉分组请自己按分组建行。"],
    },
  },
  {
    dir: "StickyHeaderPlugin",
    from: "StickyHeader",
    factory: "createStickyHeaderPlugin",
    configType: "StickyHeaderConfig",
    group: "ui",
    priority: 0,
    summary: "滚动容器内的吸顶标题条，可与分组联动显示当前组。",
    doc: {
      description:
        "在滚动容器内渲染一条 `position: sticky` 的标题条，始终贴住容器顶部。装了 GroupingPlugin 时自动显示第一个分组名，也可用 title 写死。",
      tags: ["ui", "吸顶"],
      config: [
        { name: "title", type: "string", default: '"分组标题"', description: "标题文案" },
        { name: "showHint", type: "boolean", default: "false", description: "是否显示「向下滚动观察」提示" },
      ],
      features: ["sticky 吸顶，不依赖额外容器", "与 Grouping 联动显示当前组", "提示文案默认关闭"],
      useCases: ["分组信息流", "按日期分组的时间线", "长列表的上下文提示"],
      notes: ["sticky 生效要求它作为滚动容器的直接子元素——由 composeSlots 保证，单测已锁。"],
    },
  },
  {
    dir: "BookmarkPlugin",
    from: "Bookmark",
    factory: "createBookmarkPlugin",
    configType: "BookmarkConfig",
    group: "ui",
    priority: 0,
    summary: "按 B 记录滚动位置、按 R 跳回（localStorage），忽略输入框按键。",
    doc: {
      description:
        "长列表读到一半要跳走时按 **B** 存位置，回来按 **R** 复原。焦点在输入框/可编辑区域时不拦截按键。",
      tags: ["ui", "滚动", "快捷键"],
      config: [
        { name: "storageKey", type: "string", default: '"waterfall-bookmark"', description: "localStorage 键名" },
        { name: "scrollBehavior", type: '"auto" | "smooth"', default: '"smooth"', description: "恢复时的滚动行为" },
      ],
      features: ["B 存 / R 取，零 UI 侵入", "自动区分容器滚动与页面滚动", "输入框内不误触"],
      useCases: ["长文列表阅读", "后台大表格浏览", "演示时快速复位"],
      notes: ["键名全局共用，一个页面里多处瀑布流请各自传不同的 storageKey。"],
    },
  },
  {
    dir: "StatePersistencePlugin",
    from: "StatePersistence",
    factory: "createStatePersistencePlugin",
    configType: "StatePersistenceConfig",
    group: "ui",
    priority: 0,
    summary: "把滚动位置与分页/查询状态存 localStorage，回来时恢复。",
    doc: {
      description:
        "三个时机各做一件事：首次渲染把快照里的 pageIndex / searchQuery 注入 props；挂载后恢复 scrollTop；props 变化与卸载时写回快照。刷新页面不丢进度。",
      tags: ["ui", "持久化"],
      config: [
        { name: "storageKey", type: "string", default: '"waterfall-state"', description: "localStorage 键名" },
        { name: "persistScroll", type: "boolean", default: "true", description: "是否持久化滚动位置" },
        { name: "persistKeys", type: "string[]", default: '["pageIndex","pageSize","searchQuery"]', description: "要持久化的 props 键" },
      ],
      features: ["滚动位置 + 分页/查询一起存", "首帧注入只做一次，不会覆盖用户操作", "SSR / 隐私模式下降级为不持久化"],
      useCases: ["后台列表刷新不丢页", "搜索结果返回定位", "移动端来回切换页面"],
      notes: [
        "只能恢复「值」，不能替你把它写回 React state——页面应订阅 `state:restored` 事件或读 bus。",
        "localStorage 不可用（隐私模式/配额满）时静默跳过，不会抛错。",
      ],
    },
  },
  {
    dir: "URLSyncPlugin",
    from: "URLSync",
    factory: "createURLSyncPlugin",
    configType: "URLSyncConfig",
    group: "ui",
    priority: 0,
    summary: "把分页/搜索/排序同步进 URL（hash 或 search），链接可分享。",
    doc: {
      description:
        "props 变化时把指定键写进 URL（hash 或 search），挂载时读出来广播 `urlsync:init`。刷新与分享都能还原筛选状态。",
      tags: ["ui", "URL", "可分享"],
      config: [
        { name: "mode", type: '"hash" | "search"', default: '"hash"', description: "写 hash 还是 search" },
        { name: "keys", type: "string[]", default: '["pageIndex","pageSize","searchQuery"]', description: "要同步的 props 键" },
      ],
      features: ["hash 模式会保留已有路由路径", "用 replaceState，不污染后退栈", "SSR 安全：无 window 时直接跳过"],
      useCases: ["搜索结果可分享", "后台筛选状态可刷新", "带参数的深链"],
      notes: ["只做单向同步（props → URL）与初始读取；URL 前进后退的监听请页面自己做。"],
    },
  },
];
