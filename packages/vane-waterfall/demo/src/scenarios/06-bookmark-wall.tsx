/**
 * 06 · 书签墙（可拖拽排序 + 位置书签）
 *
 * 版式诉求：卡片可以手动拖到任意位置，拖完顺序要回到业务数据；
 * 浏览到一半按 b 记位置、按 r 跳回来。
 *
 * 这个场景的装配放在**组件内**（useMemo）而不是模块顶层：`onReorder` 要改
 * 组件 state，模块顶层的闭包拿不到 setItems。这也是判断「装配放哪」的准则：
 * 钩子需要读组件闭包 → 放进 useMemo；纯配置 → 模块顶层即可（省一次注册）。
 */
import React, { useMemo, useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import {
  createA11yPlugin,
  createBookmarkPlugin,
  createDragReorderPlugin,
  createGapPlugin,
  createResponsiveColumnsPlugin,
  createTransitionPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "bookmark-wall",
  title: "书签墙 · 拖拽排序",
  group: "效率",
  ref: { label: "Raindrop.io 收藏墙", url: "https://raindrop.io/" },
  pain: "收藏顺序要能手动调整，且调整结果必须回到业务数据，不能只停在视图层",
  plugs: [
    { fn: "createDragReorderPlugin", cfg: "showHandle: true, onReorder: handleReorder", why: "HTML5 拖拽；插件只算出 from/to，数组怎么改由页面决定" },
    { fn: "createBookmarkPlugin", cfg: 'storageKey: "demo-wall-bookmark", scrollBehavior: "smooth"', why: "按 b 记忆滚动位置、按 r 平滑跳回" },
    { fn: "createA11yPlugin", cfg: 'itemRole: "listitem"', why: "拖拽容器要保留列表语义，否则读屏软件拿不到结构" },
    { fn: "createResponsiveColumnsPlugin", cfg: "breakpoints: { sm: { width: 0, columns: 2 }, md: { width: 760, columns: 3 } }", why: "书签卡偏小，两列起步" },
    { fn: "createGapPlugin", cfg: "columnGap: 12, rowGap: 12", why: "统一间距" },
    { fn: "createTransitionPlugin", cfg: "duration: 200", why: "拖完重排的位置过渡" },
  ],
  props: [
    "containerStyle={{ height: 392 }}",
    "renderItem={(item) => <Card item={item} />}",
    "onItemClick={(i, item) => open(item)}",
  ],
  note:
    "旧版 DragReorderPlugin 只把 from/to 写进 sharedData，没有 onReorder 回调；且它与 A11yPlugin 的 renderItemWrapper 参数顺序相反，两个一起开会把节点与索引错位。",
};

const INITIAL = makeCards({ count: 18, seed: 6601, heightRange: [120, 200] });

const HANDLE = (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden>
    <circle cx="5" cy="3" r="1.3" />
    <circle cx="11" cy="3" r="1.3" />
    <circle cx="5" cy="8" r="1.3" />
    <circle cx="11" cy="8" r="1.3" />
    <circle cx="5" cy="13" r="1.3" />
    <circle cx="11" cy="13" r="1.3" />
  </svg>
);

export default function BookmarkWallScenario() {
  const [items, setItems] = useState(INITIAL);
  const [lastOp, setLastOp] = useState("拖动右上角手柄换位置；按 b 存书签、按 r 跳回");

  const Waterfall = useMemo(() => {
    const handleReorder = (from: number, to: number) => {
      setItems((prev) => {
        if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
          return prev;
        }
        const next = prev.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      setLastOp(`第 ${from + 1} 张 → 第 ${to + 1} 张（已写回 state）`);
    };

    return withPlugins<SeedCard>(WaterfallCore, [
      createDragReorderPlugin<SeedCard>({ showHandle: true, onReorder: handleReorder }),
      createBookmarkPlugin({ storageKey: "demo-wall-bookmark", scrollBehavior: "smooth" }),
      createA11yPlugin({
        itemRole: "listitem",
        containerLabel: "我的收藏",
        enableTabIndex: false,
      }),
      createResponsiveColumnsPlugin({
        breakpoints: {
          sm: { width: 0, columns: 2 },
          md: { width: 760, columns: 3 },
        },
      }),
      createGapPlugin({ columnGap: 12, rowGap: 12 }),
      createTransitionPlugin({ duration: 200 }),
    ]);
  }, []);

  return (
    <div className="scn-widget">
      <Waterfall
        items={items}
        containerStyle={{ height: 392 }}
        keyExtractor={(item) => item.id}
        renderItem={(item) => (
          <FeedCard
            card={item}
            variant="plain"
            corner={
              <span className="wf-drag-handle" title="拖拽排序">
                {HANDLE}
              </span>
            }
          />
        )}
      />
      <p className="scn-hint">{lastOp}</p>
    </div>
  );
}
