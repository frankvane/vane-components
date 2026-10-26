/**
 * 12 · 虚拟瀑布流
 *
 * 1000 项，只渲染视口附近。关键读数在下面：数据项 1000，实际渲染通常只有几十。
 *
 * 注意它「只裁渲染不裁测量」：总高与滚动位置仍按全量算，所以滚动条长度是对的，
 * 自定义插件读 itemPositions 也不会因为虚拟化缺项。
 *
 * 页面的重点其实是「未测量项该估多高」——这是虚拟化唯一没法算准的地方：
 * 估低了，同一列后面的项会压上来（滚动时的重叠）；估高了，滚动条虚长。
 * 所以把 `adaptiveEstimate`（跟实测样本走）和分位做成了控件，可以直接对比。
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
    {
      text: "virtualize={{ overscan: {{overscan}}, adaptiveEstimate: true, estimateQuantile: {{estimateQuantile}} }}",
      when: (c) => Boolean(c.adaptive),
    },
    {
      text: "virtualize={{ overscan: {{overscan}}, adaptiveEstimate: false, estimateHeight: {{estimateHeight}} }}",
      when: (c) => !c.adaptive,
    },
    "columns={3}",
    "containerStyle={{ height: 420 }}",
  ],
  note: "estimateHeight 只是「冷启动还没有任何实测样本」时的兜底。样本够 8 个之后，自适应改用实测高度的中位数（P50）——中位数让总高误差最小。注意重叠不靠「把估值抬高」解决：抬高只是把误差从「重叠」换成「滚动条虚长」，而后者更持久。真正压住重叠的是「量到真高就立刻重排」——误差只存在一帧，且通常落在视口外。关掉自适应则严格用 estimateHeight，可以自己体会「240 面对 190~350 的项高」会怎样。",
  controls: [
    { key: "overscan", label: "overscan（屏）", kind: "number", init: 1, min: 0, max: 4 },
    {
      key: "adaptive",
      label: "自适应估值",
      kind: "switch",
      init: true,
      hint: "关掉后严格用 estimateHeight 排未测量项",
    },
    {
      key: "estimateQuantile",
      label: "分位",
      kind: "select",
      init: "0.5",
      options: [
        { label: "P50 中位数（默认，总高最准）", value: "0.5" },
        { label: "P75", value: "0.75" },
        { label: "P90（更保守，宁可留空）", value: "0.9" },
        { label: "P100（绝不重叠）", value: "1" },
      ],
      when: (c) => Boolean(c.adaptive),
    },
    {
      key: "estimateHeight",
      label: "estimateHeight",
      kind: "number",
      init: 240,
      min: 120,
      max: 360,
      step: 20,
      when: (c) => !c.adaptive,
    },
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
      adaptiveEstimate: Boolean(api.cfg.adaptive),
      estimateQuantile: Number(api.cfg.estimateQuantile ?? 0.5),
      estimateHeight: Number(api.cfg.estimateHeight),
    },
  }),
  chrome: (api) => (
    <p className="stage-tip">
      {api.items.length} 项数据 → 实际渲染 <b>{api.meter.rendered}</b> 个 · 总高{" "}
      <b>{Math.round(api.meter.totalHeight)}</b>px（按全量算，滚动中会随实测样本收敛）
    </p>
  ),
});
