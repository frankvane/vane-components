/**
 * 23 · Bookmark 插件
 *
 * 键盘位置书签：滚到某处按 `b` 记下，再滚走按 `r` 跳回来。记的是 scrollTop，存在 localStorage。
 * 输入框里按 b/r 不会触发 —— 插件自己判定了焦点。
 */
import { createBookmarkPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import { KeyHint } from "./panels";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "bookmark",
  title: "Bookmark 插件",
  group: "plugin",
  plugin: "BookmarkPlugin",
  intro: "滚到中间按 b，再滚别处按 r —— 回到刚才那一屏。",
  why: "长信息流里「刚才那条不错，等下回来看」，比让用户翻历史记录便宜得多。",
  plugs: [
    {
      fn: "createBookmarkPlugin",
      cfg: 'storageKey: "demo-bookmark", scrollBehavior: "smooth"',
      why: "键盘监听 + localStorage，页面不用为「记位置」写任何逻辑",
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}"],
  note: "记的是 scrollTop 绝对值，不是某一项：数据顺序变了书签就偏了。要「记住这条内容」请按 id 记（用 ScrollAnchor 那套）。",
};

export default createFeedStage({
  count: 60,
  seed: 3901,
  instrument: true,
  plugins: () => [createBookmarkPlugin({ storageKey: "demo-bookmark", scrollBehavior: "smooth" })],
  coreProps: () => ({ columns: 3, gap: 12 }),
  chrome: () => (
    <>
      <KeyHint
        items={[
          ["b", "记住当前位置"],
          ["r", "跳回书签位置"],
        ]}
      />
      <p className="stage-tip">先滚到中间，按 b；再滚到别处，按 r</p>
    </>
  ),
});
