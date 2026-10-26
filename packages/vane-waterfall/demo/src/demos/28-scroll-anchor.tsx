/**
 * 28 · ScrollAnchor 插件
 *
 * 插件只做一件事：监听 bus 上的 `anchor:scrollToId`，按 id 找到索引后 scrollToItem。
 * 页面拿不到 bus（ref 只透传 Core），所以这里补一个极小的桥接插件，把 DOM 事件转成 bus 事件
 * —— 这页同时演示「自己的插件怎么写」，注意 onMount 返回的函数就是清理函数。
 */
import { createScrollAnchorPlugin } from "vane-waterfall/custom-plugins";
import type { WaterfallPlugin } from "vane-waterfall";
import { createFeedStage } from "./stages/feed";
import type { DemoMeta } from "./types";
import type { SeedCard } from "../data/seed";

export const meta: DemoMeta = {
  slug: "scroll-anchor",
  title: "ScrollAnchor 插件",
  group: "plugin",
  plugin: "ScrollAnchorPlugin",
  intro: "点标签跳到对应那篇 —— 走 bus 事件，不是直接调 ref。",
  why: "目录、锚点导航、站内搜索定位：跳转逻辑应该在插件里，页面只负责「发一个 id 出去」。",
  plugs: [
    {
      fn: "createScrollAnchorPlugin",
      cfg: "getAnchorId: (item) => item.id",
      why: "按 id 反查索引并调 context.scrollToItem，落点由插件算",
    },
    {
      fn: "createAnchorBridgePlugin",
      why: "本页内联的自定义插件：window 上的 wf:anchor 事件 → bus.emit('anchor:scrollToId')",
      local: true,
    },
  ],
  props: ["columns={3}", "containerStyle={{ height: 420 }}"],
  note: "1.x 里这类插件会「自己造一个 bus 挂在 window 上」，其实是同一个问题的不同解法。桥接插件顺带示范了 onMount 返回清理函数 —— 旧版 withPlugins 从不执行它，监听会泄漏。",
};

/** 自定义插件：DOM 事件 → bus 事件 */
function createAnchorBridgePlugin<T = unknown>(): WaterfallPlugin<T> {
  return {
    name: "AnchorBridgePlugin",
    enabled: true,
    hooks: {
      onMount: (context) => {
        const handler = (event: Event) => {
          const id = (event as CustomEvent<{ id?: string }>).detail?.id;
          if (!id) return;
          context.bus.emit("anchor:scrollToId", { id });
        };
        window.addEventListener("wf:anchor", handler);
        return () => window.removeEventListener("wf:anchor", handler);
      },
    },
  };
}

export default createFeedStage({
  count: 30,
  seed: 4401,
  instrument: true,
  plugins: () => [
    createScrollAnchorPlugin<SeedCard>({ getAnchorId: (item) => item.id }),
    createAnchorBridgePlugin<SeedCard>(),
  ],
  coreProps: () => ({ columns: 3, gap: 12 }),
  chrome: (api) => (
    <div className="stage-anchors">
      <span>跳到第</span>
      {[0, 6, 12, 18, 24].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            const item = api.items[i];
            if (!item) return;
            window.dispatchEvent(new CustomEvent("wf:anchor", { detail: { id: item.id } }));
            api.log(`dispatch wf:anchor { id: "${item.id}" } → 插件转成 bus → scrollToItem(${i})`);
          }}
        >
          #{i} 项
        </button>
      ))}
      <span className="muted">（走 window 事件 → bus → 插件）</span>
    </div>
  ),
});
