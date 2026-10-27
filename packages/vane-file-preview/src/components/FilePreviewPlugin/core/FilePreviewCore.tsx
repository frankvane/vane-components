/**
 * FilePreviewCore - 文件预览核心组件
 *
 * 职责边界（P1 收敛后）：
 *  - **它是文件加载状态的唯一真源**。插件不自己记 state，通过 `ref.reportState()` 上报，
 *    Core 落库后再经由 `onStateChange` 通知上层镜像。迁移前状态机有两份（Core 一份、
 *    withPlugins 一份），两边各 setState、谁也不知道对方改了什么，分析 4.3 记的就是这个。
 *  - 只管「文件加载到哪一步」，不管「文件该怎么画」—— 画什么由插件通过 `render` 决定。
 */

import type {
  FileInfo,
  PreviewStateInfo,
  PreviewStatePatch,
} from "../plugins/types";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * 外部 ref 的类型。
 *
 * `React.RefObject` 的 `current` 是 readonly（类型层），但运行时它就是普通对象，
 * Core 必须往里写元素，否则 withPlugins 拿不到容器去算尺寸 / 挂监听。
 * 单独在这里声明成联合类型，把「只读声明 vs 实际可写」的张力收在一个地方，
 * 而不是像迁移前那样在每个赋值点写 `as any`（那就什么类型都拦不住了）。
 */
export type ExternalPreviewRef =
  | React.RefObject<HTMLDivElement | null>
  | React.MutableRefObject<HTMLDivElement | null>;

/** 把元素同步给外部 ref；`RefObject` 的 readonly 只存在于类型层 */
function syncExternalRef(
  target: ExternalPreviewRef | undefined,
  el: HTMLDivElement | null
) {
  if (!target) return;
  (target as React.MutableRefObject<HTMLDivElement | null>).current = el;
}

export interface FilePreviewCoreProps {
  file: FileInfo;

  // 生命周期回调
  onBeforeLoad?: () => Promise<boolean> | boolean;
  onLoadStart?: () => void;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
  /**
   * 状态变更镜像。给 withPlugins 用：插件上下文里的 `state` 应当是 Core 的一份投影，
   * 而不是自己再存一份。
   */
  onStateChange?: (info: PreviewStateInfo) => void;

  // 渲染增强
  children?: React.ReactNode;

  // 样式
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  contentStyle?: React.CSSProperties;
  contentClassName?: string;

  // 外部 refs（供插件使用）
  containerRefExternal?: ExternalPreviewRef;
  contentRefExternal?: ExternalPreviewRef;
}

export interface FilePreviewCoreRef {
  /** 重来一遍：状态归零后强制重新走加载流程 */
  reload: () => void;
  /** 只把状态归零，**不**自动重新加载（迁移前会自己跑回 loaded，见下方 effect 注释） */
  reset: () => void;
  getState: () => PreviewStateInfo;
  /** 插件上报自己的加载结果。Core 是唯一真源，插件不许自己 setState */
  reportState: (patch: PreviewStatePatch) => void;
}

export const FilePreviewCore = forwardRef<
  FilePreviewCoreRef,
  FilePreviewCoreProps
>((props, ref) => {
  const {
    file,
    children,
    containerStyle,
    containerClassName,
    contentStyle,
    contentClassName,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /**
   * 状态存两份：state 供渲染，stateRef 供逻辑读。
   *
   * 逻辑不能读 state —— `startLoad` 一旦把 `state.state` 写进依赖，它的身份就随状态变化，
   * 而 `useEffect(..., [startLoad])` 会因此重新触发，于是：
   *   ① `reset()` 把状态置 idle → startLoad 身份变了 → effect 重跑 → 又跑回 loaded；
   *   ② `onBeforeLoad` 返回 false → 置 idle → 同一个循环 → 无限重试。
   * 两个现象都来自「用渲染态驱动副作用」。改成读 ref、effect 只跟 `file.url` 走。
   */
  const [state, setState] = useState<PreviewStateInfo>({ state: "idle" });
  const stateRef = useRef<PreviewStateInfo>({ state: "idle" });

  // 回调一律走 latest-ref：它们的身份每次渲染都变（内联箭头函数），
  // 若写进 useCallback 依赖，runLoad 就会不稳定，effect 又会跟着重跑。
  const callbacksRef = useRef({
    onBeforeLoad: props.onBeforeLoad,
    onLoadStart: props.onLoadStart,
    onLoadSuccess: props.onLoadSuccess,
    onLoadError: props.onLoadError,
    onStateChange: props.onStateChange,
  });
  callbacksRef.current = {
    onBeforeLoad: props.onBeforeLoad,
    onLoadStart: props.onLoadStart,
    onLoadSuccess: props.onLoadSuccess,
    onLoadError: props.onLoadError,
    onStateChange: props.onStateChange,
  };

  const commit = useCallback((next: PreviewStateInfo) => {
    stateRef.current = next;
    setState(next);
    callbacksRef.current.onStateChange?.(next);
  }, []);

  /**
   * 走一遍加载流程。
   *
   * `force` 的语义：跳过「已经在 loading/loaded 就别重来」的守卫。
   * 守卫读的是 `stateRef` 而不是闭包里的 `state` —— 这是函数式守卫，
   * 也是迁移前「状态判断永远看的是上一帧」的根因。
   */
  const runLoad = useCallback(
    async (opts?: { force?: boolean }) => {
      const cur = stateRef.current.state;
      if (!opts?.force && (cur === "loading" || cur === "loaded")) return;

      commit({ state: "loading" });
      callbacksRef.current.onLoadStart?.();

      try {
        const canLoad = await Promise.resolve(callbacksRef.current.onBeforeLoad?.());
        if (canLoad === false) {
          // 直接返回，不排队重试。要重试得调用方自己调 reload()。
          commit({ state: "idle" });
          return;
        }

        // 实际加载由插件负责（P2 起插件通过 reportState 上报进度与失败），
        // Core 到这里只确认「门开了」。
        commit({ state: "loaded" });
        callbacksRef.current.onLoadSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        commit({ state: "error", error: err, message: err.message });
        callbacksRef.current.onLoadError?.(err);
      }
    },
    [commit]
  );

  /**
   * 自动加载只跟「文件标识」走。
   *
   * 不依赖 `runLoad`：它现在身份稳定，但将来任何人给它加一个依赖，effect 就会跟着重跑，
   * 上面那两个 bug 立刻复活。依赖 `file.url` 既是稳定写法，也准确表达了意图 ——
   * 换文件才重新加载，状态自己变不触发副作用。
   */
  useEffect(() => {
    void runLoad({ force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 见上方注释：只跟文件标识
  }, [file.url]);

  const reload = useCallback(() => {
    commit({ state: "idle" });
    void runLoad({ force: true });
  }, [commit, runLoad]);

  const reset = useCallback(() => {
    commit({ state: "idle" });
  }, [commit]);

  const reportState = useCallback(
    (patch: PreviewStatePatch) => {
      commit({ ...stateRef.current, ...patch });
    },
    [commit]
  );

  // 暴露 Ref 接口。依赖里刻意不含 state：handle 必须稳定，
  // 否则每次状态变化外部拿到的 ref 都是新对象，插件里的 buffered 引用会失效。
  useImperativeHandle(
    ref,
    () => ({
      reload,
      reset,
      getState: () => stateRef.current,
      reportState,
    }),
    [reload, reset, reportState]
  );

  const containerStyles: React.CSSProperties = useMemo(
    () => ({
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      background: state.state === "error" ? "#fee" : "#fafafa",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      ...containerStyle,
    }),
    [containerStyle, state.state]
  );

  const contentStyles: React.CSSProperties = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      overflow: "hidden",
      ...contentStyle,
    }),
    [contentStyle]
  );

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        syncExternalRef(props.containerRefExternal, el);
      }}
      className={containerClassName}
      style={containerStyles}
    >
      {/* Loading 状态 */}
      {state.state === "loading" && (
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
          <span style={{ color: "#999", fontSize: 14 }}>Loading...</span>
        </div>
      )}

      {/* Error 状态 */}
      {state.state === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#d32f2f",
            zIndex: 2,
          }}
        >
          <span style={{ fontSize: 14, marginBottom: 8 }}>❌ Load Failed</span>
          {state.message && (
            <span style={{ fontSize: 12, color: "#666" }}>{state.message}</span>
          )}
        </div>
      )}

      {/* 内容区域 */}
      <div
        ref={(el) => {
          contentRef.current = el;
          syncExternalRef(props.contentRefExternal, el);
        }}
        className={contentClassName}
        style={contentStyles}
      >
        {/* 插件渲染内容 */}
        {children}
      </div>
    </div>
  );
});

FilePreviewCore.displayName = "FilePreviewCore";

export default FilePreviewCore;
