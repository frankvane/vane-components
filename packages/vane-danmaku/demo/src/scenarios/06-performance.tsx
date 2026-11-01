/**
 * 场景 06 · 海量弹幕压测
 *
 * 直播大促峰值几万条弹幕涌入，Canvas 内核到底能不能扛？这里不装任何业务插件，
 * 直接测 DanmakuCore 的轨道调度 + 逐帧绘制上限，实时显示 FPS 与「在飞条数」。
 *
 * 两种口径分开测（这是性能测试最容易糊掉的地方）：
 *   · 「总量」= 这一轮要流过的弹幕条数（1000 / 2000 / 3000）。
 *   · 「在飞」= 同一时刻真正在屏幕上的条数（读内核 getStats()，不含未到时间与已离场的）。
 *   · 「丢弃」= 画布饱和（找不到任何空闲轨）且排队超过 1.2s 被丢掉的条数。
 * 一块画布的入场容量是物理上限（轨数 × 每轨复用速度）：本机 460 高、22px 轨高的演示尺寸下，
 * 在飞 70~80 条、约 20 条/秒就顶到容量，再往上加只会变成「丢弃」上涨而 FPS 不涨。
 * 真实直播峰值的在飞量约 100~300 条，需要更宽的画布 / 更小的字号，或分屏渲染。
 *
 * 说明：切到顶部「压测」分类只看这一张卡，其它场景卡的 rAF 不会干扰 FPS 读数。
 * 深链：`?n=3000` 打开即满载（默认按 40 秒铺开），便于分享 / 录制 / 回归比对。
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DanmakuCore } from "vane-danmaku";
import type { DanmakuCoreRef, DanmakuItem } from "vane-danmaku";

/** 循环时长（秒）：3000 条铺在 40s，约 75 条/秒进流，峰值在飞 ~300 条 */
const LOOP = 40;
/** 单条飞行时长（秒）——决定同一时刻的在飞条数 */
const DURATION = 4;
/** 过载档：同样条数压进 16s，在飞量 ≈ 4.7 倍，用来找性能拐点 */
const LOOP_OVERLOAD = 16;

const WORDS = [
  "哈哈哈",
  "666",
  "主播牛",
  "这波稳",
  "前方高能",
  "泪目",
  "yyds",
  "绝了",
  "冲鸭",
  "awsl",
  "名场面",
  "压力测试中",
  "帧率还好吗",
  "弹幕护体",
  "海量刷屏",
];

/** 生成 n 条弹幕，时间均匀铺在 loop 内；少量 top / reverse 制造混排 */
function makeItems(n: number, loop: number): DanmakuItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    text: `${WORDS[i % WORDS.length]} ${i}`,
    mode: i % 17 === 0 ? "top" : i % 23 === 0 ? "reverse" : "scroll",
    time: (i / n) * loop,
    duration: DURATION,
    meta: i % 29 === 0 ? { level: 30 } : {},
  }));
}

export default function Scenario() {
  const [items, setItems] = useState<DanmakuItem[]>([]);
  const [count, setCount] = useState(0);
  const [loop, setLoop] = useState(LOOP);
  const [currentTime, setCurrentTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [active, setActive] = useState(0);
  const [dropped, setDropped] = useState(0);

  const startRef = useRef(performance.now());
  const framesRef = useRef(0);
  const markRef = useRef(performance.now());
  const loopRef = useRef(LOOP);
  const coreRef = useRef<DanmakuCoreRef | null>(null);

  // 时钟：推进 currentTime + 每 500ms 结算一次 FPS / 在飞 / 丢弃
  // 在飞与丢弃直接读内核 getStats()，不再自己按 time 区间估算 —— 估出来的数是「理论值」，
  // 调度器真正绘制多少（出画即回收、饱和即丢弃）只有它自己知道。
  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      const L = loopRef.current;
      setCurrentTime(((t - startRef.current) / 1000) % L);
      framesRef.current++;
      const now = performance.now();
      if (now - markRef.current >= 500) {
        setFps(Math.round((framesRef.current * 1000) / (now - markRef.current)));
        framesRef.current = 0;
        markRef.current = now;
        const s = coreRef.current?.getStats();
        setActive(s?.active ?? 0);
        setDropped(s?.dropped ?? 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const spawn = (n: number, loopSec: number = LOOP) => {
    const arr = makeItems(n, loopSec);
    loopRef.current = loopSec;
    setItems(arr);
    setCount(n);
    setLoop(loopSec);
    startRef.current = performance.now();
    markRef.current = performance.now();
    framesRef.current = 0;
  };

  // 深链：`?n=3000` 打开即满载（默认按 40 秒铺开），`&t=16` 可直接进过载档。
  // 上限 20000 条，防止误传超大值把标签页打死。
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const n = Number(qs.get("n"));
    if (Number.isFinite(n) && n > 0) {
      const t = Number(qs.get("t"));
      const loopSec = Number.isFinite(t) && t >= 4 ? t : LOOP;
      spawn(Math.min(20000, Math.floor(n)), loopSec);
    }
    // 只在挂载时读一次 URL，之后由按钮控制
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = () => {
    setItems([]);
    setCount(0);
    setActive(0);
    setDropped(0);
  };

  // fps 着色：≥50 绿、≥30 琥珀、<30 红
  const fpsColor = fps >= 50 ? "#7fd08c" : fps >= 30 ? "#f5c24b" : "#f2685e";
  const fpsState = fps >= 50 ? "流畅" : fps >= 30 ? "可用" : "过载";

  const stage = useMemo(
    () => ({ position: "relative" as const, height: 460, borderRadius: 8, overflow: "hidden" as const }),
    []
  );

  return (
    <div>
      <div className="perf-bar">
        <b className="perf-title">海量弹幕压测</b>
        <button type="button" className="mp-btn" onClick={() => spawn(1000)}>
          1000 条
        </button>
        <button type="button" className="mp-btn" onClick={() => spawn(2000)}>
          2000 条
        </button>
        <button type="button" className="mp-btn" onClick={() => spawn(3000)}>
          3000 条
        </button>
        <button
          type="button"
          className="mp-btn mp-btn-danger"
          onClick={() => spawn(3000, LOOP_OVERLOAD)}
        >
          极限 · 3000 条 / 16s
        </button>
        <button type="button" className="mp-btn" onClick={clear}>
          清空
        </button>
        <span className="perf-stat">
          总数 <b>{count}</b> · 铺开 <b>{count === 0 ? "—" : `${loop}s`}</b> · 在飞{" "}
          <b>{active}</b> · 丢弃{" "}
          <b style={{ color: dropped > 0 ? "#f2685e" : "var(--dim)" }}>{dropped}</b> · FPS{" "}
          {/* 空载也显示 FPS：它就是这台机器的刷新基线，能对照看出「掉帧是弹幕多还是环境本身限帧」 */}
          <b style={{ color: count === 0 ? "var(--dim)" : fpsColor }}>
            {fps}
            {count > 0 ? `（${fpsState}）` : ""}
          </b>
        </span>
      </div>

      <div
        data-danmaku-root
        style={{
          ...stage,
          background:
            "linear-gradient(135deg, #1b2a4a 0%, #0d1424 60%, #2a1730 100%)",
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.45)",
        }}
      >
        <DanmakuCore
          ref={coreRef}
          items={items}
          currentTime={currentTime}
          playing
          trackHeight={22}
          baseFontSize={16}
          containerStyle={{ width: "100%", height: "100%" }}
        />
        {count === 0 ? (
          <div className="perf-empty">
            <span>点上方「1000 / 2000 / 3000 条」开始压测</span>
            <span className="perf-tip">（也可用 ?n=3000 深链打开即满载）</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const meta = {
  id: "performance",
  title: "海量弹幕压测",
  group: "压测",
  ref: { label: "性能基准", url: "https://github.com/frankvane/vane-components" },
  pain: "大促峰值几万条弹幕涌入：Canvas 内核能不能扛住？这里一键灌 1000/2000/3000 条，实时看 FPS 与在飞条数。",
  plugs: [],
  props: ["items={items}", "currentTime={t}", "playing"],
  note:
    "纯内核压测：不装任何业务插件，直接测 DanmakuCore 的轨道调度 + 逐帧绘制上限。三个读数必须分清 —— 总量 / 在飞 / 丢弃，在飞与丢弃直接读内核 getStats()，不是按时间区间估的理论值。画布画出界的弹幕会立刻从活跃表里回收、绘制前再跳过完全出画的条目，所以「看不见的弹幕」不产生渲染开销；真正的上限是「同时在飞多少条 + 每轨多久能复用一次」。本机演示尺寸（高 460、轨高 22、字号 16）下，在飞 70~80 条、约 20 条/秒进场就顶到容量，继续加量只会让「丢弃」上涨而 FPS 不涨 —— 丢弃开始上涨的那一档就是这块画布的饱和点。饱和时内核先排队等空轨，等 1.2 秒仍无位才丢弃并计数，绝不把弹幕叠进同一轨（叠字既看不清，也是最贵的光栅化）。切到顶部「压测」分类只看这一张，FPS 读数最准；也可用 `?n=3000&t=16` 深链打开即满载。",
  tone: "dark",
};
