/**
 * 场景 02 · MediaPipe 实时防遮挡（视频 + 人物 + 骨骼识别 + 弹幕穿透）
 *
 * 核心思路（纠正「纯骨骼点」的误区）：
 *   1. 用 MediaPipe PoseLandmarker 取人物 33 个骨骼点（normalized 0..1）。
 *   2. 由这些点算出人物外接矩形 → 转成容器 CSS 像素的避让区 Rect[]。
 *   3. 把避让区通过 SafeZonePlugin 的 `provider` 注入运行时 shared，内核每帧读取、
 *      让轨道调度避开人物，绝不阻塞 60fps 渲染。
 *
 * 四种输入，保证「视频中有人物」一定能演示：
 *   · 示例视频：仓库 demo/public/samples 下的两段人物镜头（离线，无需摄像头/外网）。
 *   · 上传视频：选一段本地有人物的视频，离线即可跑骨骼识别（最稳）。
 *   · 启动摄像头：真实人物实时骨骼识别（需授权 + 安全上下文 + 外网拉模型）。
 *   · 模拟人物：无摄像头 / 无外网时合成一个来回移动的避让区，跑同一套防遮挡逻辑。
 *
 * 弹幕穿透：弹幕层绝对定位于视频之上（GPU canvas 叠加），人物框区域被内核调度绕开，
 * 既不挡人、也不被视频裁切 —— 这是「弹幕穿透视频」的正确范式。
 *
 * 性能：4K 视频直接喂 PoseLandmarker 太重，检测前先降采样画到 480px 宽的离屏 canvas，
 * normalized 坐标不变，cover 映射逻辑照旧，检测开销降一个量级。
 *
 * 发布包不捆绑 MediaPipe（体积预算不受影响）；ML 跑在消费方独立循环，低频产出避让区。
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
// 动态 import 必须用变量承载 URL，否则 tsc 会试图解析 CDN 远程模块而 TS2307
const VISION_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

// 离线示例视频（放在 demo/public/samples，构建后由 build-demos.mjs 平铺到产物根）
const SAMPLE_VIDEOS: { label: string; url: string }[] = [
  { label: "示例 · 人物镜头 A", url: "/samples/3391101-uhd_2160_3840_25fps.mp4" },
  { label: "示例 · 人物镜头 B", url: "/samples/2795747-uhd_2160_3840_25fps.mp4" },
];

const DETECT_W = 480; // 检测降采样宽度（保纵横比）

// 标准人体骨骼连线（PoseLandmarker 33 关键点：头面 / 躯干 / 四肢）
const POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22],
  [23, 25], [25, 27], [27, 29], [27, 31], [24, 26], [26, 28], [28, 30], [28, 32],
];

type Mode = "idle" | "camera" | "upload" | "synthetic";

//  denser 弹幕流：原样本 + 半周期错位的第二波，让「绕开人物」更直观
const STREAM: DanmakuItem[] = [
  ...SAMPLE_BASIC,
  ...SAMPLE_BASIC.map((d) => ({ ...d, id: `${d.id}-b`, time: (d.time + 6) % 12 })),
];

function MediaPipeOcclusion() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const zonesRef = useRef<Rect[]>([]);
  const visionRef = useRef<any>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(performance.now());
  const detCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    "未启动 —— 点「示例视频」看离线人物镜头，或「启动摄像头」接真实人物，或「上传视频」选本地画面，或「模拟人物」立即看效果"
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

  // 画人物框 + 骨架（内核只消费 zones 做调度，这里纯可视化）
  const drawOverlay = useMemo(
    () => (pts: { x: number; y: number }[]) => {
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const z of zonesRef.current) {
        ctx.fillStyle = "rgba(95,211,200,0.10)";
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.strokeStyle = "rgba(95,211,200,0.95)";
        ctx.lineWidth = 2;
        ctx.strokeRect(z.x, z.y, z.w, z.h);
      }
      if (pts.length) {
        ctx.strokeStyle = "rgba(255,122,41,0.85)";
        ctx.lineWidth = 2;
        for (const [a, b] of POSE_CONNECTIONS) {
          const pa = pts[a];
          const pb = pts[b];
          if (pa && pb) {
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = "#ff7a29";
        for (const p of pts) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    []
  );

  // 懒加载 MediaPipe（缓存，camera/upload 共用同一份 landmarker）
  const loadVision = useMemo(
    () => async () => {
      if (visionRef.current) return visionRef.current;
      const url = VISION_URL;
      const vision: any = await import(/* @vite-ignore */ url);
      const fileset = await vision.FilesetResolver.forVisionTasks(POSE_WASM);
      const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      visionRef.current = vision;
      landmarkerRef.current = landmarker;
      return vision;
    },
    []
  );

  // 摄像头：取真实人物视频流
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
        await loadVision();
        if (cancelled) return;
        setStatus("已连接 · 实时骨骼识别 → 人物避让区，弹幕自动绕开人物");
      } catch {
        if (cancelled) return;
        setStatus("摄像头不可用（无设备 / 未授权 / 非安全上下文）。已自动切回「模拟人物」。");
        setMode("synthetic");
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      const v = videoRef.current;
      if (v) v.srcObject = null;
    };
  }, [mode, loadVision]);

  // 检测循环：摄像头 / 上传视频 / 示例视频 共用，取骨骼点 → 外接矩形 → 避让区 + 骨架
  // 4K 视频先降采样到 DETECT_W 宽再检测，normalized 坐标不变，开销降一个量级。
  useEffect(() => {
    if (mode !== "camera" && mode !== "upload") return;
    let cancelled = false;
    let raf = 0;
    if (!detCanvasRef.current) detCanvasRef.current = document.createElement("canvas");
    const det = detCanvasRef.current;
    const detCtx = det.getContext("2d", { willReadFrequently: true });
    (async () => {
      try {
        await loadVision();
        if (cancelled) return;
        const loop = () => {
          if (cancelled) return;
          const vv = videoRef.current;
          const el = containerRef.current;
          const lm = landmarkerRef.current;
          if (vv && el && lm && vv.readyState >= 2 && vv.videoWidth > 0 && detCtx) {
            const vw = vv.videoWidth;
            const vh = vv.videoHeight;
            const dh = Math.round((vh * DETECT_W) / vw);
            if (det.width !== DETECT_W || det.height !== dh) {
              det.width = DETECT_W;
              det.height = dh;
            }
            detCtx.drawImage(vv, 0, 0, DETECT_W, dh);
            const res = lm.detectForVideo(det, performance.now());
            const lms = res.landmarks?.[0];
            if (lms && lms.length) {
              const cw = el.clientWidth;
              const ch = el.clientHeight;
              // cover 变换：与 <video objectFit:cover> 一致（用原始帧尺寸）
              const scale = Math.max(cw / vw, ch / vh);
              const dispW = vw * scale;
              const dispH = vh * scale;
              const offX = (cw - dispW) / 2;
              const offY = (ch - dispH) / 2;
              let minX = 1, minY = 1, maxX = 0, maxY = 0;
              for (const p of lms) {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
              }
              const pad = 10;
              zonesRef.current = [
                {
                  x: offX + minX * dispW - pad,
                  y: offY + minY * dispH - pad,
                  w: (maxX - minX) * dispW + pad * 2,
                  h: (maxY - minY) * dispH + pad * 2,
                },
              ];
              drawOverlay(
                lms.map((p: { x: number; y: number }) => ({
                  x: offX + p.x * dispW,
                  y: offY + p.y * dispH,
                }))
              );
            }
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch {
        if (cancelled) return;
        setStatus("MediaPipe 模型加载失败（无外网）。已自动切回「模拟人物」。");
        setMode("synthetic");
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [mode, loadVision, drawOverlay]);

  // 上传视频 / 示例视频：设置 src 并播放（离线即可跑骨骼识别）
  useEffect(() => {
    if (mode !== "upload" || !videoSrc) return;
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = null;
    v.loop = true;
    v.play().catch(() => {});
  }, [mode, videoSrc]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setVideoSrc(URL.createObjectURL(f));
    setMode("upload");
  };

  const onSample = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = e.target.value;
    if (!url) return;
    if (videoSrc && videoSrc.startsWith("blob:")) URL.revokeObjectURL(videoSrc);
    setVideoSrc(url);
    setMode("upload");
  };

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
        const cx = w * (0.5 + 0.3 * Math.sin(t * 0.6));
        const cy = h * (0.52 + 0.12 * Math.sin(t * 0.9));
        const bw = Math.min(w, h) * 0.2;
        const bh = Math.min(w, h) * 0.55;
        zonesRef.current = [{ x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh }];
        drawOverlay([]); // 模拟态不画骨架，只画人物框
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, drawOverlay]);

  // 离开各模式时清场
  useEffect(() => {
    if (mode === "idle") {
      zonesRef.current = [];
      const cv = overlayRef.current;
      const ctx = cv?.getContext("2d");
      if (ctx && cv) ctx.clearRect(0, 0, cv.width, cv.height);
    }
  }, [mode]);

  const showVideo = mode === "camera" || mode === "upload";
  const tracking = showVideo;

  return (
    <div
      ref={containerRef}
      data-danmaku-root
      style={{
        position: "relative",
        width: "100%",
        height: 420,
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
        loop
        src={mode === "upload" ? videoSrc ?? undefined : undefined}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: showVideo ? 1 : 0.28,
          transition: "opacity .3s",
        }}
      />
      {/* 弹幕穿透：绝对定位覆盖在视频之上，内核每帧绕开人物框 */}
      <Player
        items={STREAM as DanmakuItem[]}
        currentTime={currentTime}
        playing
        topInset={44}
        bottomInset={64}
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

      {/* 顶部状态条 */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          zIndex: 6,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: tracking ? "#5fd3c8" : "#9aa3b2",
            background: "rgba(0,0,0,0.45)",
            padding: "4px 8px",
            borderRadius: 6,
          }}
        >
          {tracking ? "● 骨骼识别中 · 弹幕绕开人物" : mode === "synthetic" ? "● 模拟人物 · 防遮挡演练" : "○ 未启动"}
        </span>
      </div>

      {/* 底部控件 */}
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
        <select className="mp-btn" defaultValue="" onChange={onSample}>
          <option value="" disabled>
            示例视频
          </option>
          {SAMPLE_VIDEOS.map((s) => (
            <option key={s.url} value={s.url}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="mp-btn"
          onClick={() => fileRef.current?.click()}
        >
          上传视频
        </button>
        <button type="button" className="mp-btn" onClick={() => setMode("synthetic")}>
          模拟人物
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          style={{ display: "none" }}
          onChange={onFile}
        />
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
  props: ["items={STREAM}", "currentTime={t}", "playing", "avoidZoneProvider"],
  video: true,
  note:
    "发布包不捆绑 MediaPipe（体积预算不受影响）。这里在 demo 里用 PoseLandmarker 取 33 个骨骼点，算人物外接矩形当避让区；内核每帧同步消费，几帧延迟对人无感。四种输入：示例视频（离线人物镜头）/ 上传视频（离线最稳）/ 摄像头（真实人物）/ 模拟人物（无设备回退）。4K 视频检测前降采样到 480px 宽，开销降一量级。弹幕穿透 = canvas 叠在视频之上、绕开人物框。",
  tone: "dark",
};

export default function Scenario() {
  return <MediaPipeOcclusion />;
}
