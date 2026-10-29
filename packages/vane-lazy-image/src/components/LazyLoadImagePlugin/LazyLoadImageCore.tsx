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
import { observeElement, unobserveElement } from "./ObserverPool";
import { createPerformanceMonitor, type PerformanceMonitor, type PerformanceReport } from "../../utils/PerformanceMonitor";

// Issue #1: 状态管理类型定义
interface LazyImageState {
  // 加载状态：idle（空闲）、loading（加载中）、loaded（已加载）、error（错误）
  status: "idle" | "loading" | "loaded" | "error";
  // 显示的图片 URL
  displaySrc: string | null;
  // 错误信息
  error: Error | null;
}

// Issue #1: Action 类型定义
type LazyImageAction =
  | { type: "LOAD_START"; payload: { src: string } }
  | { type: "LOAD_SUCCESS" }
  | { type: "LOAD_ERROR"; payload: { error: Error } }
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
      };
    case "LOAD_SUCCESS":
      return {
        ...state,
        status: "loaded",
        error: null,
      };
    case "LOAD_ERROR":
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
      };
    default:
      return state;
  }
}

export interface LazyLoadImageCoreProps {
  src: string;
  alt?: string;

  // IO 配置
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
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
    root,
    rootMargin = "0px",
    threshold = 0,
    unobserveOnVisible = true,
  } = options || {};
  const [inView, setInView] = useState(false);

  // Issue #9: 使用 ref 存储配置，避免因 root 对象引用变化导致重建
  const optionsRef = useRef({ root, rootMargin, threshold, unobserveOnVisible });

  // Issue #9: 只在配置实际改变时更新 ref
  useEffect(() => {
    optionsRef.current = { root, rootMargin, threshold, unobserveOnVisible };
  });

  // Issue #9: 序列化配置为稳定的 key（排除 root，因为它是对象引用）
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

    // Issue #9: 从 ref 获取最新配置
    const currentOptions = optionsRef.current;

    // 🚀 性能优化：使用 ObserverPool 共享 IntersectionObserver 实例
    // 100 张图片从 100 个 Observer 减少到 1-3 个（-95% 实例数量）
    const unobserve = observeElement(
      el,
      (isIntersecting) => {
        setInView(isIntersecting);
      },
      {
        root: (currentOptions.root as Element) || null,
        rootMargin: currentOptions.rootMargin,
        threshold: currentOptions.threshold,
      },
      currentOptions.unobserveOnVisible
    );

    // Issue #2: 清理函数 - 取消观察
    return () => {
      unobserve();
    };
    // Issue #9: 只依赖序列化的配置 key，大幅减少重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

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
  });
  /** 最近一次发起加载的 src（错误态下用于判断是否换了图） */
  const lastAttemptSrcRef = useRef<string | null>(null);

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

  const startLoad = useCallback(async () => {
    // Issue #1: 使用新的状态检查
    if (state.status === "loading" || state.status === "loaded") return;
    // 加载失败后不要自动重试：否则 startLoad 随 state.status 变化而重建，
    // 触发自动加载 effect 再次 dispatch LOAD_START，把 error 状态覆盖回
    // loading —— 表现为「图片 404 却永远停在 Loading...」。
    // 只有被显式重置（reload()）或 src 变化时才允许再次发起加载。
    if (state.status === "error" && lastAttemptSrcRef.current === src) return;
    lastAttemptSrcRef.current = src;

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

      // Issue #2: 检查是否已被取消
      if (currentController.signal.aborted) {
        return;
      }

      const finalSrc = maybeCached || src;

      // Issue #1: 通过 dispatch 统一更新状态和 src
      dispatch({ type: "LOAD_START", payload: { src: finalSrc } });
    } catch (error: any) {
      // Issue #2: 忽略因取消导致的错误
      if (currentController.signal.aborted) {
        return;
      }
      // 插件 onBeforeLoad 返回 false 触发的门控中止：不视为错误、不进入 error 态，
      // 也不进入 loading 态，直接放弃本次加载（图像保持 idle/占位）。
      if (error?.message === "LLI_PLUGIN_GATE") {
        return;
      }

      // Issue #1: 使用 dispatch 处理错误
      const err = error instanceof Error ? error : new Error(String(error));
      dispatch({ type: "LOAD_ERROR", payload: { error: err } });
      onLoadError?.(err);
    }
  }, [src, onBeforeLoad, onLoadStart, onLoadError, state.status]);

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
  }, [inView, startLoad, shouldUseIntersectionObserver]);

  // Issue #2: 组件卸载时取消所有异步操作
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
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
        // Issue #24: 使用提取的重置函数
        resetToInitialState();
        // 重新触发加载（若已在视口）
        if (inView) startLoad();
      },
      reset: () => {
        // Issue #24: 使用提取的重置函数
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
    [inView, startLoad, state.status, resetToInitialState]
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
    [containerStyle, state.status]
  );

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (props.containerRefExternal) {
          (props.containerRefExternal as any).current = el;
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
      {state.displaySrc && (
        <img
          ref={(el) => {
            imgRef.current = el;
            if (props.imageRefExternal) {
              (props.imageRefExternal as any).current = el;
            }
          }}
          src={state.displaySrc}
          alt={alt}
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
          onLoad={() => {
            // Issue #23: 标记加载完成并测量
            performanceMonitorRef.current?.mark('load-end');
            performanceMonitorRef.current?.measure('load-duration', 'load-start', 'load-end');
            performanceMonitorRef.current?.measure('total-duration', 'mount', 'load-end');

            // Issue #1: 使用 dispatch 更新状态
            dispatch({ type: "LOAD_SUCCESS" });
            onLoadSuccess?.(state.displaySrc || undefined);
          }}
          onError={() => {
            // Issue #23: 标记加载错误
            performanceMonitorRef.current?.mark('load-error');
            performanceMonitorRef.current?.measure('error-duration', 'load-start', 'load-error');

            // Issue #1: 使用 dispatch 处理错误
            const err = new Error("Image load error");
            dispatch({ type: "LOAD_ERROR", payload: { error: err } });
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
      )}

      {/* 插件渲染内容 */}
      {children}
    </div>
  );
});

LazyLoadImageCore.displayName = "LazyLoadImageCore";

export default LazyLoadImageCore;
