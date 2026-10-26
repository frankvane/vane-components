/**
 * 29 · DragReorder 插件
 *
 * HTML5 原生拖拽：松手时把 from/to 交给页面，**数组怎么改由页面决定**，插件不碰数据。
 *
 * 装配要点：onReorder 要改组件 state，所以 withPlugins 必须在 useMemo 里（不能放模块顶层）——
 * 这里的 createFeedStage 内部就是 useMemo，等价写法。
 */
import { createDragReorderPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";
import type { SeedCard } from "../data/seed";

function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [picked] = next.splice(from, 1);
  next.splice(to, 0, picked);
  return next;
}

export const meta: DemoMeta = {
  slug: "drag-reorder",
  title: "DragReorder 插件",
  group: "plugin",
  plugin: "DragReorderPlugin",
  intro: "拖一张卡到别的位置，松手后数组真的变了。",
  why: "书签墙、看板、排序自定义：用户直接拖比「上移/下移」按钮直观得多。",
  plugs: [
    {
      fn: "createDragReorderPlugin",
      cfg: "showHandle: true, onReorder: (from, to) => setItems((prev) => move(prev, from, to))",
      why: "包一层 draggable + 手柄，把起止索引交回来；数据变更完全由页面掌控",
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}"],
  note: "showHandle 只是「虚线手柄」，接真实版式时关掉。插件不写 localStorage 也不调接口 —— 落库要自己在 onReorder 里做。",
};

export default createFeedStage({
  count: 18,
  seed: 4501,
  instrument: true,
  plugins: (api) => [
    createDragReorderPlugin<SeedCard>({
      showHandle: true,
      onReorder: (from, to, item) => {
        api.setItems((prev) => move(prev, from, to));
        api.log(`拖拽 #${from} → #${to}（${item?.title ?? "未知项"}），数组已重排`);
      },
    }),
  ],
  coreProps: () => ({ columns: 3, gap: 12 }),
  chrome: () => <p className="stage-tip">拖卡片右上角的手柄，松手后看位置与顺序变化</p>,
});
