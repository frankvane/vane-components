/**
 * 02 · 自定义列数
 *
 * 固定列数靠 `props.columns`，列宽由 Core 反算：`(容器宽 − gap×(n−1)) / n`。
 * 舞台上直接把当前列宽读出来，比任何文字解释都直观。
 */
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "columns",
  title: "自定义列数",
  group: "basic",
  intro: "写死列数，列宽自己算 —— 拖到 6 列看列宽怎么缩。",
  why: "后台表格、看板、固定版式的商品墙通常就是固定列数，不需要按容器自适应。",
  plugs: [],
  props: ["columns={{{columns}}}", "gap={{{gap}}}", "containerStyle={{ height: 420 }}"],
  note: "写了 columns 又被 AutoColumnPlugin / ResponsiveColumnsPlugin 覆盖是常见困惑：那两个插件在 calculateColumns 钩子里返回列数，优先级高于 props。",
  controls: [
    { key: "columns", label: "列数", kind: "number", init: 4, min: 1, max: 6 },
    { key: "gap", label: "间距", kind: "number", init: 12, min: 0, max: 32 },
  ],
};

export default createFeedStage({
  count: 36,
  seed: 1401,
  plugins: () => [],
  instrument: true,
  coreProps: (api) => ({
    columns: Number(api.cfg.columns),
    gap: Number(api.cfg.gap),
  }),
  chrome: (api) => (
    <p className="stage-tip">
      列宽 = (容器宽 − 间距×{Number(api.cfg.columns) - 1}) ÷ {Number(api.cfg.columns)} ·
      当前 <b>{api.meter.columns}</b> 列 / 总高 <b>{Math.round(api.meter.totalHeight)}</b>px
    </p>
  ),
});
