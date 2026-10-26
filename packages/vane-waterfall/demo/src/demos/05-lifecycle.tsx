/**
 * 05 · 生命周期和事件
 *
 * 13 个回调全部接上，打到右栏日志里 —— 用来回答「这个钩子到底什么时候触发、参数是什么」。
 * 不装插件也能收到这些事件：props 回调先跑，插件钩子链后跑。
 *
 * 两个必须节流的地方：onScroll 每帧都来、onItemEnterViewport 一次滚动能来几十条。
 * 不节流的话日志区会把真正重要的 onLayoutComplete 冲掉。
 */
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "lifecycle",
  title: "生命周期和事件",
  group: "advanced",
  intro: "13 个回调接满，滚一下就能看见谁在什么时候触发。",
  why: "要在「布局完成」后做点什么（补曝光统计、量真实高度、写埋点），就得知道 onLayout 与 onLayoutComplete 的差别：后者里读 layout 才是新的。",
  plugs: [],
  props: [
    "onMount={() => log('onMount')}",
    "onLayoutComplete={() => log('布局完成')}",
    "onScroll={(t) => log('scroll ' + t)}",
    "onItemEnterViewport={(i) => log('enter #' + i)}",
    "onReachBottom={() => log('到底了')}",
  ],
  note: "onUnmount 只在组件卸载时触发（换页时能在浏览器控制台看到）。视口事件按「可见比例」算，部分可见也会触发一次 enter。",
};

export default createFeedStage({
  count: 40,
  seed: 1901,
  instrument: true,
  plugins: () => [],
  coreProps: (api) => {
    const { log } = api;
    // 滚动与视口回调做本地节流：日志是给人看的，不是给机器记的
    let lastScroll = 0;
    let enterCount = 0;
    return {
      columns: 3,
      onMount: () => log("onMount · 容器挂载"),
      onBeforeLayout: () => {
        log("onBeforeLayout · 返回 false 会中断本次布局", "info");
        return true;
      },
      onLayout: () => log("onLayout · 开始算位置", "info"),
      onLayoutComplete: () => log("onLayoutComplete · 位置已写入，现在读 layout 是新的"),
      onItemMount: (i) => {
        if (i < 3) log(`onItemMount #${i}`, "info");
      },
      onItemUnmount: (i) => {
        if (i < 3) log(`onItemUnmount #${i}`, "info");
      },
      onItemEnterViewport: (i, v) => {
        enterCount += 1;
        if (enterCount < 40) log(`onItemEnterViewport #${i} 可见 ${(v.visibleRatio * 100) | 0}%`);
      },
      onItemLeaveViewport: (i) => {
        if (enterCount < 40) log(`onItemLeaveViewport #${i}`, "info");
      },
      onScroll: (top) => {
        const now = performance.now();
        if (now - lastScroll < 400) return;
        lastScroll = now;
        log(`onScroll ${Math.round(top)}`, "info");
      },
      onResize: (w, h) => log(`onResize ${w}×${h}`),
      onReachBottom: (d) => log(`onReachBottom 距底 ${Math.round(d)}px`),
      onItemClick: (i) => log(`onItemClick #${i}（点卡片试试）`),
    };
  },
  chrome: () => (
    <p className="stage-tip">
      滚动、点卡片、拖窗口宽度 —— 三种行为分别触发滚动、点击、尺寸三类事件
    </p>
  ),
});
