/**
 * 09 · 分组壁纸墙
 *
 * 版式诉求：内容按标签分组，顶部吸顶显示当前组，侧边能直接跳到某一组。
 *
 * 分工要说清楚：GroupingPlugin 只把「组键 → 索引数组」写进
 * `sharedData.get("GROUPS")`，它不负责画分组头 —— 画头是 StickyHeaderPlugin
 * 的事（读同一份 sharedData）。页面自己的跳转芯片是最简单的一层 UI。
 */
import React, { useMemo, useRef, useState } from "react";
import { WaterfallCore, withPlugins, type WaterfallCoreRef } from "vane-waterfall";
import {
  createAutoColumnPlugin,
  createGapPlugin,
  createGroupingPlugin,
  createStickyHeaderPlugin,
} from "vane-waterfall/custom-plugins";
import { makeCards, type SeedCard } from "../data/seed";
import { Thumb } from "../components/Thumb";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "grouped-wall",
  title: "分组壁纸墙",
  group: "图片社区",
  ref: { label: "Wallhaven 标签页", url: "https://wallhaven.cc/toplist" },
  pain: "内容按标签分组，既要吸顶提示当前组，又要能一键跳到某组",
  plugs: [
    { fn: "createGroupingPlugin", cfg: "groupBy: (item) => item.tag", why: "把组键 → 索引数组写进 sharedData，挂载即算（旧版只在 props 变化时算，首屏永远是空的）" },
    { fn: "createStickyHeaderPlugin", cfg: 'title: "壁纸 · 当前分组"', why: "读 sharedData 里的第一个组名渲染吸顶条（实验版，只取首组）" },
    { fn: "createAutoColumnPlugin", cfg: "minColumnWidth: 132, maxColumns: 6", why: "壁纸卡窄，窄列能排更多" },
    { fn: "createGapPlugin", cfg: "columnGap: 10, rowGap: 10", why: "壁纸墙用更紧的间距" },
  ],
  props: [
    "ref={ref}",
    "containerStyle={{ height: 420 }}",
    "renderItem={(item) => <Wallpaper item={item} />}",
  ],
  note:
    "页面侧拿不到 bus（ref 只透传 Core），所以跳转芯片直接用 ref.scrollToItem；插件之间的协作才走 bus / sharedData。",
};

const TAGS = ["风景", "城市", "极简", "插画", "夜景", "几何"];
const DATA: SeedCard[] = makeCards({ count: 36, seed: 9901, heightRange: [150, 260] }).map(
  (c, i) => ({ ...c, tag: TAGS[i % TAGS.length] })
);

const Waterfall = withPlugins<SeedCard>(WaterfallCore, [
  createGroupingPlugin<SeedCard>({ groupBy: (item) => item.tag }),
  createStickyHeaderPlugin({ title: "壁纸 · 当前分组" }),
  createAutoColumnPlugin({ minColumnWidth: 132, maxColumns: 6 }),
  createGapPlugin({ columnGap: 10, rowGap: 10 }),
]);

function Wallpaper({ item }: { item: SeedCard }) {
  return (
    <div className="wf-card is-wall">
      <Thumb height={item.height} hue={item.hue} badge={item.tag} radius={6} />
    </div>
  );
}

export default function GroupedWallScenario() {
  const ref = useRef<WaterfallCoreRef>(null);
  const [active, setActive] = useState(TAGS[0]);

  // 页面这份分组只是为了画跳转芯片；插件那份在 sharedData 里，供吸顶条使用
  const groups = useMemo(() => {
    const map = new Map<string, number>();
    DATA.forEach((item) => map.set(item.tag, (map.get(item.tag) ?? 0) + 1));
    return Array.from(map.entries());
  }, []);

  const jump = (tag: string) => {
    const index = DATA.findIndex((item) => item.tag === tag);
    if (index < 0) return;
    setActive(tag);
    ref.current?.scrollToItem(index, { block: "start", behavior: "smooth" });
  };

  return (
    <div className="scn-widget">
      <div className="scn-toolbar">
        <div className="scn-seg">
          {groups.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              className={active === tag ? "is-on" : ""}
              onClick={() => jump(tag)}
            >
              {tag} <em>{count}</em>
            </button>
          ))}
        </div>
      </div>

      <Waterfall
        ref={ref}
        items={DATA}
        containerStyle={{ height: 366 }}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <Wallpaper item={item} />}
      />
    </div>
  );
}
