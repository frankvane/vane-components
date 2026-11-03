import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ActivityCoreProps, ActivityCoreRef, ActivityData } from "./plugins/types";
import { useActivitySlot } from "./plugins/slots";

/**
 * ActivityCore - 营销活动核心组件（活动领域容器）。
 *
 * 铁律：核心只做「语义布局骨架 + 生命周期转发 + 六个领域槽位渲染」，所有可视区块
 * 交给插件。
 *   头部（renderHeader）→ 顶部（renderProgress）→ 任务清单（renderTasks）
 *   → 奖励领取（renderRewards）→ 规则折叠（renderRules）→ 底部（renderFooter）
 *   → 浮层（renderOverlay，绝对定位叠加）。
 *
 * 领域槽由 Core 经 useActivitySlot 直接消费；插件通过 useActivityContext 拿到
 * tasks / rewards / progress / claim 等派生数据。
 */
const ActivityCore = forwardRef<ActivityCoreRef, ActivityCoreProps>(
  function ActivityCore(props, ref) {
    const {
      data,
      containerClassName,
      containerStyle,
      containerRefExternal,
      emptyText = "活动暂未开始",
      loading,
      onMount,
      onUnmount,
    } = props;

    const internalRef = useRef<HTMLDivElement>(null);
    const containerRef = containerRefExternal || internalRef;
    const [, forceTick] = useState(0);
    const forceUpdate = React.useCallback(() => forceTick((t) => t + 1), []);

    const headerSlot = useActivitySlot("renderHeader");
    const progressSlot = useActivitySlot("renderProgress");
    const tasksSlot = useActivitySlot("renderTasks");
    const rewardsSlot = useActivitySlot("renderRewards");
    const rulesSlot = useActivitySlot("renderRules");
    const footerSlot = useActivitySlot("renderFooter");
    const overlaySlot = useActivitySlot("renderOverlay");

    useImperativeHandle(
      ref,
      () => ({
        getContainer: () => containerRef.current,
        forceUpdate,
        getSize: () => {
          const el = containerRef.current;
          return el
            ? { width: el.offsetWidth, height: el.offsetHeight }
            : { width: 0, height: 0 };
        },
      }),
      // P2-14：containerRef 切换后 ref 必须读到新容器，不能只依赖 forceUpdate。
      [forceUpdate, containerRef]
    );

    // P2-14：用 ref 保存最新回调，effect 保持单次挂载/卸载，但不再使用首次闭包。
    const onMountRef = useRef(onMount);
    const onUnmountRef = useRef(onUnmount);
    onMountRef.current = onMount;
    onUnmountRef.current = onUnmount;
    useEffect(() => {
      onMountRef.current?.();
      return () => onUnmountRef.current?.();
    }, []);

    const activity = data as ActivityData | undefined;
    // P1-5：接口/低代码数据可能缺 tasks 或类型不对，不能让核心渲染直接 TypeError。
    const tasks = Array.isArray(activity?.tasks) ? activity.tasks : [];
    const hasTasks = tasks.length > 0;

    return (
      <div
        ref={containerRef}
        className={`vc-activity ${containerClassName || ""}`}
        style={{
          position: "relative",
          boxSizing: "border-box",
          /*
           * 根节点自带浅底 + 深字（ADR-13）。次级文字按浅色底配，组件内联 background
           * 必须同时内联 color，避免继承到深色宿主而看不见。
           */
          background: "#fff",
          color: "#1f2328",
          fontFamily: "inherit",
          padding: 16,
          ...containerStyle,
        }}
      >
        {headerSlot.length > 0 && (
          <div className="va-header" style={{ marginBottom: 12 }}>
            {headerSlot}
          </div>
        )}

        {progressSlot.length > 0 && (
          <div className="va-hero" style={{ marginBottom: 12 }}>
            {progressSlot}
          </div>
        )}

        {loading && (
          <div
            className="va-loading"
            style={{ padding: "12px 0", textAlign: "center", color: "#6b6b6b" }}
          >
            加载中…
          </div>
        )}

        {!loading && !hasTasks && (
          <div
            className="va-empty"
            style={{ padding: "24px 0", textAlign: "center", color: "#6b6b6b" }}
          >
            {emptyText}
          </div>
        )}

        {!loading && hasTasks && (
          <>
            {tasksSlot.length > 0 && (
              <div className="va-tasks" style={{ marginBottom: 12 }}>
                {tasksSlot}
              </div>
            )}
            {rewardsSlot.length > 0 && (
              <div className="va-rewards" style={{ marginBottom: 12 }}>
                {rewardsSlot}
              </div>
            )}
          </>
        )}

        {/* P2-3：规则槽不依赖任务，空任务活动也要能展示规则 */}
        {!loading && rulesSlot.length > 0 && (
          <div className="va-rules">{rulesSlot}</div>
        )}

        {footerSlot.length > 0 && (
          <div className="va-footer" style={{ marginTop: 12 }}>
            {footerSlot}
          </div>
        )}

        {overlaySlot.length > 0 && (
          /*
           * P2-4：浮层默认 pointer-events:none，保证不挡下层交互。
           * 需要可点击/可输入的浮层插件必须在自身根节点显式覆盖 pointerEvents。
           */
          <div
            className="va-overlay"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {overlaySlot}
          </div>
        )}
      </div>
    );
  }
);

ActivityCore.displayName = "ActivityCore";

export default ActivityCore;
