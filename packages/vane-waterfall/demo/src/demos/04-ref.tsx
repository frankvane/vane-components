/**
 * 04 · Ref 方法调用
 *
 * ref 直接指向 Core（插件上下文不通过 ref 暴露），所以这 13 个方法就是「页面能对瀑布流
 * 做的全部操作」。点一遍比读一遍 API 表快，日志里会留下每次调用的返回值。
 */
import React, { useCallback, useState } from "react";
import { createFeedStage, type StageApi } from "./stages/feed";
import { EventLog, type LogLine } from "./panels";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "ref",
  title: "Ref 方法调用",
  group: "advanced",
  intro: "13 个 ref 方法逐个点一遍，返回值直接写进日志。",
  why: "图片加载完要重排、点导航要跳到某条、滚动位置要复位 —— 这些都不该改数据，而是调 ref。",
  plugs: [],
  props: [
    "ref={ref}",
    "columns={3}",
    "containerStyle={{ height: 420 }}",
    "onItemClick={(i) => ref.current?.scrollToItem(i)}",
  ],
  note: "getAllItemPositions 返回的是实时 Map，不是渲染快照；虚拟化开启后，未挂载项仍保留测量值（getItemElement 会返回 null）。",
};

type Cmd = {
  key: string;
  label: string;
  run: (api: StageApi) => string | Promise<string>;
  needsIndex?: boolean;
};

const COMMANDS: Cmd[] = [
  { key: "relayout", label: "relayout()", run: (a) => (a.ref.current?.relayout(), "清空高度缓存并重排") },
  { key: "top", label: "scrollToTop()", run: (a) => (a.ref.current?.scrollToTop({ behavior: "smooth" }), "回顶") },
  { key: "bottom", label: "scrollToBottom()", run: (a) => (a.ref.current?.scrollToBottom({ behavior: "smooth" }), "到底") },
  {
    key: "item",
    label: "scrollToItem(i)",
    needsIndex: true,
    run: () => "见下方输入框",
  },
  {
    key: "pos",
    label: "getItemPosition(i)",
    needsIndex: true,
    run: () => "见下方输入框",
  },
  {
    key: "allpos",
    label: "getAllItemPositions()",
    run: (a) => {
      const map = a.ref.current?.getAllItemPositions();
      if (!map) return "ref 还没就绪";
      const first = map.get(0);
      return `共 ${map.size} 项；#0 = { x: ${first?.x ?? "-"}, y: ${first?.y ?? "-"} }`;
    },
  },
  {
    key: "colh",
    label: "getColumnHeights()",
    run: (a) => {
      const h = a.ref.current?.getColumnHeights() ?? [];
      return `[${h.map((n) => Math.round(n)).join(", ")}]`;
    },
  },
  {
    key: "layout",
    label: "getLayoutInfo()",
    run: (a) => {
      const i = a.ref.current?.getLayoutInfo();
      return i ? `${i.columns} 列 · 列宽 ${Math.round(i.columnWidth)} · 总高 ${Math.round(i.totalHeight)}` : "ref 还没就绪";
    },
  },
  {
    key: "viewport",
    label: "getViewportInfo()",
    run: (a) => {
      const v = a.ref.current?.getViewportInfo();
      return v ? `scrollTop ${Math.round(v.scrollTop)} · 视口 ${v.clientHeight} · 内容 ${Math.round(v.scrollHeight)}` : "ref 还没就绪";
    },
  },
  {
    key: "range",
    label: "getVisibleRange()",
    run: (a) => {
      const r = a.ref.current?.getVisibleRange();
      return r ? `渲染区间 ${r.start} … ${r.end}` : "ref 还没就绪";
    },
  },
  { key: "force", label: "forceUpdate()", run: (a) => (a.ref.current?.forceUpdate(), "强制重渲染") },
  {
    key: "el",
    label: "getItemElement(0)",
    run: (a) => {
      const el = a.ref.current?.getItemElement(0);
      return el ? `<div data-index="0"> ${el.offsetWidth}×${el.offsetHeight}` : "取不到（可能未挂载）";
    },
  },
  {
    key: "measure",
    label: "measureItem(0)",
    run: async (a) => {
      const r = await a.ref.current?.measureItem(0);
      return r ? `{ width: ${Math.round(r.width)}, height: ${Math.round(r.height)} }` : "量不到";
    },
  },
  {
    key: "container",
    label: "getContainer()",
    run: (a) => {
      const el = a.ref.current?.getContainer();
      return el ? `容器 ${el.clientWidth}×${el.clientHeight}，scrollHeight ${el.scrollHeight}` : "ref 还没就绪";
    },
  },
];

function RefConsole({ api }: { api: StageApi }) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [index, setIndex] = useState(5);

  const push = useCallback((text: string, kind: LogLine["kind"] = "event") => {
    const at = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    setLines((prev) => [{ id: prev.length + 1, at, text, kind }, ...prev].slice(0, 30));
  }, []);

  const run = useCallback(
    async (cmd: Cmd) => {
      const r = api.ref.current;
      if (!r) {
        push("ref.current 为空 —— 舞台还没挂载", "warn");
        return;
      }
      if (cmd.needsIndex) {
        if (cmd.key === "item") {
          r.scrollToItem(index, { behavior: "smooth", block: "start" });
          push(`scrollToItem(${index}, { block: "start" })`);
        } else {
          const p = r.getItemPosition(index);
          push(
            p
              ? `getItemPosition(${index}) = { x: ${Math.round(p.x)}, y: ${Math.round(p.y)}, w: ${Math.round(p.width)}, h: ${Math.round(p.height)} }`
              : `getItemPosition(${index}) = null`
          );
        }
        return;
      }
      push(`${cmd.label} → ${await cmd.run(api)}`);
    },
    [api, index, push]
  );

  return (
    <div className="console">
      <div className="console-head">
        <span>Ref 控制台</span>
        <label className="console-idx">
          index
          <input
            type="number"
            min={0}
            max={api.items.length - 1}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="console-grid">
        {COMMANDS.map((c) => (
          <button key={c.key} type="button" className="console-btn" onClick={() => void run(c)}>
            {c.label}
          </button>
        ))}
      </div>
      <EventLog lines={lines} title="调用记录" empty="点上面任意一个方法" />
    </div>
  );
}

export default createFeedStage({
  count: 36,
  seed: 1701,
  instrument: true,
  plugins: () => [],
  coreProps: (api) => ({
    columns: 3,
    onItemClick: (i) => api.log(`onItemClick #${i}（Core 的项点击回调）`),
  }),
  chrome: (api) => <RefConsole api={api} />,
});
