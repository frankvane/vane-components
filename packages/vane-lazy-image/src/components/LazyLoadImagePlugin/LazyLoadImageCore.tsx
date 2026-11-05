/**
 * LazyLoadImagePlugin/Core - 极简核心组件（供插件系统增强）
 *
 * 职责：
 * - IntersectionObserver 视口检测
 * - 基础图片加载（带生命周期回调）
 * - 状态管理（idle/loading/loaded/error）
 * - 预留扩展接口与 children 注入（供插件渲染）
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
// 🚀 性能优化：使用 ObserverPool 共享 IntersectionObserver 实例
import { observeElement } from "./ObserverPool";
import { createPerformanceMonitor, type PerformanceMonitor, type PerformanceReport } from "../../utils/PerformanceMonitor";

// Issue #1: 状态管理类型定义
interface LazyImageState {
  // 加载状态：idle（空闲）、loading（加载中）、loaded（已加载）、error（错误）
  status: "idle" | "loading" | "loaded" | "error";
  // 显示的图片 URL
  displaySrc: string | null;
  // 错误信息
  error: Error | null;
  // P0-2：当前这次加载的请求令牌（每次 startLoad 递增），用于拒绝迟到的旧请求事件
  requestId: number;
}

// Issue #1: Action 类型定义
type LazyImageAction =
  | { type: "LOAD_START"; payload: { src: string; requestId: number } }
  | { type: "LOAD_SUCCESS"; payload: { requestId: number; src?: string } }
  | { type: "LOAD_ERROR"; payload: { error: Error; requestId: number } }
  | { type: "RESET" };

// Issue #1: Reducer 函数
function lazyImageReducer(
  state: LazyImageState,
  action: LazyImageAction
): LazyImageState {
  switch (action.type) {
    case "LOAD_START":
      return {
        status: "loading",
        displaySrc: action.payload.src,
        error: null,
        requestId: action.payload.requestId,
      };
    // P0-2：事件携带请求令牌，令牌不匹配说明是旧请求的迟到事件，直接丢弃
    case "LOAD_SUCCESS":
      if (action.payload.requestId !== state.requestId) return state;
      return {
        ...state,
        status: "loaded",
        // P0-2：回退 / 重试插件直接改写 img.src 时，成功地址可能已不等于原 displaySrc
        displaySrc: action.payload.src || state.displaySrc,
        error: null,
      };
    case "LOAD_ERROR":
      if (action.payload.requestId !== state.requestId) return state;
      return {
        ...state,
        status: "error",
        error: action.payload.error,
      };
    case "RESET":
      return {
        status: "idle",
        displaySrc: null,
        error: null,
        requestId: state.requestId,
      };
    default:
      return state;
  }
}

/**
 * P0-2：判断两个图片地址是否指向同一资源。
 * 绑定 src 插件（Fallback / Retry / CDN）会直接改写 img.src，
 * 这类改写属于「同一个逻辑请求」，因此只需要能识别绝对/相对等价即可。
 */
function sameImageUrl(a: string, b: string): boolean {
  if (!a || !b) return true;
  if (a === b) return true;
  try {
    const base = typeof document !== "undefined" ? document.baseURI : "http://localhost/";
    return new URL(a, base).href === new URL(b, base).href;
  } catch {
    return false;
  }
}

export interface LazyLoadImageCoreProps {
  src: string;
  alt?: string;

  // IO 配置
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  /**
   * 进入视口后是否停止观察（默认 false）。
   * ⚠️ 默认值变更（P1-3）：此前默认 true 会让「离开视口」事件永远不触发，
   * 依赖 leave 的插件（MemoryPressureAbort / ViewportDebounce / UserBehavior）失效。
   * 需要「只加载一次」时可显式传 true。
   */
  unobserveOnVisible?: boolean;

  // 加载策略
  loading?: "lazy" | "eager" | "auto";

  // 性能优化选项（Issue #0: LCP 优化）
  isLCP?: boolean; // 标记为 LCP 图片，将使用 eager + high priority
  fetchPriority?: "high" | "low" | "auto"; // 图片加载优先级

  // Issue #23: 性能监控
  enablePerformanceMonitor?: boolean; // 启用性能监控

  // 生命周期回调（由 HOC 注入以连接插件）
  onBeforeLoad?: () => Promise<string | undefined> | string | undefined;
  onLoadStart?: () => void;
  onLoadSuccess?: (displaySrc?: string) => void;
  onLoadError?: (error: Error) => void;
  onEnterViewport?: () => void;
  onLeaveViewport?: () => void;

  // 渲染增强
  children?: React.ReactNode;

  // 样式
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  imageStyle?: React.CSSProperties;
  imageClassName?: string;
  /**
   * P2-1：可选的占位比例（例如 16/9、"16 / 9"）。
   * 传入后容器在首帧即具备高度，避免加载完成后兄弟节点被下推（CLS）。
   */
  aspectRatio?: number | string;
  /** P2-4：响应式图片源集（由 Responsive 等插件在 transformProps 中注入） */
  srcSet?: string;
  /** P2-4：响应式图片 sizes 属性 */
  sizes?: string;
  /** 允许插件/调用方为 <img> 设置跨域策略，以支持像素读取等功能 */
  crossOrigin?: "anonymous" | "use-credentials" | "" | null;
  /** 解码策略（decode-after-idle 等插件通过 transformProps 注入） */
  decoding?: "async" | "sync" | "auto";
  /** 防盗链 / 隐私场景的 Referer 策略（auth 等插件注入） */
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  // 供 HOC 传入的外部引用，便于插件访问真实 DOM
  containerRefExternal?: React.RefObject<HTMLDivElement | null>;
  imageRefExternal?: React.RefObject<HTMLImageElement | null>;
}

export interface ImageState {
  isIdle: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
}

export interface LazyLoadImageCoreRef {
  reload: () => void;
  reset: () => void;
  getState: () => ImageState;
  // Issue #23: 性能报告 API
  getPerformanceReport: () => PerformanceReport | null;
}
// 自定义钩子
function useIntersectionObserver(
  targetRef: React.RefObject<HTMLElement | null>,
  options: {
    root?: Element | Document | null;
    rootMargin?: string;
    threshold?: number | number[];
    unobserveOnVisible?: boolean;
  }
) {
  const {
    // P1-4：root 参与依赖，切换滚动容器/src 时必须重建观察
    root,
    // P2-10：默认给出 200px 提前量，避免首屏边缘图片「先白后图」。
    // ⚠️ 默认值变更，需要严格「进视口才加载」时显式传 rootMargin="0px"。
    rootMargin = "200px 0px",
    threshold = 0,
    // P1-3：默认不再「首次可见即退订」，保证 leave 事件可持续触发。
    unobserveOnVisible = false,
  } = options || {};
  const [inView, setInView] = useState(false);

  // Issue #9: 序列化非 root 配置为稳定 key（threshold 数组也归一化）
  const optionsKey = useMemo(() => {
    return JSON.stringify({
      rootMargin,
      threshold,
      unobserveOnVisible,
    });
  }, [rootMargin, threshold, unobserveOnVisible]);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    // 🚀 性能优化：使用 ObserverPool 共享 IntersectionObserver 实例
    // 100 张图片从 100 个 Observer 减少到 1-3 个（-95% 实例数量）
    const unobserve = observeElement(
      el,
      (isIntersecting) => {
        setInView(isIntersecting);
      },
      {
        root: (root as Element) || null,
        rootMargin,
        threshold,
      },
      unobserveOnVisible
    );

    // Issue #2: 清理函数 - 取消观察
    return () => {
      unobserve();
    };
    // Issue #9 / P1-4：root 现在参与依赖 —— 切换滚动容器（抽屉 / Tab / Modal）
    // 或容器 ref 从 null 变为真实元素时必须重建，否则元素仍绑在旧 root 上。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, root]);

  return { inView };
}

// forwardRef 包裹组件
// useImperativeHandle 暴露 Ref 接口
export const LazyLoadImageCore = forwardRef<
  LazyLoadImageCoreRef,
  LazyLoadImageCoreProps
>((props, ref) => {
  const {
    src,
    alt = "",
    root,
    rootMargin,
    threshold,
    unobserveOnVisible,
    loading = "lazy",
    isLCP = false,
    fetchPriority = "auto",
    enablePerformanceMonitor = false,
    onBeforeLoad,
    onLoadStart,
    onLoadSuccess,
    onLoadError,
    onEnterViewport,
    onLeaveViewport,
    children,
    containerStyle,
    containerClassName,
    imageStyle,
    imageClassName,
    aspectRatio,
    srcSet,
    sizes,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Issue #2: 添加 AbortController 用于取消异步操作
  const abortControllerRef = useRef<AbortController | null>(null);

  // Issue #23: 性能监控器
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);

  // Issue #23: 初始化性能监控器
  useEffect(() => {
    if (enablePerformanceMonitor && !performanceMonitorRef.current) {
      performanceMonitorRef.current = createPerformanceMonitor(`lazy-image-${src}`, {
        enabled: true,
        collectVitals: false, // 图片组件不需要收集全局 vitals
        enableDebug: false,
      });
      performanceMonitorRef.current.mark('mount');
    }

    return () => {
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.end();
        performanceMonitorRef.current.dispose();
        performanceMonitorRef.current = null;
      }
    };
  }, [enablePerformanceMonitor, src]);

  // Issue #1: 使用 useReducer 统一管理状态
  const [state, dispatch] = useReducer(lazyImageReducer, {
    status: "idle",
    displaySrc: null,
    error: null,
    requestId: 0,
  });
  /** 最近一次发起加载的 src（错误态下用于判断是否换了图） */
  const lastAttemptSrcRef = useRef<string | null>(null);
  /** P0-2：最近一次失败加载的 src（避免错误态自动重试） */
  const errorSrcRef = useRef<string | null>(null);
  /** P0-2：每次加载分配递增令牌，异步结果 / 事件归属都用它校验 */
  const requestIdRef = useRef(0);
  /** P0-1：是否有加载正在进行（用 ref 避免 startLoad 依赖 state.status 而自动重试） */
  const loadingRef = useRef(false);
  /** P1-1：上次渲染时看到的 src，用于识别「换图」 */
  const prevSrcRef = useRef(src);
  /** P1-5：门控中止后的重试计数 / 定时器 / 重试纪元 */
  const gateRetryCountRef = useRef(0);
  const gateRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gateEpoch, setGateEpoch] = useState(0);
  /** P1-5：门控中止后最多重试次数与延迟（避免一次误判让图片永远停在 idle） */
  const GATE_MAX_RETRIES = 5;
  const GATE_RETRY_DELAY_MS = 300;

  // Issue #0: 智能加载策略
  // LCP 图片或 eager 模式下直接加载，无需等待视口
  const shouldUseIntersectionObserver = useMemo(() => {
    if (isLCP) return false; // LCP 图片立即加载
    if (loading === "eager") return false; // eager 模式立即加载
    if (loading === "auto") {
      // auto 模式：检查图片是否可能在首屏
      // 简单策略：如果组件挂载时已经渲染，认为可能在首屏
      return true; // 保守策略，仍使用 IO
    }
    return true; // lazy 模式使用 IO
  }, [isLCP, loading]);

  const { inView } = useIntersectionObserver(containerRef, {
    root,
    rootMargin,
    threshold,
    unobserveOnVisible,
  });

  // 计算最终的 loading 属性
  const finalLoading = useMemo(() => {
    if (isLCP) return "eager"; // LCP 图片强制 eager
    if (loading === "auto") {
      // auto 模式下，首屏使用 eager，否则 lazy
      // 这里简化处理，使用 IntersectionObserver 判断
      return "lazy"; // 默认 lazy，由 IO 控制
    }
    return loading;
  }, [isLCP, loading]);

  // 计算最终的 fetchPriority
  const finalFetchPriority = useMemo(() => {
    if (isLCP) return "high"; // LCP 图片高优先级
    return fetchPriority;
  }, [isLCP, fetchPriority]);

  // 视口进入/离开
  const prevInViewRef = useRef<boolean>(false);
  useEffect(() => {
    if (inView && !prevInViewRef.current) {
      // Issue #23: 标记进入视口
      performanceMonitorRef.current?.mark('enter-viewport');
      onEnterViewport?.();
    } else if (!inView && prevInViewRef.current) {
      // Issue #23: 标记离开视口
      performanceMonitorRef.current?.mark('leave-viewport');
      onLeaveViewport?.();
    }
    prevInViewRef.current = inView;
  }, [inView, onEnterViewport, onLeaveViewport]);

  /** P1-5：门控中止后延迟重试一次（避免「滚过去又停下」永久停在 idle） */
  const scheduleGateRetry = useCallback(() => {
    if (gateRetryCountRef.current >= GATE_MAX_RETRIES) return;
    gateRetryCountRef.current += 1;
    if (gateRetryTimerRef.current) clearTimeout(gateRetryTimerRef.current);
    gateRetryTimerRef.current = setTimeout(() => {
      gateRetryTimerRef.current = null;
      setGateEpoch((n) => n + 1);
    }, GATE_RETRY_DELAY_MS);
  }, []);

  const startLoad = useCallback(async () => {
    // P1-1：空 src（列表里「暂无图片 / 异步尚未回填」）直接回到 idle，
    // 不进入 loading —— 否则因为没有 <img> 渲染，会永远停留在 Loading 提示。
    if (!src.trim()) {
      loadingRef.current = false;
      lastAttemptSrcRef.current = null;
      errorSrcRef.current = null;
      dispatch({ type: "RESET" });
      return;
    }

    // P0-1：正在加载直接忽略重复触发；错误态下只有换图才允许重新加载。
    // 改用 ref 判断后，startLoad 不再依赖 state.status，
    // 触发 effect 不会因状态流转而重跑（也就不会把 error 覆盖回 loading）。
    if (loadingRef.current) return;
    if (errorSrcRef.current === src) return;

    loadingRef.current = true;
    lastAttemptSrcRef.current = src;
    const requestId = ++requestIdRef.current;

    // Issue #23: 标记加载开始
    performanceMonitorRef.current?.mark('load-start');

    // Issue #2: 取消之前的加载操作
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Issue #2: 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;

    // Issue #1: 使用 dispatch 更新状态
    onLoadStart?.();

    try {
      const maybeCached = await Promise.resolve(onBeforeLoad?.());

      // Issue #2 / P0-2：被取消或令牌已过期（期间换了 src），丢弃本次结果
      if (currentController.signal.aborted || requestIdRef.current !== requestId) {
        return;
      }

      // 门控放行：清零门控重试计数
      gateRetryCountRef.current = 0;

      const finalSrc = maybeCached || src;

      // P1-1：插件把 src 改写成了空串时同样回到 idle
      if (!finalSrc.trim()) {
        loadingRef.current = false;
        dispatch({ type: "RESET" });
        return;
      }

      // Issue #1: 通过 dispatch 统一更新状态和 src
      dispatch({ type: "LOAD_START", payload: { src: finalSrc, requestId } });
    } catch (error) {
      // Issue #2: 忽略因取消导致的错误
      if (currentController.signal.aborted || requestIdRef.current !== requestId) {
        return;
      }
      // 插件 onBeforeLoad 返回 false 触发的门控中止：不视为错误、不进入 error 态，
      // 也不进入 loading 态；P1-5 再安排一次延迟重试。
      if (error instanceof Error && error.message === "LLI_PLUGIN_GATE") {
        loadingRef.current = false;
        dispatch({ type: "RESET" });
        scheduleGateRetry();
        return;
      }

      // Issue #1: 使用 dispatch 处理错误
      loadingRef.current = false;
      errorSrcRef.current = src;
      const err = error instanceof Error ? error : new Error(String(error));
      dispatch({ type: "LOAD_ERROR", payload: { error: err, requestId } });
      onLoadError?.(err);
    }
  }, [src, onBeforeLoad, onLoadStart, onLoadError, scheduleGateRetry]);

  // P0-1：src 变化 → 中止在途请求、作废旧令牌、复位状态机，再重新加载。
  // 必须声明在「触发加载 effect」之前，保证同一 commit 内先复位再发起。
  useEffect(() => {
    if (prevSrcRef.current === src) return;
    prevSrcRef.current = src;

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    // 令牌递增：所有在途异步分支（onBeforeLoad / 旧 img 事件）立即失效
    requestIdRef.current += 1;
    loadingRef.current = false;
    lastAttemptSrcRef.current = null;
    errorSrcRef.current = null;
    gateRetryCountRef.current = 0;
    if (gateRetryTimerRef.current) {
      clearTimeout(gateRetryTimerRef.current);
      gateRetryTimerRef.current = null;
    }
    dispatch({ type: "RESET" });
  }, [src]);

  // Issue #0: 智能加载触发
  // LCP 或 eager 模式：立即加载
  // lazy 模式：等待进入视口
  useEffect(() => {
    if (!shouldUseIntersectionObserver) {
      // LCP 或 eager 模式，立即加载
      startLoad();
    } else if (inView) {
      // lazy 模式，等待进入视口
      startLoad();
    }
    // P0-1 / P1-5：只依赖真实输入（视口、src、策略）与门控重试纪元，
    // 不再依赖 startLoad 身份，避免状态流转导致的重复自动加载。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, src, shouldUseIntersectionObserver, gateEpoch]);

  // Issue #2: 组件卸载时取消所有异步操作
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (gateRetryTimerRef.current) {
        clearTimeout(gateRetryTimerRef.current);
        gateRetryTimerRef.current = null;
      }
    };
  }, []);

  // Issue #24: 抽取重复的重置逻辑
  const resetToInitialState = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // 暴露 Ref 接口
  useImperativeHandle(
    ref,
    () => ({
      reload: () => {
        // Issue #24 / P0-1：先中止在途请求并作废旧令牌，再重新发起加载
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        requestIdRef.current += 1;
        loadingRef.current = false;
        lastAttemptSrcRef.current = null;
        errorSrcRef.current = null;
        gateRetryCountRef.current = 0;
        resetToInitialState();
        // 重新触发加载（若已在视口）
        if (!shouldUseIntersectionObserver || inView) startLoad();
      },
      reset: () => {
        // Issue #24 / P0-1：reset 同时中止在途请求，避免旧事件回流覆盖状态
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        requestIdRef.current += 1;
        loadingRef.current = false;
        lastAttemptSrcRef.current = null;
        errorSrcRef.current = null;
        resetToInitialState();
      },
      getState: () => ({
        // Issue #1: 将新的状态格式转换为旧的 ImageState 格式（向后兼容）
        isIdle: state.status === "idle",
        isLoading: state.status === "loading",
        isLoaded: state.status === "loaded",
        isError: state.status === "error",
      }),
      // Issue #23: 获取性能报告
      getPerformanceReport: () => {
        return performanceMonitorRef.current?.getReport() || null;
      },
    }),
    [inView, startLoad, shouldUseIntersectionObserver, state.status, resetToInitialState]
  );

  // 渲染
  const containerStyles: React.CSSProperties = useMemo(
    () => ({
      position: "relative",
      width: "100%",
      // 默认不抢高度：父容器高度不确定时（auto），`height: 100%` 会退化成 0，
      // 结果既不留白也托不住图，兄弟节点（标题/说明）会压到图上。
      // 交给内容（img 的自然比例）或调用方显式传入的 height / aspectRatio 决定。
      height: "auto",
      // P2-1：显式传入比例时首帧即占位，避免加载完成后兄弟节点被下推（CLS）
      ...(aspectRatio !== undefined ? { aspectRatio: String(aspectRatio) } : null),
      overflow: "hidden",
      // Issue #1: 使用新的状态格式
      background: state.status === "error" ? "#fee" : "#f5f5f5",
      /*
       * 占位底色是浅色，就必须自带深色文字（ADR-13 第 5 条）。
       * 不写的话，宿主是深色页面时占位区里的文字会继承浅色：
       * #f2ede4 压在 #f5f5f5 上只有 1.07:1，「图片未加载」等于没写。
       *
       * 但这个墨色只在「我们自己定底色」时成立。宿主一旦通过 containerStyle
       * 换掉了底色（深色卡片很常见），锁死的 #4a4a4a 会压到他们的深色面上
       * （#4a4a4a / #171513 = 2.05:1）。此时交给宿主按同一条规则补 color，
       * 缺省就继承页面文字色 —— 深底浅字也能读。
       */
      ...(containerStyle && (containerStyle.background || containerStyle.backgroundColor)
        ? null
        : { color: "#4a4a4a" }),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...containerStyle,
    }),
    [containerStyle, state.status, aspectRatio]
  );

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (props.containerRefExternal) {
          (props.containerRefExternal as { current: HTMLDivElement | null }).current = el;
        }
      }}
      className={containerClassName}
      style={containerStyles}
    >
      {/* Loading / Placeholder */}
      {/* Issue #1: 使用新的状态格式 */}
      {state.status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          {/*
           * 跟随容器色，不要写死 #6b6b6b：宿主把占位区改成深色面时
           * （combo 页面的深色卡片就是），写死的深灰只有 3.42:1。
           */}
          <span style={{ color: "inherit", fontSize: 12 }}>Loading...</span>
        </div>
      )}

      {/* Image - 在加载阶段也渲染，通过 onLoad/onError 更新状态，避免二次请求 */}
      {/* Issue #1: 使用 state.displaySrc */}
      {state.displaySrc ? (
        <img
          // P0-2：把本次请求的令牌 / 期望 src 写到 DOM 上，便于事件归属校验与排障
          data-lli-request={state.requestId}
          data-lli-src={state.displaySrc}
          ref={(el) => {
            imgRef.current = el;
            if (props.imageRefExternal) {
              (props.imageRefExternal as { current: HTMLImageElement | null }).current = el;
            }
          }}
          src={state.displaySrc}
          alt={alt}
          // P2-4：响应式 srcset/sizes 由插件在 transformProps 阶段注入，首帧即生效
          srcSet={srcSet}
          sizes={sizes}
          loading={finalLoading}
          // Issue #0: 添加 fetchpriority 支持（LCP 优化）
          // 注意：React 中 HTML 属性应使用小写 fetchpriority
          {...(finalFetchPriority !== "auto" && { fetchpriority: finalFetchPriority })}
          // 提前设置跨域策略，保证加载过程具备像素读取权限（如 Canvas 提取主色）
          crossOrigin={props.crossOrigin ?? undefined}
          // 内核不吞插件下发的解码 / Referer 策略：这两个属性此前被静默丢弃，
          // 导致 decode-after-idle、auth 等插件「配了却没有任何效果」
          decoding={props.decoding ?? undefined}
          referrerPolicy={props.referrerPolicy ?? undefined}
          onLoad={(event) => {
            // P0-2：loading 期间的正常事件，或 error 后由回退/重试插件改写 img.src
            // 触发的「回退成功」事件；其余（idle / loaded 的重复事件）一律忽略。
            if (state.status !== "loading" && state.status !== "error") return;
            const img = event.currentTarget;
            const actualSrc = (img.currentSrc || img.src || "").trim();
            const expectedSrc = (state.displaySrc || "").trim();
            const attrSrc = (img.getAttribute("src") || "").trim();
            const isFallbackSuccess = state.status === "error";

            if (isFallbackSuccess) {
              // 迟到事件 / 原始地址的重复成功事件：地址仍等于期望 src，不能把 error 打成 loaded
              if (!actualSrc || sameImageUrl(actualSrc, expectedSrc)) return;
              // 回退地址必须与当前 img 上的 src 一致，才认为属于本次逻辑请求
              if (!sameImageUrl(actualSrc, attrSrc)) return;
            } else if (
              actualSrc &&
              !sameImageUrl(actualSrc, expectedSrc) &&
              !sameImageUrl(actualSrc, attrSrc)
            ) {
              // 迟到的旧请求事件：既不是本次期望 src，也不是当前 img 上的 src
              return;
            }

            loadingRef.current = false;
            errorSrcRef.current = null;

            // Issue #23: 标记加载完成并测量
            performanceMonitorRef.current?.mark('load-end');
            performanceMonitorRef.current?.measure('load-duration', 'load-start', 'load-end');
            performanceMonitorRef.current?.measure('total-duration', 'mount', 'load-end');

            // Issue #1: 使用 dispatch 更新状态
            dispatch({
              type: "LOAD_SUCCESS",
              payload: {
                requestId: state.requestId,
                // 回退成功时把 displaySrc 同步为真正加载成功的地址
                ...(isFallbackSuccess ? { src: actualSrc || attrSrc } : null),
              },
            });
            // P0-2：回调携带真正加载完成的地址（回退 / 重试插件改写后不再是 displaySrc）
            onLoadSuccess?.(actualSrc || expectedSrc || undefined);
          }}
          onError={(event) => {
            // P0-2：loading 期间的事件，或 error 后回退地址再次失败（供 CDN / 重试插件续跑）。
            if (state.status !== "loading" && state.status !== "error") return;
            const img = event.currentTarget;
            const actualSrc = (img.currentSrc || img.src || "").trim();
            const expectedSrc = (state.displaySrc || "").trim();
            const attrSrc = (img.getAttribute("src") || "").trim();
            const isFallbackFailure = state.status === "error";

            if (isFallbackFailure) {
              // 原始地址的重复/迟到失败事件不能再触发一轮回退
              if (!actualSrc || sameImageUrl(actualSrc, expectedSrc)) return;
              if (!sameImageUrl(actualSrc, attrSrc)) return;
            } else if (
              actualSrc &&
              !sameImageUrl(actualSrc, expectedSrc) &&
              !sameImageUrl(actualSrc, attrSrc)
            ) {
              // 迟到的旧请求 error：不得把已经成功的新图打回 error
              return;
            }

            if (!isFallbackFailure) {
              loadingRef.current = false;
              errorSrcRef.current = src;
            }

            // Issue #23: 标记加载错误
            performanceMonitorRef.current?.mark('load-error');
            performanceMonitorRef.current?.measure('error-duration', 'load-start', 'load-error');

            // Issue #1: 使用 dispatch 处理错误
            const err = new Error("Image load error");
            dispatch({
              type: "LOAD_ERROR",
              payload: { error: err, requestId: state.requestId },
            });
            onLoadError?.(err);
          }}
          style={{
            width: "100%",
            // 与容器同一套逻辑：默认让图按自然比例撑开，显式传 height 时才铺满
            height: "auto",
            objectFit: "cover",
            // Issue #1: 使用新的状态格式
            opacity: state.status === "loaded" ? 1 : 0,
            transition: "opacity 180ms ease",
            ...imageStyle,
          }}
          className={imageClassName}
        />
      ) : null}

      {/* 插件渲染内容 */}
      {children}
    </div>
  );
});

LazyLoadImageCore.displayName = "LazyLoadImageCore";

export default LazyLoadImageCore;
