/**
 * 15 · DebounceLayout 插件
 *
 * 只做一件事：把「重排」的防抖拉长。拖下面的宽度滑杆 —— 每一帧宽度都在变，
 * 但只有停下来之后才真正重排一次。看「最近布局」耗时的变化频率。
 *
 * 真实场景：可拖拽分栏、可展开的侧边栏、响应式预览缩放。
 */
import { createDebounceLayoutPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "debounce-layout",
  title: "DebounceLayout 插件",
  group: "plugin",
  plugin: "DebounceLayoutPlugin",
  intro: "连续拖宽度时只在停下后重排一次。",
  why: "容器尺寸会被连续改变的场景（拖拽分栏、展开收起、缩放预览）不做防抖，每帧都会全量重排。",
  plugs: [
    {
      fn: "createDebounceLayoutPlugin",
      cfg: "delay: {{delay}}",
      why: "把 debounceDelay 拉长到 300ms，连续 resize 只算最后一次",
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}"],
  note: "防抖太大会有「松手后卡片才归位」的观感，200–300ms 是比较稳的区间。和 ThrottlePlugin 分工不同：那个管回调、这个管重排。",
  controls: [
    { key: "delay", label: "delay（ms）", kind: "number", init: 300, min: 0, max: 600, step: 20 },
    { key: "simWidth", label: "容器宽", kind: "number", init: 780, min: 380, max: 1080, step: 10 },
  ],
};

export default createFeedStage({
  count: 36,
  seed: 3101,
  instrument: true,
  plugins: (api) => [createDebounceLayoutPlugin({ delay: Number(api.cfg.delay) })],
  coreProps: (api) => ({
    columns: 3,
    gap: 12,
    containerStyle: { height: "var(--stage-h, 380px)", width: Number(api.cfg.simWidth) },
  }),
  chrome: (api) => (
    <p className="stage-tip">
      防抖 <b>{Number(api.cfg.delay)}</b>ms · 最近布局{" "}
      <b>{api.meter.layoutMs.toFixed(1)}</b>ms · 拖滑杆时观察它多久变一次
    </p>
  ),
});
