/**
 * 13 · 虚拟瀑布流（动态高度）
 *
 * 虚拟化最容易翻车的地方：项还没测量就先按估值占位，等真测出来再修正。
 * 这页挂了 900ms 后把所有项高度 ×1.5，模拟「图片加载完成」—— 看总高与滚动条的变化。
 *
 * 关掉 dynamicHeights 就能看到反例：项高度变了但不会自动重排（省了每项一个 ResizeObserver
 * 的开销，代价是数据变了要自己 relayout）。
 */
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "virtual-dynamic",
  title: "虚拟瀑布流（动态高度）",
  group: "plugin",
  capability: "virtualize · dynamicHeights",
  intro: "900ms 后所有卡片高度 ×1.5 —— 看虚拟化怎么把估值换成实测值。",
  why: "图片类瀑布流必然「先估后测」。要保证滚动条不跳、总高最终准确，就得理解 estimateHeight 与 dynamicHeights 各自管什么。",
  plugs: [],
  props: [
    "virtualize={{ overscan: 1, adaptiveEstimate: {{adaptive}}, dynamicHeights: {{{dynamicHeights}}} }}",
    {
      text: "  // adaptiveEstimate 关掉时才需要自己给 estimateHeight",
      when: (c) => !c.adaptive,
    },
    "columns={3}",
    "containerStyle={{ height: 420 }}",
  ],
  note: "dynamicHeights 关闭后，项高度变化不会触发重排 —— 需要自己调 ref.relayout()。虚拟化下项可能已卸载，measureItem 会返回缓存值而不是实时量。自适应估值（默认开）会跟着实测样本走，所以上面这一下 ×1.5 之后，未测量项的估值也会自动抬上去。",
  controls: [
    {
      key: "adaptive",
      label: "自适应估值",
      kind: "switch",
      init: true,
      hint: "关掉后严格用 estimateHeight 排未测量项",
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
    { key: "dynamicHeights", label: "dynamicHeights", kind: "switch", init: true, hint: "关掉后高度变化不自动重排" },
  ],
};

export default createFeedStage({
  count: 400,
  seed: 2901,
  instrument: true,
  plugins: () => [],
  coreProps: (api) => ({
    columns: 3,
    gap: 12,
    virtualize: {
      overscan: 1,
      adaptiveEstimate: Boolean(api.cfg.adaptive),
      estimateHeight: Number(api.cfg.estimateHeight),
      dynamicHeights: Boolean(api.cfg.dynamicHeights),
    },
  }),
  effect: (api) => {
    const timer = window.setTimeout(() => {
      api.setItems((prev) =>
        prev.map((c) => ({ ...c, height: Math.round((c.height * 1.5) / 8) * 8 }))
      );
      api.log("模拟图片加载完成：全部项高度 ×1.5，Core 重新测量并修正位置");
    }, 900);
    return () => window.clearTimeout(timer);
  },
  chrome: (api) => (
    <p className="stage-tip">
      {api.items.length} 项 · 渲染 <b>{api.meter.rendered}</b> · 总高{" "}
      <b>{Math.round(api.meter.totalHeight)}</b>px · 自适应{" "}
      <b>{api.cfg.adaptive ? "开" : "关"}</b> · dynamicHeights{" "}
      <b>{api.cfg.dynamicHeights ? "开" : "关"}</b>
    </p>
  ),
});
