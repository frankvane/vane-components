/**
 * 12 · 虚拟瀑布流
 *
 * 1000 项，只渲染视口附近。关键读数在下面：数据项 1000，实际渲染通常只有几十。
 *
 * 注意它「只裁渲染不裁测量」：总高与滚动位置仍按全量算，所以滚动条长度是对的，
 * 自定义插件读 itemPositions 也不会因为虚拟化缺项。
 */
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "virtual",
  title: "虚拟瀑布流",
  group: "plugin",
  capability: "virtualize",
  intro: "1000 项只渲染几十个 DOM —— 看「数据项 / 实际渲染」两个读数。",
  why: "上千项、项高可估（图片卡、商品卡）时开。几百项以内不必上虚拟化，Recycle 更省事（不卸载、图片不用重载）。",
  plugs: [],
  props: [
    "items={thousandItems}",
    "virtualize={{ overscan: {{overscan}}, estimateHeight: {{estimateHeight}} }}",
    "columns={3}",
    "containerStyle={{ height: 420 }}",
  ],
  note: "estimateHeight 是「还没测量到的项」的占位高度：估高了滚动条偏长、估低了会往下跳。真实项目里取图卡的常见高度即可，反正测完会自动修正。",
  controls: [
    { key: "overscan", label: "overscan（屏）", kind: "number", init: 1, min: 0, max: 4 },
    { key: "estimateHeight", label: "estimateHeight", kind: "number", init: 240, min: 120, max: 360, step: 20 },
  ],
};

export default createFeedStage({
  count: 1000,
  seed: 2801,
  instrument: true,
  plugins: () => [],
  coreProps: (api) => ({
    columns: 3,
    gap: 12,
    virtualize: {
      overscan: Number(api.cfg.overscan),
      estimateHeight: Number(api.cfg.estimateHeight),
    },
  }),
  chrome: (api) => (
    <p className="stage-tip">
      {api.items.length} 项数据 → 实际渲染 <b>{api.meter.rendered}</b> 个 · 总高{" "}
      <b>{Math.round(api.meter.totalHeight)}</b>px（按全量算的）
    </p>
  ),
});
