/**
 * 26 · Grouping 插件
 *
 * 按 tag 分组，结果写进 `sharedData.get("GROUPS")` 并广播 `grouping:change`。
 * 打开 showOverlay 能直接看到分组结果 —— 否则这插件「只有别的插件看得见」。
 *
 * 1.x 的坑：只在 onPropsChange 里算，首屏永远是空的。这里挂载即算 + 布局完成后重算。
 */
import { createGroupingPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";
import type { SeedCard } from "../data/seed";

export const meta: DemoMeta = {
  slug: "grouping",
  title: "Grouping 插件",
  group: "plugin",
  plugin: "GroupingPlugin",
  intro: "按标签分组，右下角浮层列出每组项数。",
  why: "壁纸墙、书签墙要「按分类看」，或要配合吸顶标题（下一页）—— 分组结果本身不是视觉，是给别的插件用的数据。",
  plugs: [
    {
      fn: "createGroupingPlugin",
      cfg: "groupBy: (item) => item.tag, showOverlay: true",
      why: "把 GROUPS（Map<组键, 索引数组>）写进 sharedData，供吸顶标题等插件消费",
    },
  ],
  props: ["columns={4}", "containerStyle={{ height: 420 }}"],
  note: "分组只算索引，不改变排列顺序 —— 想「同组连在一起」得自己按组重排数据再传进来（或用 SortPlugin）。",
  controls: [{ key: "overlay", label: "显示分组浮层", kind: "switch", init: true }],
};

export default createFeedStage({
  count: 32,
  seed: 4201,
  instrument: true,
  plugins: (api) => [
    createGroupingPlugin<SeedCard>({ groupBy: (item) => item.tag, showOverlay: Boolean(api.cfg.overlay) }),
  ],
  coreProps: () => ({ columns: 4, gap: 10 }),
  chrome: (api) => {
    const counts = new Map<string, number>();
    api.items.forEach((i) => counts.set(i.tag, (counts.get(i.tag) ?? 0) + 1));
    return (
      <p className="stage-tip">
        {counts.size} 组：
        {[...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k} ${v}`)
          .join(" · ")}
      </p>
    );
  },
});
