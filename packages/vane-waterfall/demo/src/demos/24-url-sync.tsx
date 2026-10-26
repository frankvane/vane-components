/**
 * 24 · URLSync 插件
 *
 * 把筛选条件写进 URL：复制地址发给同事，打开就是同一屏。
 * 这页用的是 `mode: "search"`（写 ?query=…），因为站点本身是 hash 路由 —— 两者不冲突。
 */
import { createURLSyncPlugin } from "vane-waterfall/custom-plugins";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "url-sync",
  title: "URLSync 插件",
  group: "plugin",
  plugin: "URLSyncPlugin",
  intro: "条件写进 URL，刷新 / 分享都能复现同一屏。",
  why: "带筛选的后台列表、搜索结果页：一旦用户按了 F5 或把链接发给别人，条件不该丢。",
  plugs: [
    {
      fn: "createURLSyncPlugin",
      cfg: 'mode: "search", keys: ["query"]',
      why: "把指定 props 键同步进 URL，并在挂载时回填",
    },
  ],
  props: ["searchQuery={query}", "columns={3}", "containerStyle={{ height: 420 }}"],
  note: 'hash 路由站点用 mode:"search"，否则会和 location.hash 打架。同步是双向的：URL 上有值会在首次挂载时回填到 props。',
};

export default createFeedStage({
  count: 24,
  seed: 4001,
  instrument: true,
  pluginKeys: [],
  plugins: () => [createURLSyncPlugin({ mode: "search", keys: ["query"] })],
  coreProps: (api) => ({
    columns: 3,
    gap: 12,
    // URLSync 只是「搬运」条件，真正的过滤要靠过滤/搜索插件；这里用标题包含匹配演示
    filterFn: (item: { title: string }) => {
      const q = String(api.cfg.query ?? "").trim();
      return q ? item.title.includes(q) : true;
    },
  }),
  chrome: (api) => (
    <div className="stage-search">
      <input
        type="search"
        placeholder="输入关键词，地址栏会跟着变"
        value={String(api.cfg.query ?? "")}
        onChange={(e) => api.setCfg("query", e.target.value)}
      />
      <code className="stage-url">{window.location.search || "（地址栏还没有参数）"}</code>
    </div>
  ),
});
