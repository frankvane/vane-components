#!/usr/bin/env node
/**
 * 给 doc.json 补齐「事件 events / 方法 methods」两件表（属性 props 已有 config 兜底）。
 *
 * 数据来源两条腿，缺一不可：
 *  1. 事实：扫插件目录的 .ts/.tsx，精确解析 `hooks: { ... }` 顶层键、`bus.emit/on` 事件、
 *     `ctx.xxx()` 方法调用 —— 插件用了什么，就写什么，不靠猜。
 *  2. 语义：本文件里的 HOOK_DOC / METHOD_DOC / BUS_DOC 是人工校订过的中文说明，
 *     方法签名则从各包 `interface *PluginContext` 现场抽取（跟着类型走，不会过期）。
 *
 * 用法：
 *   node scripts/enrich-plugin-api.mjs            # 写入（已有 events+methods 的跳过）
 *   node scripts/enrich-plugin-api.mjs --dry      # 只报告，不落盘
 *   node scripts/enrich-plugin-api.mjs --check    # 缺表即退出 1（给 CI / 门禁用）
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PKG_DIR = path.join(ROOT, "packages");
const DRY = process.argv.includes("--dry");
const CHECK = process.argv.includes("--check");

const SKIP_PKGS = new Set(["vane-plugin-core", "vane-activity"]); // activity 的三件表是手写的样板

// ---------------------------------------------------------------- 语义表：内核钩子
const CORE_HOOKS = {
  onMount: {
    when: "组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行）",
    desc: "初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾",
  },
  onUnmount: {
    when: "组件卸载前执行一次",
    desc: "释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏",
  },
  onPropsChange: {
    when: "宿主 props 变化后（回传 prev / next 两份）",
    desc: "按新旧 props 差分决定是否重算内部状态，避免无差别刷新",
  },
  onError: {
    when: "任一插件钩子抛错、被沙箱隔离之后",
    desc: "上报或降级处理错误；自身抛错不会影响其他插件",
  },
  transformProps: {
    when: "渲染前，按 order / priority 链式执行",
    desc: "改写宿主 props（补默认值、剔除非法参数），下游插件拿到的是改写后的结果",
  },
  transformData: {
    when: "渲染前，对 data 链式改写",
    desc: "改写数据（排序 / 过滤 / 脱敏），渲染与下游插件都看到改写后的结果",
  },
  renderOverlay: {
    when: "每次渲染，绝对定位覆盖在主内容之上",
    desc: "渲染浮层内容（角标、提示、动画、工具条），不挤占主内容布局",
  },
  renderHeader: {
    when: "每次渲染，头部槽位",
    desc: "渲染头部区域；同槽按 order 升序、priority 降序排布",
  },
  renderFooter: {
    when: "每次渲染，底部槽位",
    desc: "渲染底部区域；同槽按 order 升序、priority 降序排布",
  },
};

// ---------------------------------------------------------------- 语义表：领域钩子
const PKG_HOOKS = {
  "vane-card": {
    onClick: {
      when: "用户点击卡片主体（内部按钮的点击也会冒泡到这里，需自行判 target）",
      desc: "整卡点击行为：跳转、埋点、展开详情",
    },
    onHover: {
      when: "指针进入 / 离开卡片（isHovered 布尔值）",
      desc: "悬停态处理：预加载、浮层提示、动效触发",
    },
    onVisibilityChange: {
      when: "IntersectionObserver 判定可见性变化（首次判定也会触发）",
      desc: "曝光 / 离开视口的上报与懒执行入口",
    },
    onResize: {
      when: "容器尺寸变化（width / height，ResizeObserver 驱动）",
      desc: "按尺寸切换排版或降级（如窄卡隐藏副标题）",
    },
    renderPriceArea: {
      when: "渲染价格区时（卡片按 usePluginSlot(\"priceArea\") 读取）",
      desc: "价格区领域槽：比价、省钱徽章、单位价、可领券提示等，排序规则与内核插槽一致",
    },
    renderOverlay: {
      when: "每次渲染，绝对定位覆盖在卡片内容之上",
      desc: "卡片浮层：角标、收藏按钮、动画、骨架遮罩等",
    },
    renderHeader: { when: "每次渲染，卡片头部槽位", desc: "卡片头部内容（标题行、标签、状态条）" },
    renderFooter: { when: "每次渲染，卡片底部槽位", desc: "卡片底部内容（操作行、价格补充、来源）" },
    transformProps: {
      when: "渲染前链式改写卡片 props",
      desc: "注入默认值、裁剪字段、按 config 覆盖宿主 props",
    },
    onMount: {
      when: "卡片挂载完成、插件注册后执行一次",
      desc: "建立观察器 / 监听器，返回清理函数以便卸载时释放",
    },
    onStateChange: {
      when: "setState 提交后（回传 prevState / nextState 两份完整状态）",
      desc: "状态差分后的联动：刷新派生值、上报曝光、触发动效；setState updater 本身保持纯函数",
    },
  },
  "vane-comment": {
    renderToolbar: { when: "每次渲染，列表级顶栏槽位", desc: "排序栏、计数、筛选开关等列表级工具" },
    renderFooter: { when: "每次渲染，列表级底部槽位", desc: "根评论框、加载更多、登录提示" },
    renderCommentActions: {
      when: "逐条渲染评论的操作行（payload 为当前 comment）",
      desc: "点赞、回复、复制、举报等单条操作按钮",
    },
    renderNested: {
      when: "逐条渲染楼中楼嵌套区（payload 为当前 comment）",
      desc: "展开 / 收起子回复、嵌套列表",
    },
    transformData: {
      when: "渲染前，对评论列表链式改写",
      desc: "排序、过滤、审核隐藏、敏感词替换；下游拿到的 context.data 即可见列表",
    },
  },
  "vane-coupon": {
    renderHeader: { when: "每次渲染，券面头部槽位", desc: "面额、券名、标签等券面主视觉" },
    renderFooter: { when: "每次渲染，券面底部槽位", desc: "有效期、使用门槛、领取 / 使用按钮" },
    onPhaseChange: {
      when: "券相位变化后（如 available → used / expired）",
      desc: "相位切换时的副作用：埋点、提示、动效",
    },
    onValidityChange: {
      when: "可用性判定结果变化（门槛、时间窗、库存等条件重算）",
      desc: "根据可用性变更刷新外部状态或提示",
    },
    onMount: { when: "券组件挂载完成、插件注册后执行一次", desc: "初始化副作用，可返回清理函数" },
  },
  "vane-danmaku": {
    renderOverlay: { when: "每次渲染，覆盖在播放器画面之上", desc: "渲染在飞弹幕、特效层、命中区域" },
    renderHeader: { when: "每次渲染，播放器顶部槽位", desc: "弹幕开关、密度设置、工具栏" },
    renderFooter: { when: "每次渲染，播放器底部槽位", desc: "弹幕输入框、发送按钮、快捷指令入口" },
    transformData: {
      when: "渲染前，对弹幕列表链式改写",
      desc: "过滤、去重、着色、限流；下游看到的是改写后的待渲染列表",
    },
  },
  "vane-file-preview": {
    canHandle: {
      when: "内核询问「谁能预览这个文件」时（按优先级依次询问）",
      desc: "返回 true 表示认领该文件；返回 false / undefined 表示不处理",
    },
    priorityOf: {
      when: "内核为该文件计算候选插件优先级时",
      desc: "按文件类型动态算优先级，覆盖声明式 priority（同一插件在不同类型间排序不同）",
    },
    render: {
      when: "本插件认领文件后，渲染预览主体",
      desc: "输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等）",
    },
    renderToolbar: {
      when: "每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader）",
      desc: "缩放、翻页、下载、全屏等预览操作",
    },
  },
  "vane-lazy-image": {
    onBeforeLoad: {
      when: "发起图片请求之前",
      desc: "返回 false 可阻断本次加载（如权限校验、占位策略）",
    },
    onLoad: {
      when: "加载流程开始、需要确定最终图片地址时",
      desc: "自定义加载逻辑，返回最终图片 URL（objectURL / dataURL / 原地址）",
    },
    onLoadSuccess: {
      when: "图片成功解码可显示时",
      desc: "拿到最终 displaySrc 做后续动作（上报、预取下张、淡入）",
    },
    onLoadError: {
      when: "加载失败（网络错误、解码失败、超时）",
      desc: "返回 true 表示错误已被处理（如切换备用源），否则继续走默认降级",
    },
    onProgress: {
      when: "加载进度更新（由 withPlugins 订阅 bus 的 \"progress\" 桥接）",
      desc: "展示进度条 / 百分比；仅对支持进度上报的 loader 生效",
    },
    onSrcChange: {
      when: "src 变化、切换到新图时",
      desc: "重置状态、清理旧缓存、重新进入懒加载判定",
    },
    onEnterViewport: { when: "元素进入视口（IntersectionObserver）", desc: "触发懒加载、开始请求、曝光上报" },
    onLeaveViewport: { when: "元素离开视口", desc: "暂停 / 中止在途请求、回收资源" },
    onActiveChange: {
      when: "图库当前激活图切换后",
      desc: "同步缩略图高亮、预加载相邻图、更新 URL",
    },
    galleryOverlay: { when: "渲染图库大图浮层时", desc: "大图视图、切换器、关闭按钮等浮层内容" },
    galleryThumbArea: { when: "渲染图库缩略图条时", desc: "底部 / 侧边缩略图列表" },
    galleryToolbarArea: { when: "渲染图库工具栏时", desc: "缩放、下载、分享等图库级操作" },
    renderOverlay: { when: "每次渲染，覆盖在图片容器之上", desc: "骨架屏、错误占位、水印、加载动画" },
    transformProps: { when: "渲染前链式改写图片 props", desc: "补 sizes / 占位色 / 解码策略等" },
  },
  "vane-modal-sheet": {
    renderBackdrop: { when: "每次渲染，遮罩层专用槽位", desc: "自定义遮罩样式或再加一层内容（模糊、点击关闭提示）" },
    renderHandle: { when: "每次渲染，拖拽把手槽位", desc: "把手的视觉与拖拽提示" },
    renderHeader: { when: "每次渲染，面板顶部槽位", desc: "面板标题、关闭按钮、步骤指示" },
    renderFooter: { when: "每次渲染，面板底部槽位", desc: "操作按钮、二次确认、安全区占位" },
    renderOverlay: { when: "每次渲染，覆盖在面板内容之上", desc: "面板内浮层（提示、下拉、加载遮罩）" },
    onSnap: {
      when: "吸附到某一档位后（含打开补间结束）",
      desc: "拿到目标档位 index，做联动（切换内容、上报展开高度）",
    },
    onOpen: { when: "打开补间动画完成后", desc: "打开后的副作用：聚焦、埋点、拉数据" },
    onClose: { when: "关闭补间动画完成后（受控关闭也会触发）", desc: "关闭后的清理与上报" },
    transformProps: { when: "渲染前链式改写真面板 props", desc: "按 config 覆盖高度档位、遮罩、圆角等" },
  },
  "vane-profile": {
    renderBannerArea: { when: "每次渲染，头图区槽位", desc: "封面图、渐变背景、头像浮层位" },
    renderStatRow: { when: "每次渲染，数据行槽位", desc: "关注 / 粉丝 / 获赞 / 作品等指标" },
    renderTabBar: { when: "每次渲染，页签栏槽位", desc: "页签按钮；点击经 ctx.setActiveTab 驱动内容区联动" },
    renderBadgeArea: { when: "每次渲染，认证徽标区（默认头图右上角）", desc: "认证标识、等级徽章、状态角标" },
    renderFollowArea: { when: "每次渲染，关注回显区槽位", desc: "关注 / 已关注 / 互相关注的按钮与文案" },
    renderBioArea: { when: "每次渲染，简介区槽位（头图与数据行之间）", desc: "昵称、签名、所在地、加入时间" },
    renderContentArea: { when: "每次渲染，内容区槽位（随 activeTab 联动）", desc: "插件贡献的内容面板；有内容插件时覆盖 children" },
    onTabChange: { when: "activeTab 变化后（回传 newTab / oldTab）", desc: "切页副作用：懒加载、埋点、滚动复位" },
    onPropsChange: { when: "资料 props 变化后", desc: "按新旧资料差分刷新派生状态" },
  },
  "vane-resume": {
    renderToolbar: { when: "每次渲染，工具栏槽位", desc: "模板切换、导出、语言、版本等全局操作" },
    renderBasics: { when: "每次渲染，基本信息区槽位", desc: "姓名、职位、联系方式等抬头信息" },
    renderWork: { when: "每次渲染，工作经历区槽位", desc: "公司、职位、时间段的排版与补充字段" },
    renderEducation: { when: "每次渲染，教育经历区槽位", desc: "学校、专业、时间段的排版与补充字段" },
    renderAttachments: { when: "每次渲染，附件区槽位", desc: "作品集、证书、项目链接等附件列表" },
    renderFooter: { when: "每次渲染，页脚槽位", desc: "版权、更新时间、导出提示" },
    transformData: { when: "渲染前，对简历数据链式改写", desc: "模板 / 语言切换、字段脱敏、结构调整" },
    onMount: { when: "简历组件挂载完成", desc: "初始化副作用（读取本地版本、恢复状态）" },
  },
  "vane-sign-in": {
    renderHeader: { when: "每次渲染，头部区槽位", desc: "连签天数、积分、等级、倒计时" },
    renderCalendar: { when: "每次渲染，日历区槽位", desc: "日历条 / 月历网格 / 漏签标记" },
    renderRewards: { when: "每次渲染，奖励区槽位", desc: "逐日奖励预告、领取态、里程碑奖励" },
    renderActions: { when: "每次渲染，操作区槽位", desc: "签到 CTA、补签、分享、提醒、邀请" },
    renderFooter: { when: "每次渲染，底部区槽位", desc: "规则展开、领取记录入口" },
  },
  "vane-sku": {
    onSkuChange: {
      when: "用户选择或命中变体变化后（回传 selection / variant）",
      desc: "联动价格、库存、图片，或做埋点上报",
    },
    renderHeader: { when: "每次渲染，规格面板头部槽位", desc: "商品图、价格、已选摘要" },
    renderOverlay: { when: "每次渲染，覆盖在规格面板之上", desc: "浮层选择器、库存提示、加载遮罩" },
    onMount: { when: "规格组件挂载完成", desc: "初始化副作用（URL 同步、状态恢复）" },
  },
  "vane-waterfall": {
    calculateColumns: {
      when: "每次布局前，询问列数",
      desc: "返回列数则覆盖 props.columns；返回 undefined 沿用配置",
    },
    calculateItemPosition: {
      when: "每个卡片参与布局时（拿到 index / item / columns）",
      desc: "返回坐标片段可覆盖列分配结果（置顶、跨列、错位）",
    },
    onBeforeLayout: {
      when: "开始一次布局之前",
      desc: "返回 false 可阻止本次布局（如数据仍在加载）",
    },
    onLayout: { when: "布局计算完成、结果已确定", desc: "读取每列高度、做二次修正或上报" },
    onLayoutComplete: { when: "DOM 落位完成（可安全测量）", desc: "测量真实高度、懒加载判定、曝光上报" },
    onItemMount: { when: "单个卡片挂载并拿到 DOM 元素时", desc: "按卡片绑定监听、观察器、埋点" },
    onItemUnmount: { when: "单个卡片卸载时", desc: "解绑该卡片的监听与观察器" },
    onItemEnterViewport: { when: "单个卡片进入视口", desc: "卡片级曝光、视频自动播放等" },
    onItemLeaveViewport: { when: "单个卡片离开视口", desc: "暂停播放、回收资源" },
    onItemClick: { when: "单个卡片被点击", desc: "卡片级跳转与点击埋点" },
    onReachBottom: { when: "滚动触底（distance 为距底像素）", desc: "加载更多、预取下一页" },
    onResize: { when: "容器宽度变化触发重排前", desc: "按新宽度调整列数或卡片密度" },
    renderItemWrapper: {
      when: "渲染每个卡片时包裹其内容",
      desc: "给单卡加包裹层（拖拽、无障碍语义、占位骨架）",
    },
    renderOverlay: { when: "每次渲染，滚动容器内的内容层之上", desc: "回到顶部、加载提示、浮层工具" },
    transformProps: { when: "渲染前链式改写瀑布流 props", desc: "补 gap / columns 默认值、按断点覆盖配置" },
    onMount: { when: "瀑布流挂载完成", desc: "初始化观察器与滚动监听，返回清理函数" },
    onUnmount: { when: "瀑布流卸载前", desc: "断开观察器、移除滚动监听" },
    onPropsChange: { when: "props 变化后", desc: "数据或配置变化时请求重排" },
  },
  "vane-file-preview-extra": {},
};

// ---------------------------------------------------------------- 语义表：上下文方法
const METHOD_DOC = {
  setState: "合并写入内核 state 并触发重渲染；只有字段真正变化时才更新",
  forceUpdate: "主动触发宿主重渲染；改了闭包里的可变状态后必须调用，否则视图不刷新",
  getSize: "读取宿主容器当前尺寸（px），用于按尺寸排版或降级",
  getContainer: "取宿主 DOM 容器，可能为 null，使用前需判空",
  setSortMode: "切换列表排序模式（写入内核 state，触发 context 重建与重排）",
  setPhase: "写入业务相位（写入即触发 context 重建与视图切换）",
  toggleRules: "展开 / 收起规则面板（写入内部 UI 状态）",
  reportState: "上报预览状态（唯一写入路径，由内核转发给 Core）",
  setActiveIndex: "切换图库当前激活图索引，并联动缩略图与预加载",
  setFrameIndex: "切换 360° 环物当前帧（写入图集协调态，触发重新渲染）",
  setZoom: "设置图库缩放比例（按钮式缩放控制的写入入口）",
  setFavorited: "写入收藏态并触发重渲染（收藏按钮的唯一致入口）",
  reset: "重置到初始状态（清空错误与进度，不主动重新发起加载）",
  close: "关闭面板：走关闭补间，动画结束后触发 onClose",
  getDragProps: "取拖拽把手所需的 props（事件处理器与样式），透传给把手元素",
  getPanel: "取面板 DOM 节点，用于测量或聚焦，可能为 null",
  setViewportInset: "设置面板与视口的安全内边距（避开刘海 / 底部手势区）",
  snapTo: "吸附到指定档位（带补间动画，结束后触发 onSnap）",
  setActiveTab: "切换页签并触发内容区联动（写入内核 state）",
  setSelection: "写入已选规格（内核 state，触发价格 / 库存 / 图片联动）",
  clearSelection: "清空全部已选规格，回到未选状态",
  getItemRef: "取第 index 张卡片的 DOM 引用，可能为 null（尚未挂载 / 已回收）",
};

// ---------------------------------------------------------------- 语义表：总线事件
const BUS_DOC = {
  "vane-card": {
    "cart:change": { when: "点击加购按钮后", desc: "广播加购结果 { id, count }，供外部购物车同步" },
    "wishlist:change": { when: "点击收藏按钮后", desc: "广播收藏状态 { id, active }" },
  },
  "vane-coupon": {
    "coupon:analytics": { when: "曝光 / 领取 / 使用等动作发生时", desc: "统一埋点出口 { event, ...payload }" },
  },
  "vane-danmaku": {
    "danmaku:audit": { when: "每条弹幕进入审核队列时", desc: "携带 { item } 供外部审核系统接管" },
    "danmaku:command": { when: "命中指令语法（如 /clear）时", desc: "广播 { type, payload, item } 给业务层执行动作" },
    "danmaku:send": { when: "输入框提交发送时", desc: "广播待发送文本 { text }，由外部决定是否入列" },
    "danmaku:filter": { when: "过滤开关切换时", desc: "广播 { key, enabled }，同步过滤策略" },
    "danmaku:settings": { when: "设置面板任一配置变更时", desc: "广播完整配置快照，供持久化" },
  },
  "vane-lazy-image": {
    "cache:hit": { when: "命中 IndexedDB 缓存、跳过网络请求时", desc: "携带 { level, src }，可用于统计缓存命中率" },
    progress: { when: "流式加载进度更新时", desc: "广播 { loaded, total }，桥接到 onProgress 钩子" },
  },
  "vane-resume": {
    "resume:export": { when: "点击导出并选定方式后", desc: "广播 { method }，由外部执行打印 / 下载" },
    "resume:lang-change": { when: "切换简历语言时", desc: "广播语言 code，触发数据与文案切换" },
    "resume:template-change": { when: "切换模板时", desc: "广播模板 id，触发版式重排" },
    "resume:version:save": { when: "保存版本快照时", desc: "广播快照对象，供持久化到外部存储" },
    "resume:data-replace": { when: "恢复某个版本时", desc: "广播被恢复的数据，整体替换当前简历" },
    "resume:version:delete": { when: "删除版本时", desc: "广播版本 id" },
    "resume:deliver:add": {
      when: "外部通过 bus.emit 投递一条新数据时（本插件订阅）",
      desc: "接收外部投递的简历数据并并入当前列表",
    },
  },
  "vane-sku": {
    "sku:analytics": { when: "挂载 / 命中变更 / 无效组合时", desc: "广播埋点事件对象，供外部 SDK 上报" },
    "sku:image": { when: "命中变体带图、需要切换主图时", desc: "广播目标图片地址，由外部图区响应" },
  },
  "vane-waterfall": {
    "analytics:click": { when: "卡片点击后", desc: "广播 { index, key, item, event, total } 点击埋点" },
    "drag:reorder": { when: "拖拽排序完成后", desc: "广播 { from, to }，供业务层同步顺序" },
    "props:invalidate": { when: "内部布局参数变更需要重排时", desc: "通知宿主刷新 props 触发重新布局" },
    "grouping:change": { when: "分组结果变化时", desc: "广播 { groups } 分组结构" },
    "state:restored": { when: "从持久化恢复滚动位置 / 顺序后", desc: "广播恢复后的状态快照" },
    "urlsync:init": { when: "从 URL 参数初始化完成后", desc: "广播初始参数快照" },
  },
};

// ---------------------------------------------------------------- 工具：解析
function matchBrace(text, openIdx) {
  let depth = 0;
  let quote = null;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return text.slice(openIdx + 1, i);
    }
  }
  return null;
}

/** hooks 对象的顶层键（跳过嵌套函数体与字符串） */
function topLevelKeys(body) {
  const keys = [];
  let depth = 0;
  let start = 0;
  const segs = [];
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < body.length && body[i] !== q) {
        if (body[i] === "\\") i++;
        i++;
      }
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      segs.push(body.slice(start, i));
      start = i + 1;
    }
  }
  segs.push(body.slice(start));
  for (const seg of segs) {
    // 段首可能是注释（如 `// 在 props 层注入模糊` / `/* ... */`），先剥掉再认键名，
    // 否则「hooks 对象第一个键带注释」会整段漏识别（BlurUpPlugin 踩过）。
    const cleaned = seg
      .replace(/^(?:\s*\/\/[^\n]*\n)+/, "")
      .replace(/^(?:\s*\/\*[\s\S]*?\*\/\s*)+/, "")
      .trimStart();
    const m = cleaned.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*(?:\(|:)|^\.\.\./);
    if (!m) continue;
    if (m[0] === "...") {
      keys.push("...spread");
      continue;
    }
    keys.push(m[1]);
  }
  return keys;
}

/** 每个包：interface *Context 里的方法签名（属性箭头 + 方法语法两种写法都要认） */
function contextSignatures(pkg) {
  const map = {};
  const base = path.join(PKG_DIR, pkg, "src");
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) scan(full);
    }
  };
  const scan = (file) => {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/export interface (\w*Context)\b[^{]*\{/g)) {
      const body = matchBrace(text, text.indexOf("{", m.index + m[0].length - 1));
      if (!body) continue;
      // 写法一：name: (a: X) => Y;
      for (const mm of body.matchAll(/^\s{2}([A-Za-z_$][\w$]*)\??:\s*\(([^;]*?)\)\s*=>\s*([^;]+);/gm)) {
        if (!map[mm[1]]) map[mm[1]] = { params: mm[2].trim(), ret: mm[3].trim() };
      }
      // 写法二（方法语法）：name(a: X): Y;
      for (const mm of body.matchAll(/^\s{2}([A-Za-z_$][\w$]*)\??\s*\(([^)]*)\)\s*:\s*([^;{]+);/gm)) {
        if (!map[mm[1]]) map[mm[1]] = { params: mm[2].trim(), ret: mm[3].trim() };
      }
    }
  };
  if (existsSync(base)) walk(base);
  return map;
}

/** 组装成 `ctx.name(a: X): Y` */
function toCallSignature(name, sig) {
  return sig.params ? `ctx.${name}(${sig.params}): ${sig.ret}` : `ctx.${name}(): ${sig.ret}`;
}

const HOOK_ORDER = [
  "onMount", "onUnmount", "onPropsChange", "onError", "onOpen", "onClose", "onSnap",
  "onClick", "onHover", "onVisibilityChange", "onResize", "onTabChange", "onSkuChange",
  "onItemClick", "onItemMount", "onItemUnmount", "onItemEnterViewport", "onItemLeaveViewport",
  "onReachBottom", "onBeforeLayout", "onLayout", "onLayoutComplete", "onBeforeLoad", "onLoad",
  "onLoadSuccess", "onLoadError", "onProgress", "onSrcChange", "onEnterViewport", "onLeaveViewport",
  "onActiveChange", "onPhaseChange", "onValidityChange",
  "transformProps", "transformData", "canHandle", "priorityOf",
  "calculateColumns", "calculateItemPosition",
  "render", "renderOverlay", "renderHeader", "renderFooter", "renderToolbar",
];
const orderOf = (arr, name) => {
  const i = arr.indexOf(name);
  return i === -1 ? arr.length : i;
};

// ---------------------------------------------------------------- 主流程
const report = { written: 0, skipped: 0, missingDoc: [], unresolvedHook: new Set(), unresolvedMethod: new Set() };
const pkgs = readdirSync(PKG_DIR).filter((d) => d.startsWith("vane-") && !SKIP_PKGS.has(d));

for (const pkg of pkgs) {
  const dir = path.join(PKG_DIR, pkg, "src", "custom-plugins");
  if (!existsSync(dir)) continue;
  const sigs = contextSignatures(pkg);

  for (const sub of readdirSync(dir)) {
    const pdir = path.join(dir, sub);
    if (!statSync(pdir).isDirectory() || sub.startsWith("_")) continue;
    const docFile = path.join(pdir, "doc.json");
    if (!existsSync(docFile)) {
      report.missingDoc.push(`${pkg}/${sub}`);
      continue;
    }
    const raw = readFileSync(docFile, "utf8");
    let doc;
    try {
      doc = JSON.parse(raw);
    } catch {
      report.missingDoc.push(`${pkg}/${sub}（JSON 解析失败）`);
      continue;
    }
    if (Array.isArray(doc.events) && Array.isArray(doc.methods)) {
      report.skipped++;
      continue;
    }

    const files = readdirSync(pdir).filter((f) => /\.tsx?$/.test(f)).map((f) => path.join(pdir, f));
    const code = files.map((f) => readFileSync(f, "utf8")).join("\n");

    // 1) 实现了哪些钩子
    const hooks = new Set();
    for (const m of code.matchAll(/\bhooks\s*:\s*\{/g)) {
      const body = matchBrace(code, code.indexOf("{", m.index + m[0].length - 1));
      if (body) topLevelKeys(body).forEach((k) => hooks.add(k));
    }

    // 2) 广播 / 订阅了哪些总线事件
    const emits = new Set();
    for (const m of code.matchAll(/\bemit\s*\(\s*["'`]([^"'`]+)["'`]/g)) emits.add(m[1]);
    const listens = new Set();
    for (const m of code.matchAll(/\bbus\s*\.\s*on\s*\(\s*["'`]([^"'`]+)["'`]/g)) listens.add(m[1]);

    // 3) 调了哪些上下文方法
    const FIELD = new Set([
      "props", "state", "data", "shared", "sharedData", "deviceInfo", "refs", "bus", "logger",
      "containerRef", "size", "cardId", "comments", "sortMode", "config", "meta", "name", "version",
    ]);
    const calls = new Set();
    for (const m of code.matchAll(/\b(?:ctx|context)\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/g)) {
      const n = m[1];
      if (!FIELD.has(n) && sigs[n]) calls.add(n);
    }
    // 解构式用法：const { setState, activeIndex } = context —— 方法同样要计入
    for (const m of code.matchAll(/\bconst\s*\{([^}]*)\}\s*=\s*(?:ctx|context)\b/g)) {
      for (const raw of m[1].split(",")) {
        const name = raw.split(":")[0].replace(/\.\.\./, "").trim();
        if (name && !FIELD.has(name) && sigs[name]) calls.add(name);
      }
    }

    // 4) 组装 events
    const pkgHookDoc = PKG_HOOKS[pkg] || {};
    const events = [...hooks]
      .filter((h) => {
        const known = pkgHookDoc[h] || CORE_HOOKS[h];
        if (!known) report.unresolvedHook.add(`${pkg}:${h}`);
        return Boolean(known);
      })
      .sort((a, b) => orderOf(HOOK_ORDER, a) - orderOf(HOOK_ORDER, b))
      .map((h) => {
        const d = pkgHookDoc[h] || CORE_HOOKS[h];
        return { name: h, when: d.when, description: d.desc };
      });

    for (const ev of [...emits].sort()) {
      const d = BUS_DOC[pkg]?.[ev];
      events.push({
        name: ev,
        when: d?.when || "本插件在状态变化时通过 ctx.bus.emit 广播",
        description: d?.desc || "总线广播事件，供外部用 ctx.bus.on 订阅",
      });
    }
    for (const ev of [...listens].sort()) {
      if (emits.has(ev)) continue;
      const d = BUS_DOC[pkg]?.[ev];
      events.push({
        name: ev,
        when: d?.when || "外部通过 ctx.bus.emit 投递时（本插件挂载后订阅）",
        description: d?.desc || "总线订阅事件，卸载时自动取消订阅",
      });
    }

    // 5) 组装 methods
    const methods = [...calls].sort().map((n) => {
      const sig = sigs[n];
      const desc = METHOD_DOC[n];
      if (!desc) report.unresolvedMethod.add(`${pkg}:${n}`);
      return {
        name: n,
        signature: toCallSignature(n, sig),
        description: desc || "调用上下文提供的能力（见签名）",
      };
    });

    // 6) 文本插入（保住原有排版：紧跟 "tags" 一行之后）
    const block = [];
    block.push(`  "events": [${events.length ? "" : "],"}`);
    if (events.length) {
      events.forEach((e, i) => {
        block.push(
          `    {\n      "name": ${JSON.stringify(e.name)},\n      "when": ${JSON.stringify(e.when)},\n      "description": ${JSON.stringify(e.description)}\n    }${i === events.length - 1 ? "" : ","}`
        );
      });
      block.push("  ],");
    }
    if (methods.length) {
      block.push('  "methods": [');
      methods.forEach((m, i) => {
        block.push(
          `    {\n      "name": ${JSON.stringify(m.name)},\n      "signature": ${JSON.stringify(m.signature)},\n      "description": ${JSON.stringify(m.description)}\n    }${i === methods.length - 1 ? "" : ","}`
        );
      });
      block.push("  ],");
    } else {
      block.push('  "methods": [],');
      block.push('  "methodsNote": "只读取 context 字段（props / state / data），不调用上下文方法",');
    }

    const anchor = raw.match(/^\s*"tags":\s*\[[^\]]*\]\s*,?\s*$/m);
    if (!anchor) {
      report.missingDoc.push(`${pkg}/${sub}（tags 不是单行，无法安全插入）`);
      continue;
    }
    let line = anchor[0];
    if (!/,\s*$/.test(line)) line = line.replace(/\s*$/, ",");
    const next = raw.replace(anchor[0], `${line}\n${block.join("\n")}`);
    JSON.parse(next); // 保险：插入后必须仍是合法 JSON

    if (!DRY) writeFileSync(docFile, next, "utf8");
    report.written++;
  }
}

console.log(`写入 ${report.written} 个 doc.json（dry=${DRY}），已存在跳过 ${report.skipped} 个`);
if (report.unresolvedHook.size) {
  console.log("\n未收录语义的钩子（需补 PKG_HOOKS）:");
  [...report.unresolvedHook].sort().forEach((x) => console.log("  " + x));
}
if (report.unresolvedMethod.size) {
  console.log("\n未收录说明的方法（已用兜底文案）:");
  [...report.unresolvedMethod].sort().forEach((x) => console.log("  " + x));
}
if (report.missingDoc.length) {
  console.log("\n未处理:");
  report.missingDoc.forEach((x) => console.log("  " + x));
}
if (CHECK && (report.written || report.missingDoc.length)) process.exit(1);
