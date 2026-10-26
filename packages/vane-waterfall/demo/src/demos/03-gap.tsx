/**
 * 03 · 自定义间距
 *
 * `gap` 是简写，`rowGap` / `columnGap` 各自覆盖它。三个都留空就用默认 16。
 * 拖到 0 再拖回来看一眼：卡片贴边时光看列宽是看不出间距作用的。
 */
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "gap",
  title: "自定义间距",
  group: "basic",
  intro: "gap 是简写，rowGap / columnGap 分别覆盖它。",
  why: "图片流要更紧的列间距、更松的行间距，就得拆开写；只想整体松紧就用 gap。",
  plugs: [],
  props: [
    "columns={3}",
    "gap={{{gap}}}",
    "rowGap={{{rowGap}}}",
    "columnGap={{{columnGap}}}",
    "containerStyle={{ height: 420 }}",
  ],
  note: "间距参与布局计算：改 gap 会改变列宽与每列落点，不是 CSS margin。想让间距随窗口换档用 GapPlugin（下一页）。",
  controls: [
    { key: "gap", label: "gap（基准）", kind: "number", init: 8, min: 0, max: 32, hint: "被下面两个覆盖" },
    { key: "rowGap", label: "rowGap", kind: "number", init: 24, min: 0, max: 40 },
    { key: "columnGap", label: "columnGap", kind: "number", init: 8, min: 0, max: 40 },
  ],
};

export default createFeedStage({
  count: 30,
  seed: 1501,
  plugins: () => [],
  coreProps: (api) => ({
    columns: 3,
    gap: Number(api.cfg.gap),
    rowGap: Number(api.cfg.rowGap),
    columnGap: Number(api.cfg.columnGap),
  }),
});
