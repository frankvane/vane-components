/**
 * 06 · 高级配置
 *
 * 那些「文档里有、但不常用」的 props 放一页演示：padding / useTransform / alignmentMode /
 * throttleDelay / debounceDelay / debug。
 *
 * 其中 useTransform 最值得亲手切一次：关掉后改用 top/left 定位，
 * 肉眼几乎没差别，但块级重排的开销和「能不能直接读 offsetLeft」完全不同。
 */
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "advanced",
  title: "高级配置",
  group: "advanced",
  intro: "padding、useTransform、alignmentMode、节流防抖、debug —— 一页调完。",
  why: "嵌在带内边距的容器里（padding 要参与布局，不能靠外层 margin）、要给每一项套自定义样式（itemClassName）、或怀疑布局算错要看耗时（debug）时用。",
  plugs: [],
  props: [
    "columns={3}",
    "padding={{{padding}}}",
    "alignmentMode=\"{{{mode}}}\"",
    "useTransform={{{useTransform}}}",
    "throttleDelay={{{throttle}}}",
    "debounceDelay={{{debounce}}}",
    "debug={{{debug}}}",
    "containerStyle={{ height: 420 }}",
  ],
  note: "padding 是参与布局计算的（可用宽度 = 容器宽 − 左右 padding），所以它不能当成外层 margin 用。useTransform=false 时项改用 top/left 定位，打印和读 offsetLeft 更直观。",
  controls: [
    { key: "padding", label: "padding", kind: "number", init: 12, min: 0, max: 40 },
    {
      key: "mode",
      label: "alignmentMode",
      kind: "select",
      init: "shortest",
      options: [
        { label: "shortest 最矮列", value: "shortest" },
        { label: "balanced 最少项", value: "balanced" },
        { label: "sequential 轮转", value: "sequential" },
      ],
      hint: "balanced 列高会不齐，但每列张数接近",
    },
    { key: "useTransform", label: "useTransform", kind: "switch", init: true },
    { key: "throttle", label: "throttleDelay", kind: "number", init: 16, min: 0, max: 120, step: 8, nonLayout: true },
    { key: "debounce", label: "debounceDelay", kind: "number", init: 150, min: 0, max: 600, step: 10, nonLayout: true },
    { key: "debug", label: "debug", kind: "switch", init: false, hint: "控制台打印布局耗时" },
  ],
};

export default createFeedStage({
  count: 34,
  seed: 2101,
  plugins: () => [],
  instrument: true,
  coreProps: (api) => ({
    columns: 3,
    padding: Number(api.cfg.padding),
    alignmentMode: String(api.cfg.mode) as "shortest" | "balanced" | "sequential",
    useTransform: Boolean(api.cfg.useTransform),
    throttleDelay: Number(api.cfg.throttle),
    debounceDelay: Number(api.cfg.debounce),
    debug: Boolean(api.cfg.debug),
  }),
  chrome: (api) => (
    <p className="stage-tip">
      定位方式：<b>{api.cfg.useTransform ? "transform" : "top / left"}</b> · 内边距{" "}
      <b>{Number(api.cfg.padding)}</b> · 列数 <b>{api.meter.columns}</b> · 总高{" "}
      <b>{Math.round(api.meter.totalHeight)}</b>px
    </p>
  ),
});
