/**
 * 16 · Recycle 插件
 *
 * 离屏项设 `visibility: hidden`：DOM 还在、图片不用重新下载，只是不参与绘制。
 * 这是「几百项」场景最划算的一档 —— 比虚拟化省事，比不处理省电。
 */
import { createRecyclePlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "recycle",
  title: "Recycle 插件",
  group: "plugin",
  plugin: "RecyclePlugin",
  intro: "离屏项隐藏而不卸载 —— 图片不用重载，DOM 数量不变。",
  why: "几百项的长列表：卸载会丢图片缓存（滚回来又要下载），不处理又会一直重绘。Recycle 是中间那档。",
  plugs: [
    {
      fn: "createRecyclePlugin",
      cfg: "poolSize: {{poolSize}}",
      why: "视口外超出池子的项设 visibility:hidden，减少绘制但保留 DOM",
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}"],
  note: "与 virtualize 互斥：一个隐藏 DOM、一个卸载 DOM，同开会互相打架（可见项被另一套逻辑当成离屏）。",
  controls: [
    { key: "poolSize", label: "poolSize", kind: "number", init: 24, min: 4, max: 80, step: 2, nonLayout: true },
  ],
};

export default createFeedStage({
  count: 300,
  seed: 3201,
  instrument: true,
  plugins: (api) => [createRecyclePlugin({ poolSize: Number(api.cfg.poolSize) })],
  coreProps: () => ({ columns: 3, gap: 12 }),
  chrome: (api) => (
    <p className="stage-tip">
      {api.items.length} 项 · 渲染 <b>{api.meter.rendered}</b>（Recycle 不减少 DOM，只减少绘制）· 池子{" "}
      <b>{Number(api.cfg.poolSize)}</b>
    </p>
  ),
});
