/**
 * 03 · 自定义间距
 *
 * `gap` 是简写，`rowGap` / `columnGap` 各自覆盖它。
 * 这一页把「覆盖」做成可操作的一步：关掉「拆开行/列间距」，gap 立刻接管；
 * 打开后 gap 就废了 —— 同时在的 rowGap / columnGap 说了算。下面的装配代码也跟着换行。
 */
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "gap",
  title: "自定义间距",
  group: "basic",
  intro: "gap 是简写，rowGap / columnGap 分别覆盖它 —— 用开关切一次就记住了。",
  why: "图片流要更紧的列间距、更松的行间距，就得拆开写；只想整体松紧就用 gap。",
  plugs: [],
  props: [
    "columns={3}",
    { text: "gap={{{gap}}}", when: (c) => !c.split },
    { text: "rowGap={{{rowGap}}}", when: (c) => Boolean(c.split) },
    { text: "columnGap={{{columnGap}}}", when: (c) => Boolean(c.split) },
    "containerStyle={{ height: 420 }}",
  ],
  note: "间距参与布局计算：改 gap 会改变列宽与每列落点，不是 CSS margin。三个同时给的时候 gap 只是「没被覆盖的那部分」的兜底。想让间距随窗口换档用 GapPlugin（下一页）。",
  controls: [
    { key: "split", label: "拆开行/列间距", kind: "switch", init: true, hint: "关掉 → 只留 gap，它立刻生效" },
    { key: "gap", label: "gap（简写）", kind: "number", init: 8, min: 0, max: 32, when: (c) => !c.split },
    { key: "rowGap", label: "rowGap", kind: "number", init: 24, min: 0, max: 40, when: (c) => Boolean(c.split) },
    { key: "columnGap", label: "columnGap", kind: "number", init: 8, min: 0, max: 40, when: (c) => Boolean(c.split) },
  ],
};

export default createFeedStage({
  count: 30,
  seed: 1501,
  plugins: () => [],
  coreProps: (api) => ({
    columns: 3,
    ...(api.cfg.split
      ? { rowGap: Number(api.cfg.rowGap), columnGap: Number(api.cfg.columnGap) }
      : { gap: Number(api.cfg.gap) }),
  }),
  chrome: (api) => (
    <p className="stage-tip">
      {api.cfg.split ? (
        <>
          rowGap <b>{Number(api.cfg.rowGap)}</b> · columnGap <b>{Number(api.cfg.columnGap)}</b> ——
          <b> gap 被覆盖，此刻是空转的</b>
        </>
      ) : (
        <>
          gap <b>{Number(api.cfg.gap)}</b> —— 行列同值，因为没给 rowGap / columnGap
        </>
      )}
    </p>
  ),
});
