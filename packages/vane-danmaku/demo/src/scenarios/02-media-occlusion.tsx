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

// 离线示例视频（demo/public/samples，构建后由 build-demos 平铺到产物根）
// 用 720p / 12s 轻量转码版（原 4K 太大、加载慢），MediaPipe 检测本就降采样到 480px。
const SAMPLE_VIDEOS: { label: string; url: string }[] = [
  { label: "示例 · 人物镜头 A", url: "/samples/sample-a.mp4" },
  { label: "示例 · 人物镜头 B", url: "/samples/sample-b.mp4" },
];

const DETECT_W = 480; // 检测降采样宽度（保纵横比）

/**
 * 避让区用「主体骨架」：鼻 + 双肩 + 双髋 + 双膝。
 * 不取全 33 点 —— 举手/踢腿/张开手臂时腕踝会把框撑到几乎整屏；也不只取躯干 ——
 * 大腿以下会漏，弹幕会压着腿走。取到膝盖是「覆盖人、但仍然贴着人」的折中。
 */
const CORE_POINTS = [0, 11, 12, 23, 24, 25, 26];

/** 连续这么久检测不到人（人出画 / 侧身）就撤掉避让区，别让旧框一直压着画面 */
const ZONE_TTL = 0.3;

/**
 * 视频缩放模式 —— 必须和下面的坐标映射保持一致，否则避让区会整体错位。
 *
 * 用 contain 而不是 cover：示例片源是竖屏（9:16）近景，塞进 16:9 舞台用 cover 会把画面
 * 裁到只剩腰部，人物横向占掉半个屏 → 避让区巨大，弹幕全被裁掉，看起来像「没弹幕」。
 * contain 让整帧可见，人物只占窄窄一条，弹幕才有地方走、也才看得出「从人身后穿过」。
 */
const FIT: "contain" | "cover" = "contain";

// 标准人体骨骼连线（PoseLandmarker 33 关键点：头面 / 躯干 / 四肢）
const POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22],
  [23, 25], [25, 27], [27, 29], [27, 31], [24, 26], [26, 28], [28, 30], [28, 32],
];

type Mode = "idle" | "camera" | "upload" | "synthetic";

// 加密的弹幕流：主样本 + 第二波（只补 scroll，且是不同的句子）。
// 注意别把 top/bottom 也复制一遍 —— 屏幕上会出现两条一模一样的置顶公告，看着像 bug。
const WAVE2: DanmakuItem[] = [
  { id: "b1", text: "这段卡点太准了", mode: "scroll", time: 0.5, meta: {} },
  { id: "b2", text: "导演加个鸡腿", mode: "scroll", time: 1.4, meta: {} },
  { id: "b3", text: "镜头感绝了", mode: "scroll", time: 2.7, meta: {} },
  { id: "b4", text: "背景音乐叫啥", mode: "scroll", time: 3.4, meta: {} },
  { id: "b5", text: "慢动作好评", mode: "scroll", time: 4.8, meta: {} },
  { id: "b6", text: "这走位有点东西", mode: "scroll", time: 6.1, meta: {} },
  { id: "b7", text: "刚进来就赶上了", mode: "scroll", time: 7.3, meta: {} },
  { id: "b8", text: "已三连", mode: "scroll", time: 9.1, meta: {} },
  { id: "b9", text: "回放看起来", mode: "scroll", time: 10.4, meta: {} },
];

const STREAM: DanmakuItem[] = [...SAMPLE_BASIC, ...WAVE2];

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
  /** 最近一次检测到人的时间（秒），用于避让区过期 */
  const lastSeenRef = useRef(0);

  // 默认直接播放第一段示例视频：打开场景即看到「视频 + 弹幕穿透」，无需手动点选
  const [mode, setMode] = useState<Mode>("upload");
  const [videoSrc, setVideoSrc] = useState<string | null>(
    SAMPLE_VIDEOS[0]?.url ?? null
  );
  const [status, setStatus] = useState<string>(
    "自动播放示例视频 · 弹幕穿透叠在视频上；PoseLandmarker 就绪后骨骼识别并绕开人物"
  );
  // ML 是否就绪（模型加载成功才做骨骼识别）；失败也不影响视频与弹幕穿透
  const [mlReady, setMlReady] = useState(false);
  // 视频真实播放进度（0 = 没在播），用于状态显示与自检
  const [videoClock, setVideoClock] = useState(0);
  // 视频是否真的在播（onPlay/onPause 同步）；没播时给一个显眼的起播按钮，
  // 避免 autoplay 被拦后用户只看到一张静止的渐变底，以为「视频演示坏了」。
  const [videoPlaying, setVideoPlaying] = useState(false);
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
        setMlReady(true);
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
        setMlReady(true);
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
              // 与 <video object-fit> 一致的缩放映射（用原始帧尺寸算，不能用降采样后的）
              const scale =
                FIT === "cover" ? Math.max(cw / vw, ch / vh) : Math.min(cw / vw, ch / vh);
              const dispW = vw * scale;
              const dispH = vh * scale;
              const offX = (cw - dispW) / 2;
              const offY = (ch - dispH) / 2;
              let minX = 1, minY = 1, maxX = 0, maxY = 0;
              for (const i of CORE_POINTS) {
                const p = lms[i];
                if (!p) continue;
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
              }
              // 检测不到主体点时（人出画/侧身）就不产生避让区，别拿 0,0 当框
              if (maxX > minX && maxY > minY) {
                const pad = 14;
                zonesRef.current = [
                  {
                    x: offX + minX * dispW - pad,
                    y: offY + minY * dispH - pad,
                    w: (maxX - minX) * dispW + pad * 2,
                    h: (maxY - minY) * dispH + pad * 2,
                  },
                ];
              } else {
                zonesRef.current = [];
              }
              drawOverlay(
                lms.map((p: { x: number; y: number }) => ({
                  x: offX + p.x * dispW,
                  y: offY + p.y * dispH,
                }))
              );
              lastSeenRef.current = performance.now() / 1000;
            } else if (performance.now() / 1000 - lastSeenRef.current > ZONE_TTL) {
              // 人出画 / 侧身检测不到：撤掉避让区与骨架，否则旧框会一直压在画面上
              // （内核拿到的避让区是「最新已知」，我们不更新它就不会过期）
              zonesRef.current = [];
              drawOverlay([]);
            }
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch {
        if (cancelled) return;
        // 模型加载失败（多半无外网）：**保留视频与弹幕穿透**，只是不做骨骼识别/绕人，
        // 不要切走视频（旧逻辑切 synthetic 会把视频也关掉，与「视频穿透演示」冲突）
        setMlReady(false);
        setStatus("视频播放中 · 弹幕穿透（MediaPipe 模型未加载，暂不做骨骼绕人）");
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
    v.muted = true;
    // 显式 setAttribute + load，避免 React 的 src 未触发加载（preload 只拿元数据时首帧不绘制）
    if (v.getAttribute("src") !== videoSrc) {
      v.setAttribute("src", videoSrc);
      v.load();
    }
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
  // 骨骼识别真正在跑 = 视频模式 + 模型就绪
  const tracking = showVideo && mlReady;

  return (
    <div
      ref={containerRef}
      data-danmaku-root
      onClick={() => {
        // 兜底：某些浏览器/策略下 muted autoplay 仍被拦，点一下舞台即可起播
        const v = videoRef.current;
        if (v && v.paused && (mode === "upload" || mode === "camera")) {
          v.play().catch(() => {});
        }
      }}
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
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        src={mode === "upload" ? videoSrc ?? undefined : undefined}
        onTimeUpdate={(e) => setVideoClock(e.currentTarget.currentTime)}
        onPlay={() => setVideoPlaying(true)}
        onPause={() => setVideoPlaying(false)}
        onError={(e) => {
          // 浏览器/环境无法解码时别静默卡住：退回「模拟人物」照样演示防遮挡，
          // 同时把错误码写进状态条（供排查是资源问题还是媒体管线问题）
          const code = e.currentTarget.error?.code;
          setVideoPlaying(false);
          setStatus(
            `视频无法播放（MediaError ${code ?? "?"}）· 已切「模拟人物」，弹幕穿透与绕人逻辑照跑`
          );
          setMode("synthetic");
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: FIT,
          opacity: showVideo ? 1 : 0,
          transition: "opacity .3s",
          zIndex: 0,
        }}
      />
      {/* 弹幕穿透：绝对定位覆盖在视频之上，内核每帧绕开人物框 */}
      <Player
        items={STREAM as DanmakuItem[]}
        currentTime={currentTime}
        playing
        topInset={44}
        bottomInset={88}
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

      {/* autoplay 被浏览器策略拦下时的显式起播口（静音播放一般不会被拦，这里是兜底） */}
      {showVideo && !videoPlaying ? (
        <button
          type="button"
          aria-label="播放视频"
          onClick={() => videoRef.current?.play().catch(() => {})}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 7,
            width: 64,
            height: 64,
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.28)",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: 24,
            lineHeight: 1,
            cursor: "pointer",
            backdropFilter: "blur(2px)",
          }}
        >
          ▶
        </button>
      ) : null}

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
            color: tracking ? "#5fd3c8" : showVideo ? "#f5c24b" : "#9aa3b2",
            background: "rgba(0,0,0,0.45)",
            padding: "4px 8px",
            borderRadius: 6,
          }}
        >
          {tracking
            ? "● 骨骼识别中 · 弹幕绕开人物"
            : mode === "synthetic"
            ? "● 模拟人物 · 防遮挡演练"
            : showVideo
            ? "● 视频播放中 · 弹幕穿透叠加"
            : "○ 未启动"}
        </span>
        {showVideo ? (
          <span
            style={{
              fontSize: 12,
              color: videoClock > 0 ? "#7fd08c" : "#9aa3b2",
              background: "rgba(0,0,0,0.45)",
              padding: "4px 8px",
              borderRadius: 6,
            }}
          >
            {videoClock > 0 ? `▶ 播放中 ${videoClock.toFixed(1)}s` : "⏸ 未播放（点舞台起播）"}
          </span>
        ) : null}
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
    "发布包不捆绑 MediaPipe（体积预算不受影响）。这里在 demo 里用 PoseLandmarker 取 33 个骨骼点，只用鼻/双肩/双髋这几个主体点算外接矩形当避让区（全骨架外接会随举手踢腿膨胀成整屏，弹幕就没地方走了）；内核每帧同步消费，几帧延迟对人无感。四种输入：示例视频（离线人物镜头）/ 上传视频（离线最稳）/ 摄像头（真实人物）/ 模拟人物（无设备回退）。4K 视频检测前降采样到 480px 宽，开销降一量级。弹幕穿透 = canvas 叠在视频之上、绕开人物框。",
  tone: "dark",
};

export default function Scenario() {
  return <MediaPipeOcclusion />;
}
