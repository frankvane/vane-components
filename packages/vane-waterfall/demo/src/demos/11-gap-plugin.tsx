/**
 * 11 · 间距插件
 *
 * 和 03（Core 的 gap props）的区别：插件带 `responsive`，能按窗口宽度自动换档。
 * 把浏览器窗口拉窄，间距会变成 sm 档的 8px —— props 做不到这件事。
 */
import { createGapPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "gap-plugin",
  title: "间距插件",
  group: "plugin",
  plugin: "GapPlugin",
  intro: "把行/列间距收到一处，还能按窗口宽度换档。",
  why: "多个页面要统一间距规范（或手机端要更紧）时，用插件的 responsive 比在每个页面写 CSS 断点稳。",
  plugs: [
    {
      fn: "createGapPlugin",
      cfg: "columnGap: {{columnGap}}, rowGap: {{rowGap}}, responsive: { sm: { columnGap: 8, rowGap: 8 } }",
      why: "间距集中配置，并按 sm/md/lg/xl 自动换档（阈值 768/992/1200）",
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}"],
  note: "responsive 是「命中即覆盖」：桌面端如果也配了 lg，上面两个滑杆就会被 lg 顶掉（看着像没接上）。这页只给 sm，所以桌面端用手写值、窄于 768px 才切 8px。档位看的是 window 宽度，不是容器宽。",
  controls: [
    { key: "columnGap", label: "columnGap", kind: "number", init: 16, min: 0, max: 40 },
    { key: "rowGap", label: "rowGap", kind: "number", init: 16, min: 0, max: 40 },
  ],
};

export default createFeedStage({
  count: 26,
  seed: 2701,
  instrument: true,
  plugins: (api) => [
    createGapPlugin({
      columnGap: Number(api.cfg.columnGap),
      rowGap: Number(api.cfg.rowGap),
      // 只配 sm：桌面端要能拖滑杆看到手写值生效；断点一旦配了同档位就会顶掉手写值
      responsive: {
        sm: { columnGap: 8, rowGap: 8 },
      },
    }),
  ],
  coreProps: () => ({ columns: 3 }),
  chrome: (api) => (
    <p className="stage-tip">
      配置 <b>{Number(api.cfg.columnGap)}</b> / <b>{Number(api.cfg.rowGap)}</b> · 把窗口拉窄会切到 sm 档（8px）
    </p>
  ),
});
