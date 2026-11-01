/**
 * 场景 02 · MediaPipe 实时防遮挡
 *
 * 核心思路（纠正「纯骨骼点」的误区）：
 *   1. 用 MediaPipe PoseLandmarker 取人物 33 个骨骼点（normalized 0..1）。
 *   2. 由这些点算出人物外接矩形 → 转成容器 CSS 像素的避让区 Rect[]。
 *   3. 把避让区通过 SafeZonePlugin 的 `provider` 注入运行时 shared，内核每帧读取、
 *      让轨道调度避开人物，绝不阻塞 60fps 渲染。
 *
 * 关键点：发布包不捆绑 MediaPipe（体积预算不受影响）；ML 跑在消费方独立循环里，
 * 低频产出避让区，内核同步消费上一帧已知区（人不会瞬移，几帧延迟可接受）。
 *
 * 没摄像头 / 没外网也能看效果：点「模拟人物」用合成避让区跑同一套防遮挡逻辑。
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DanmakuCore, withDanmakuPlugins } from "vane-danmaku";
import type { DanmakuItem, Rect } from "vane-danmaku";
import { createSafeZonePlugin } from "vane-danmaku/custom-plugins";
import { SAMPLE_BASIC } from "../demos/lib/LiveDanmaku";

const POSE_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type Mode = "idle" | "camera" | "synthetic";

function MediaPipeOcclusion() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const zonesRef = useRef<Rect[]>([]);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(performance.now());

  const [mode, setMode] = useState<Mode>("idle");
  const [status, setStatus] = useState<string>(
    "未启动 —— 可点「模拟人物」立即看效果，或「启动摄像头」接 MediaPipe 骨骼点"
  );
  const [currentTime, setCurrentTime] = useState(0);

  // 时钟：把 currentTime 推进并取模，弹幕循环播放
  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      setCurrentTime(((t - startRef.current) / 1000) % 12);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 实时避让区 provider：内核每帧调用，返回最新已知避让区（不阻塞渲染）
  const provider = useMemo(() => () => zonesRef.current, []);
  const Player = useMemo(
    () => withDanmakuPlugins(DanmakuCore, [createSafeZonePlugin({ provider })]),
    [provider]
  );

  const drawOverlay = useMemo(
    () => (zones: Rect[], points?: { x: number; y: number }[]) => {
      const cv = overlayRef.current;
      const el = containerRef.current;
      if (!cv || !el) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (cv.width !== Math.round(w * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0,0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(95,211,200,0.9)";
      ctx.lineWidth = 2;
      for (const z of zones) {
        ctx.fillStyle = "rgba(95,211,200,0.08)";
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.strokeRect(z.x, z.y, z.w, z.h);
      }
      if (points && points.length) {
        ctx.fillStyle = "#ff7a29";
        for (const p of points) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    []
  );

  // 模拟人物：合成一个来回移动的避让区（无需摄像头 / 外网）
  useEffect(() => {
    if (mode !== "synthetic") return;
    let raf = 0;
    const loop = () => {
      const el = containerRef.current;
      if (el) {
        const w = el.clientWidth;
        const h = el.clientHeight;
        const t = performance.now() / 1000;
        const cx = w * (0.5 + 0.32 * Math.sin(t * 0.6));
        const cy = h * (0.52 + 0.12 * Math.sin(t * 0.9));
        const bw = Math.min(w, h) * 0.18;
        const bh = Math.min(w, h) * 0.52;
        const zone: Rect = { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
        zonesRef.current = [zone];
        drawOverlay([zone]);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, drawOverlay]);

  // 摄像头 + MediaPipe PoseLandmarker：取骨骼点 → 外接矩形 → 避让区
  useEffect(() => {
    if (mode !== "camera") return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        setStatus("正在请求摄像头权限…");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        setStatus("加载 MediaPipe PoseLandmarker…");
        const visionUrl =
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
        const vision: any = await import(/* @vite-ignore */ visionUrl);
        if (cancelled) return;
        const fileset = await vision.FilesetResolver.forVisionTasks(POSE_WASM);
        const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        landmarkerRef.current = landmarker;
        setStatus("MediaPipe 已连接 · 实时骨骼点 → 计算人物避让区");

        const loop = () => {
          if (cancelled) return;
          const vv = videoRef.current;
          const el = containerRef.current;
          if (vv && el && vv.readyState >= 2 && landmarker) {
            const res = landmarker.detectForVideo(vv, performance.now());
            const lms = res.landmarks?.[0];
            if (lms && lms.length) {
              let minX = 1, minY = 1, maxX = 0, maxY = 0;
              for (const p of lms) {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
              }
              const cw = el.clientWidth;
              const ch = el.clientHeight;
              const vw = vv.videoWidth || cw;
              const vh = vv.videoHeight || ch;
              // cover 变换：视频按 contain? 这里用 cover 与 <video objectFit:cover> 一致
              const scale = Math.max(cw / vw, ch / vh);
              const dispW = vw * scale;
              const dispH = vh * scale;
              const offX = (cw - dispW) / 2;
              const offY = (ch - dispH) / 2;
              const pad = 8;
              const zone: Rect = {
                x: offX + minX * dispW - pad,
                y: offY + minY * dispH - pad,
                w: (maxX - minX) * dispW + pad * 2,
                h: (maxY - minY) * dispH + pad * 2,
              };
              zonesRef.current = [zone];
              drawOverlay(
                [zone],
                lms.map((p: { x: number; y: number }) => ({
                  x: offX + p.x * dispW,
                  y: offY + p.y * dispH,
                }))
              );
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch {
        if (cancelled) return;
        setStatus("摄像头或 MediaPipe 加载失败（无摄像头 / 无外网）。已自动切回「模拟人物」。");
        setMode("synthetic");
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current = null;
    };
  }, [mode, drawOverlay]);

  // 离开 camera/synthetic 时清场
  useEffect(() => {
    if (mode === "idle") {
      zonesRef.current = [];
      const cv = overlayRef.current;
      const ctx = cv?.getContext("2d");
      if (ctx && cv) ctx.clearRect(0, 0, cv.width, cv.height);
    }
  }, [mode]);

  return (
    <div
      ref={containerRef}
      data-danmaku-root
      style={{
        position: "relative",
        width: "100%",
        height: 380,
        borderRadius: 8,
        overflow: "hidden",
        background: "linear-gradient(135deg, #0d1424, #1b2a4a 60%, #2a1730)",
        boxShadow: "inset 0 0 80px rgba(0,0,0,0.5)",
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: mode === "camera" ? 1 : 0.28,
          transition: "opacity .3s",
        }}
      />
      <Player
        items={SAMPLE_BASIC as DanmakuItem[]}
        currentTime={currentTime}
        playing
        containerStyle={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 10,
          bottom: 10,
          right: 10,
          zIndex: 6,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button type="button" className="mp-btn" onClick={() => setMode("camera")}>
          启动摄像头
        </button>
        <button type="button" className="mp-btn" onClick={() => setMode("synthetic")}>
          模拟人物
        </button>
        <span className="mp-status">{status}</span>
      </div>
    </div>
  );
}

export const meta = {
  id: "media-occlusion",
  title: "MediaPipe 实时防遮挡",
  group: "防遮挡",
  ref: { label: "MediaPipe Pose", url: "https://github.com/google-ai-edge/mediapipe" },
  pain: "视频里的人物被弹幕糊住是硬伤：怎么让弹幕自动绕开人？答案不是纯骨骼点，而是用骨骼点算避让区。",
  plugs: [
    {
      fn: "createSafeZonePlugin",
      cfg: "provider /* MediaPipe → Rect[] */",
      why: "把消费方算出的避让区注入内核，轨道调度自动避开人物",
    },
  ],
  props: ["items={SAMPLE_BASIC}", "currentTime={t}", "playing"],
  note:
    "发布包不捆绑 MediaPipe（体积预算不受影响）。这里在 demo 里用 PoseLandmarker 取 33 个骨骼点，算人物外接矩形当避让区；内核每帧同步消费，几帧延迟对人无感。无摄像头 / 无外网时点「模拟人物」跑同一套逻辑。",
  tone: "dark",
};

export default function Scenario() {
  return <MediaPipeOcclusion />;
}
