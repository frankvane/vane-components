/**
 * 21 · Search 插件
 *
 * 输入框的值写进 `props.searchQuery`，插件在管线里做大小写不敏感的包含匹配。
 *
 * 这里把 searchQuery 从「重建组件的 key」里排除了 —— 否则每敲一个字整块瀑布流都会重挂载，
 * 输入框失焦、滚动归零。这是示例页很容易做错的地方，也是真实项目里最常见的性能坑。
 */
import { createSearchPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "search",
  title: "Search 插件",
  group: "plugin",
  plugin: "SearchPlugin",
  intro: "边打字边过滤，输入框不失焦、滚动不乱跳。",
  why: "字段有限的本地搜索（标题、作者、标签）用插件就够；需要模糊匹配、拼音、分词时应该后端做。",
  plugs: [
    {
      fn: "createSearchPlugin",
      cfg: 'fields: ["title", "author"]',
      why: "只扫指定字段，避免把 undefined 也扫一遍（priority 20，在排序之后、分页之前）",
    },
  ],
  props: ["searchQuery={query}", "columns={3}", "containerStyle={{ height: 420 }}"],
  note: "fields 不给会扫全部可枚举字段，容易误命中。scrollToTop 默认关，搜索后保留滚动位置反而更自然时别打开。",
};

export default createFeedStage({
  count: 36,
  seed: 3701,
  instrument: true,
  pluginKeys: [],
  plugins: () => [createSearchPlugin({ fields: ["title", "author"] })],
  coreProps: (api) => ({
    columns: 3,
    gap: 12,
    searchQuery: String(api.cfg.query ?? ""),
    scrollToTopOnSearchChange: false,
  }),
  chrome: (api) => {
    const q = String(api.cfg.query ?? "").trim().toLowerCase();
    // 与插件同款匹配规则（fields: title + author，大小写不敏感），只为把命中数显示出来
    const hit = q
      ? api.items.filter(
          (i) => i.title.toLowerCase().includes(q) || i.author.toLowerCase().includes(q)
        ).length
      : api.items.length;
    return (
      <div className="stage-search">
        <input
          type="search"
          placeholder="搜标题或作者，如「咖啡」「林一白」"
          value={String(api.cfg.query ?? "")}
          onChange={(e) => api.setCfg("query", e.target.value)}
        />
        <span>
          命中 <b>{hit}</b> / {api.items.length} 项{q ? `（query="${q}"）` : ""}
        </span>
      </div>
    );
  },
});
