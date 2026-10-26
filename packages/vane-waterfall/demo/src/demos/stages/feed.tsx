/**
 * 通用信息流舞台（逐插件示例的主力）
 *
 * 26 个插件里大部分只需要「一批高度不等的卡片 + 某个插件」，重复写 26 份舞台没有意义。
 * 这里把可变部分收敛成 spec：
 *   · plugins(api)   → 装哪些插件（改了会重建组件类型，等价于刷新一页）
 *   · coreProps(api) → 直接给 Core 的 props（实时生效，不重建，滑杆不卡）
 *   · chrome(api)    → 舞台上方/下方附加 UI（工具栏、读数、日志）
 *   · effect(api)    → 挂载后跑一次，用来模拟「图片加载后高度变了」这类时序
 *
 * 两条与实现相关的约定：
 *  1. `pluginKeys` 决定「哪些控件的值会触发重建」。搜素框这类高频输入如果不从 key 里
 *     排除，每敲一个字整块瀑布流都会重新挂载、滚动位置归零 —— 那是把 demo 做成了 bug。
 *  2. 性能读数用「值相等就不 setState」来兜底：onLayoutComplete 里 setState 会引发重渲染，
 *     无脑写会形成 布局→读数→渲染→布局 的循环。
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  WaterfallCore,
  withPlugins,
  type WaterfallCoreProps,
  type WaterfallCoreRef,
  type WaterfallPlugin,
} from "vane-waterfall";
import { makeCards, type SeedCard } from "../../data/seed";
import { FeedCard, type CardVariant } from "../../components/FeedCard";
import { EMPTY_METER, type Meter } from "../panels";
import type { DemoCfg, DemoLog, DemoStageProps } from "../types";

export interface StageApi {
  cfg: DemoCfg;
  items: SeedCard[];
  setItems: React.Dispatch<React.SetStateAction<SeedCard[]>>;
  /** 改控件值（翻页 / 搜索框 / 打乱顺序都走它） */
  setCfg: (key: string, value: number | boolean | string) => void;
  log: DemoLog;
  ref: React.RefObject<WaterfallCoreRef | null>;
  meter: Meter;
}

export interface FeedStageSpec {
  count?: number;
  seed?: number;
  heightRange?: [number, number];
  commerce?: boolean;
  variant?: CardVariant;
  /** 整卡等高（配合 FixedHeightPlugin） */
  fixed?: boolean;
  containerStyle?: React.CSSProperties;
  /** 参与「重建组件」的 cfg 键；不给就是全部键 */
  pluginKeys?: string[];
  plugins?: (api: StageApi) => Array<WaterfallPlugin<SeedCard>>;
  coreProps?: (api: StageApi) => Partial<WaterfallCoreProps<SeedCard>>;
  chrome?: (api: StageApi) => React.ReactNode;
  decorate?: (
    api: StageApi,
    item: SeedCard,
    index: number
  ) => { pinned?: boolean; corner?: React.ReactNode };
  effect?: (api: StageApi) => void | (() => void);
  /** 显示「数据项 / 实际渲染 / 总高 / 布局耗时 / 滚动次数」读数 */
  instrument?: boolean;
}

export function createFeedStage(spec: FeedStageSpec) {
  const {
    count = 48,
    seed = 9101,
    heightRange,
    commerce,
    variant = "photo",
    fixed,
    containerStyle,
    pluginKeys,
    instrument,
  } = spec;

  return function FeedStage({ cfg, log, setCfg }: DemoStageProps) {
    const [items, setItems] = useState<SeedCard[]>(() =>
      makeCards({ count, seed, heightRange, commerce })
    );
    const ref = useRef<WaterfallCoreRef>(null);
    const [meter, setMeter] = useState<Meter>(EMPTY_METER);
    const scrollsRef = useRef(0);
    const layoutStartRef = useRef(0);

    // 插件工厂只能拿到「当次」的 api，用 ref 兜住最新的 items / cfg
    const apiRef = useRef<StageApi>(null as unknown as StageApi);
    apiRef.current = { cfg, items, setItems, setCfg, log, ref, meter };

    // pluginKeys 是工厂闭包里的常量，不参与依赖：它只决定「哪些键值得比较」
    const memoKey = useMemo(() => {
      const keys = pluginKeys ?? Object.keys(cfg);
      return JSON.stringify(keys.map((k) => [k, cfg[k]]));
    }, [cfg]);

    // 只按 memoKey 重建组件类型：见文件头约定 1（搜索框那类高频输入不能进 key）
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const Waterfall = useMemo(() => {
      const list = spec.plugins?.(apiRef.current) ?? [];
      return list.length ? withPlugins<SeedCard>(WaterfallCore, list) : WaterfallCore;
    }, [memoKey]);

    const updateMeter = useCallback((total: number) => {
      const r = ref.current;
      if (!r) return;
      const info = r.getLayoutInfo();
      const range = r.getVisibleRange();
      const next: Meter = {
        total,
        rendered: Math.max(0, range.end - range.start + 1),
        totalHeight: info.totalHeight,
        layoutMs: performance.now() - layoutStartRef.current,
        scrolls: scrollsRef.current,
        columns: info.columns,
      };
      setMeter((prev) =>
        prev.total === next.total &&
        prev.rendered === next.rendered &&
        prev.columns === next.columns &&
        Math.abs(prev.totalHeight - next.totalHeight) < 0.5 &&
        prev.scrolls === next.scrolls &&
        Math.abs(prev.layoutMs - next.layoutMs) < 0.05
          ? prev
          : next
      );
    }, []);

    // instrument / fixed / variant 都是工厂闭包常量，写进依赖只会触发无意义的告警
    const onScroll = useCallback(
      (scrollTop: number) => {
        scrollsRef.current += 1;
        // 滚动时不重排，读数只需刷新「实际渲染」这一项；每 4 次刷一次，避免读数本身成为负担
        if (instrument && scrollsRef.current % 4 === 0) {
          const r = ref.current;
          if (r) {
            const range = r.getVisibleRange();
            const rendered = Math.max(0, range.end - range.start + 1);
            setMeter((prev) =>
              prev.rendered === rendered && prev.scrolls === scrollsRef.current
                ? prev
                : { ...prev, rendered, scrolls: scrollsRef.current }
            );
          }
        }
        void scrollTop;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    const coreProps = useMemo(() => {
      const base = spec.coreProps?.(apiRef.current) ?? {};
      return {
        ...base,
        ...(instrument
          ? {
              onLayout: () => {
                layoutStartRef.current = performance.now();
              },
              onLayoutComplete: () => updateMeter(items.length),
              onScroll,
            }
          : null),
      };
      // items 变化时必须重建 coreProps（onLayoutComplete 里要用最新的条数）
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cfg, items, updateMeter, onScroll]);

    useEffect(() => {
      const cleanup = spec.effect?.(apiRef.current);
      return typeof cleanup === "function" ? cleanup : undefined;
      // 只在挂载时跑一次：effect 通常用来模拟「图片加载后高度变化」这类一次性时序
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderItem = useCallback(
      (item: SeedCard, index: number) => {
        const deco = spec.decorate?.(apiRef.current, item, index);
        return (
          <FeedCard
            card={item}
            variant={variant}
            fixed={fixed}
            pinned={deco?.pinned}
            corner={deco?.corner}
          />
        );
      },
      []
    );

    return (
      <div className="stage">
        {spec.chrome?.(apiRef.current)}
        <div className="stage-scroll">
          <Waterfall
            ref={ref}
            items={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            containerStyle={{ height: "var(--stage-h, 380px)", ...containerStyle }}
            {...coreProps}
          />
        </div>
      </div>
    );
  };
}
