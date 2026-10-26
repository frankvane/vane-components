/**
 * 07 · 响应式列数插件
 *
 * 断点表决定列数：命中哪档用哪档，与容器宽有关、与 window 无关。
 * 拖「模拟容器宽」看列数跳档 —— 这就是嵌在侧栏里也能算对的原因。
 */
import { createResponsiveColumnsPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

const BREAKPOINTS = {
  sm: { width: 0, columns: 2 },
  md: { width: 560, columns: 3 },
  lg: { width: 800, columns: 4 },
};

export const meta: DemoMeta = {
  slug: "responsive-columns",
  title: "响应式列数",
  group: "plugin",
  plugin: "ResponsiveColumnsPlugin",
  intro: "按断点表切列数：< 560 两列，560 起三列，800 起四列。",
  why: "设计稿给了明确的「平板 3 列 / 桌面 4 列」规范时用断点表；只想要「每列至少多宽」就用 AutoColumn（下一页）。",
  plugs: [
    {
      fn: "createResponsiveColumnsPlugin",
      cfg: "breakpoints: { sm: { width: 0, columns: 2 }, md: { width: 560, columns: 3 }, lg: { width: 800, columns: 4 } }",
      why: "按容器宽度命中最近一档，读的是容器宽不是 window.innerWidth",
    },
  ],
  props: ["columns={2}", "gap={12}", "containerStyle={{ height: 420 }}"],
  note: "与 AutoColumnPlugin 互斥：两个都实现 calculateColumns，同开会交替覆盖，列数看起来会「闪」。",
  controls: [
    { key: "simWidth", label: "模拟容器宽", kind: "number", init: 760, min: 360, max: 1100, step: 20 },
  ],
};

export default createFeedStage({
  count: 28,
  seed: 2301,
  plugins: () => [createResponsiveColumnsPlugin({ breakpoints: BREAKPOINTS })],
  instrument: true,
  coreProps: (api) => ({
    gap: 12,
    containerStyle: { height: "var(--stage-h, 380px)", width: Number(api.cfg.simWidth) },
  }),
  chrome: (api) => {
    const w = Number(api.cfg.simWidth);
    const hit = w >= 800 ? "lg → 4 列" : w >= 560 ? "md → 3 列" : "sm → 2 列";
    return (
      <p className="stage-tip">
        容器宽 <b>{w}</b> · 命中 <b>{hit}</b> · 实际 <b>{api.meter.columns}</b> 列
      </p>
    );
  },
});
