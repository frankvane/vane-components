/**
 * 27 · StickyHeader 插件
 *
 * 读 GROUPS 的首组名，渲染一条 `position: sticky` 的标题条 —— 它渲染在滚动容器**内部**
 * （renderOverlay），所以吸顶是相对瀑布流自己，不是相对页面。
 *
 * 实验版：只显示首组，不随滚动切换。要「跟随当前可见组」得订阅 grouping:change + visibleRange 自己写。
 */
import { createGroupingPlugin, createStickyHeaderPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";
import type { SeedCard } from "../data/seed";

export const meta: DemoMeta = {
  slug: "sticky-header",
  title: "StickyHeader 插件",
  group: "plugin",
  plugin: "StickyHeaderPlugin",
  intro: "滚动时顶部浮着当前分组标题。",
  why: "分类壁纸墙、按频道分的视频列表：滚着滚着忘了自己在哪个分类里。",
  plugs: [
    {
      fn: "createStickyHeaderPlugin",
      cfg: 'title: "当前分组", showHint: true',
      why: "在滚动容器内渲染 sticky 标题条，靠 renderOverlay 而不是改版式",
    },
    {
      fn: "createGroupingPlugin",
      cfg: "groupBy: (item) => item.tag",
      why: "标题条要读 GROUPS 的首组名，没有分组插件它只能显示兜底文案",
    },
  ],
  props: ["columns={4}", "containerStyle={{ height: 420 }}"],
  note: "只跟首组。真要做「跟随当前组」，插件需要订阅 grouping:change，并在 onScroll 里用 visibleRange 反查当前组 —— 这一页故意不藏这个限制。",
};

export default createFeedStage({
  count: 40,
  seed: 4301,
  instrument: true,
  plugins: () => [
    createStickyHeaderPlugin({ title: "当前分组", showHint: true }),
    createGroupingPlugin<SeedCard>({ groupBy: (item) => item.tag }),
  ],
  coreProps: () => ({ columns: 4, gap: 10 }),
  chrome: () => <p className="stage-tip">向下滚：标题条会贴在瀑布流容器顶部</p>,
});
