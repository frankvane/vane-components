/**
 * 12 · 长文归档（锚点跳转 + URL 同步）
 *
 * 版式诉求：几百篇长文，右侧目录点标题直接跳到那篇；当前条件写进 URL，
 * 刷新/分享能复现同一屏。
 *
 * 这一卡演示**自己写插件**：ScrollAnchorPlugin 只监听 `anchor:scrollToId`，
 * 而页面侧拿不到 bus（ref 只透传 Core），所以补一个极小的桥接插件，
 * 把 DOM 自定义事件转成 bus 事件。也是 onMount 返回清理函数的标准写法。
 */
import React, { useRef, useState } from "react";
import {
  WaterfallCore,
  withPlugins,
  type WaterfallCoreRef,
  type WaterfallPlugin,
} from "vane-waterfall";
import {
  createA11yPlugin,
  createAutoColumnPlugin,
  createGapPlugin,
  createScrollAnchorPlugin,
  createTransitionPlugin,
  createURLSyncPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, timeAgo, type SeedCard } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "longform-archive",
  title: "长文归档 · 锚点跳转",
  group: "内容",
  ref: { label: "个人博客归档页", url: "https://overreacted.io/" },
  pain: "几百篇长文要按年归档，目录点击要精确跳转，还要能分享到某一屏",
  plugs: [
    { fn: "createScrollAnchorPlugin", cfg: "getAnchorId: (item) => item.id", why: "监听 bus 上的 anchor:scrollToId，按 id 找到索引后 scrollToItem" },
    { fn: "createAnchorBridgePlugin", why: "本卡内联的自定义插件：把 window 上的 DOM 事件转成 bus 事件（页面拿不到 bus）", local: true },
    { fn: "createURLSyncPlugin", cfg: 'mode: "hash", keys: ["searchQuery"]', why: "把查询条件写进 URL，刷新可复现" },
    { fn: "createAutoColumnPlugin", cfg: "minColumnWidth: 260, maxColumns: 3", why: "长文卡偏宽，2–3 列合适" },
    { fn: "createGapPlugin", cfg: "columnGap: 16, rowGap: 16", why: "长文卡之间要留白" },
    { fn: "createTransitionPlugin", cfg: "duration: 240", why: "跳转前后的位置过渡" },
    { fn: "createA11yPlugin", cfg: 'containerLabel: "长文归档"', why: "补语义" },
  ],
  props: [
    "ref={ref}",
    "containerStyle={{ height: 420 }}",
    "renderItem={(item) => <DocCard item={item} />}",
    "onScroll={syncActive}",
  ],
  note:
    "锚点跳转的实际落点由 ScrollAnchorPlugin 调 context.scrollToItem 完成；插件里拿得到 context，页面只拿得到 ref —— 这就是桥接的原因。",
};

const DATA: SeedCard[] = makeCards({ count: 30, seed: 12101, heightRange: [150, 240] });

/**
 * 自定义插件：window.addEventListener('wf:anchor', …) → bus.emit('anchor:scrollToId')
 * 要点：onMount 返回的函数就是清理函数（旧版 withPlugins 从不执行它，会漏监听）。
 */
function createAnchorBridgePlugin<T = any>(): WaterfallPlugin<T> {
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

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createScrollAnchorPlugin<SeedCard>({ getAnchorId: (item) => item.id }),
  createAnchorBridgePlugin<SeedCard>(),
  createURLSyncPlugin({ mode: "hash", keys: ["searchQuery"] }),
  createAutoColumnPlugin({ minColumnWidth: 260, maxColumns: 3 }),
  createGapPlugin({ columnGap: 16, rowGap: 16 }),
  createTransitionPlugin({ duration: 240 }),
  createA11yPlugin({ containerLabel: "长文归档", enableTabIndex: false }),
]);

function DocCard({ item, active }: { item: SeedCard; active?: boolean }) {
  return (
    <div className={`wf-card is-doc${active ? " is-active" : ""}`} style={{ height: item.height }}>
      <div className="wf-doc-top">
        <span className="wf-doc-tag">{item.tag}</span>
        <span className="wf-doc-time">{timeAgo(item.minutesAgo)}</span>
      </div>
      <p className="wf-doc-title">{item.title}</p>
      <p className="wf-doc-meta">{item.author} · 约 {Math.max(3, Math.round(item.height / 12))} 分钟读完</p>
    </div>
  );
}

export default function LongformArchiveScenario() {
  const ref = useRef<WaterfallCoreRef>(null);
  const [activeId, setActiveId] = useState(DATA[0].id);

  const toc = DATA.slice(0, 8);

  return (
    <div className="scn-widget">
      <div className="scn-toc">
        {toc.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeId === item.id ? "is-on" : ""}
            onClick={() => {
              setActiveId(item.id);
              window.dispatchEvent(new CustomEvent("wf:anchor", { detail: { id: item.id } }));
            }}
          >
            {item.title}
          </button>
        ))}
      </div>

      <Waterfall
        ref={ref}
        items={DATA}
        containerStyle={{ height: 372 }}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <DocCard item={item} active={item.id === activeId} />}
      />
    </div>
  );
}
