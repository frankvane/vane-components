/**
 * 场景 06 · 海量弹幕压测
 *
 * 直播大促峰值几万条弹幕涌入，Canvas 内核到底能不能扛？这里不装任何业务插件，
 * 直接测 DanmakuCore 的轨道调度 + 逐帧绘制上限，实时显示 FPS 与「在飞条数」。
 *
 * 两种口径分开测（这是性能测试最容易糊掉的地方）：
 *   · 「总量」= 这一轮要流过的弹幕条数（1000 / 2000 / 3000）。
 *   · 「在飞」= 同一时刻真正在屏幕上的条数 = 总量 × 单条时长 / 循环时长。
 * 真实直播峰值的在飞量大约 100~300 条；把 3000 条压进 16 秒会变成 ~900 条同时在飞，
 * 那是过载极限档，用来找拐点，不代表日常负载。
 *
 * 说明：切到顶部「压测」分类只看这一张卡，其它场景卡的 rAF 不会干扰 FPS 读数。
 * 深链：`?n=3000` 打开即满载（默认按 40 秒铺开），便于分享 / 录制 / 回归比对。
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DanmakuCore } from "vane-danmaku";
import type { DanmakuItem } from "vane-danmaku";

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

  const startRef = useRef(performance.now());
  const framesRef = useRef(0);
  const markRef = useRef(performance.now());
  const itemsRef = useRef<DanmakuItem[]>([]);
  const loopRef = useRef(LOOP);

  // 时钟：推进 currentTime + 每 500ms 结算一次 FPS 与在飞条数
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
        const ct = ((now - startRef.current) / 1000) % L;
        const list = itemsRef.current;
        let a = 0;
        for (const it of list) {
          if (it.time <= ct && ct < it.time + (it.duration ?? DURATION)) a++;
        }
        setActive(a);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const spawn = (n: number, loopSec: number = LOOP) => {
    const arr = makeItems(n, loopSec);
    itemsRef.current = arr;
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
    itemsRef.current = [];
    setItems([]);
    setCount(0);
    setActive(0);
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
          <b>~{active}</b> · FPS{" "}
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
    "纯内核压测：不装任何业务插件，直接测 DanmakuCore 的轨道调度 + 逐帧绘制上限。关键要把「总量」和「在飞」分开看 —— 同一时刻真正在屏幕上的条数 = 总量 × 单条时长 / 循环时长。默认三档把 1000/2000/3000 条铺在 40 秒内（在飞 ~100/200/300，接近真实直播峰值），「极限档」把 3000 条压进 16 秒（在飞 ~900），用来看性能拐点。切到顶部「压测」分类只看这一张，FPS 读数最准；也可用 `?n=3000` 深链打开即满载。超过空轨容量后弹幕会复用起始轨（允许重叠），这是过载时的既定兜底，不丢弹幕。",
  tone: "dark",
};
