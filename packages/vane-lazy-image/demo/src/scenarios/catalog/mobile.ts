import type { ScenarioMeta } from "../types";

/** I · 移动弱网：3G、低电量、内存压力、断网恢复、性能埋点。 */
export const MOBILE: ScenarioMeta[] = [
  {
    id: "i1-3g-skeleton",
    code: "I1",
    cat: "mobile",
    title: "3G 慢网加载",
    ref: { site: "移动端信息流", page: "3G 环境首屏", url: "https://www.bilibili.com/" },
    pain: "650ms RTT 下，没有进度反馈的等待会被用户当成「卡死」。",
    tone: "light",
    plugs: [
      { fn: "createNetworkAnalyticsPlugin", arg: "{ trackCDN: true }", why: "采集耗时与字节" },
      { fn: "createSkeletonPlugin", arg: '{ type: "shimmer" }', why: "骨架占位" },
      { fn: "createProgressOverlayPlugin", arg: "{ showPercentText: true }", why: "真实百分比" },
    ],
  },
  {
    id: "i2-saver-battery",
    code: "I2",
    cat: "mobile",
    title: "省流量 + 低电量",
    ref: { site: "移动端商城", page: "降级模式", url: "https://www.jd.com/" },
    pain: "用户开了省流量、电量只剩 15%，还按桌面规格拉图就是纯浪费。",
    tone: "light",
    plugs: [
      { fn: "createDataSaverPlugin", arg: "{ respectSaveData: true }", why: "尊重系统开关" },
      { fn: "createBatteryAwarePlugin", arg: "{ lowBatteryThreshold: 0.2 }", why: "低电量降档" },
      { fn: "createAdaptiveQualityPlugin", arg: "{ lowQ: 40, highQ: 80 }", why: "按网络定质量" },
    ],
  },
  {
    id: "i3-memory-pressure",
    code: "I3",
    cat: "mobile",
    title: "内存压力中止",
    ref: { site: "低端安卓", page: "长列表滚动", url: "https://www.bilibili.com/" },
    pain: "离开视口的图还占着解码位图，低端机滚两次就掉帧甚至被系统杀掉。",
    tone: "light",
    plugs: [
      { fn: "createMemoryPressureAbortPlugin", arg: "{ abortOnLeave: true }", why: "离屏即 abort" },
      { fn: "createDecodeAfterIdlePlugin", arg: "{ timeoutMs: 600 }", why: "空闲再解码" },
    ],
  },
  {
    id: "i4-offline-recover",
    code: "I4",
    cat: "mobile",
    title: "断网 → 恢复",
    ref: { site: "移动端内容站", page: "地铁断网", url: "https://www.bilibili.com/" },
    pain: "断网时是空框，恢复后还得手动刷新——用户会觉得「这 App 坏了」。",
    tone: "light",
    plugs: [
      { fn: "createOfflinePlugin", arg: "{ warm: true }", why: "断网占位 + 恢复重取" },
      { fn: "createRetryOnErrorPlugin", arg: "{ maxRetries: 3, jitter: true }", why: "指数退避重试" },
      { fn: "createErrorTrackingPlugin", arg: "{ report }", why: "失败可追踪" },
    ],
    note: "window.__vaneOfflineErrors 里是失败记录。",
  },
  {
    id: "i5-perf-beacon",
    code: "I5",
    cat: "mobile",
    title: "首屏性能埋点",
    ref: { site: "内容站数据看板", page: "图片性能", url: "https://www.bilibili.com/" },
    pain: "说「图片慢」没有数字支撑，优化就只能靠猜。",
    tone: "dark",
    plugs: [
      { fn: "createPerformanceMonitorPlugin", arg: "{ showOverlay: true }", why: "实时耗时浮层" },
      { fn: "createEventLoggerPlugin", arg: '{ prefix: "[VANE]" }', why: "事件进控制台" },
      { fn: "createUserBehaviorPlugin", arg: "{ onReport }", why: "曝光/点击上报" },
      { fn: "createViewportDwellPlugin", arg: "{ dwellMs: 250 }", why: "去抖真实曝光" },
    ],
  },
];
