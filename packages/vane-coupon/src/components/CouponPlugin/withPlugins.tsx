import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import { renderPluginSlot, usePluginRuntime } from "vane-plugin-core";
import type { PluginContext, WithPluginsConfig } from "vane-plugin-core";
import type {
  CouponData,
  CouponEligibility,
  CouponOrderContext,
  CouponPhase,
  CouponPlugin,
  CouponPluginContext,
  CouponCoreProps,
  CouponCoreRef,
  CouponSlots,
  CouponValidity,
} from "./plugins/types";

/**
 * withPlugins — 券领域 HOC（接 vane-plugin-core）。
 *
 * 与内核 withPlugins 的差别：内核版不带 extendContext，而券需要把
 * 「相位 / 有效期判定 / 规则展开态」注入上下文供插件读取，故自行装配。
 *
 * 领域状态全部写在内核 state（base.setState）上 —— 写入即触发 context 重建，
 * 插件与 Core 拿到的都是最新值，无需额外的订阅机制。
 *
 * priority 同向：内核「越大越先执行」，渲染插槽内「越大越靠后」，不做反转。
 */
export function withPlugins(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<CouponCoreProps> &
      React.RefAttributes<CouponCoreRef>
  >,
  config: WithPluginsConfig<CouponCoreProps> | CouponPlugin[]
) {
  const normalized: WithPluginsConfig<CouponCoreProps> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<CouponCoreRef, CouponCoreProps>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);

      // 稳定回调：extendContext 每次渲染都会重建（props 变化），但 setPhase / toggleRules
      // 必须保持同一引用，否则插槽 useMemo 无法命中、toggleRules 还会闭包捕获旧 state。
      const stateRef = useRef<Record<string, unknown>>({});
      const setStateRef = useRef<(patch: Record<string, unknown>) => void>(() => {});
      const setPhase = useCallback((next: CouponPhase) => {
        setStateRef.current({ phase: next });
      }, []);
      const toggleRules = useCallback(() => {
        setStateRef.current({
          rulesExpanded: !(stateRef.current.rulesExpanded ?? false),
        });
      }, []);

      // 领域上下文扩展：内核 context + 券领域字段。
      // CouponPluginContext 是内核 context 的超集，结构兼容，返回时按内核签名标注。
      const coupon = props.coupon;
      const order = props.order ?? null;
      const extendContext = useCallback(
        (
          base: PluginContext<CouponCoreProps, unknown>
        ): PluginContext<CouponCoreProps, unknown> => {
          const state = (base.state ?? {}) as Record<string, unknown>;
          const ctx: CouponPluginContext = {
            ...base,
            coupon,
            order,
            phase: (state.phase ?? "available") as CouponPhase,
            setPhase,
            validity: (state.validity ?? null) as CouponValidity | null,
            eligible: (state.eligible ?? null) as CouponEligibility | null,
            quotaReached: state.quotaReached === true,
            rulesExpanded: (state.rulesExpanded ?? false) as boolean,
            toggleRules,
          };
          return ctx;
        },
        [coupon, order, setPhase, toggleRules]
      );

      const runtime = usePluginRuntime<CouponCoreProps, unknown>({
        plugins,
        props,
        data: props.data,
        containerRef,
        extendContext,
        enableDebug,
      });

      // 让稳定回调读到最新 state / setState（渲染期只赋引用，不写 state）
      stateRef.current = runtime.state;
      setStateRef.current = runtime.setState;

      const ctx = runtime.context as unknown as CouponPluginContext;

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as never, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      // onMount：挂载后触发钩子链（内核不自动跑 onMount）。
      // 依赖 orderedPlugins：内核在插件引用变化时会 clear() + registerAll()，
      // 旧实例的 onMount cleanup（倒计时 timer 等）随之执行；新实例必须重新 onMount，
      // 否则「运行时换配置」后倒计时/初始化会永久停摆。
      useEffect(() => {
        void execute("onMount");
      }, [execute, runtime.orderedPlugins]);

      // onUnmount 由内核在卸载的 useLayoutEffect 内统一执行

      // onPropsChange：只在「数据真的变了」时触发。
      // 父组件每次渲染都新建 props 对象是常态，按引用比较会让整条插件链空转
      // （叠加 Quota 无条件 setState 会放大成每帧两次渲染）。
      const prevPropsRef = useRef(props);
      useEffect(() => {
        const prev = prevPropsRef.current;
        if (prev === props) return;
        prevPropsRef.current = props;
        if (
          sameCouponData(prev.coupon, props.coupon) &&
          sameOrder(prev.order, props.order) &&
          prev.data === props.data
        ) {
          return;
        }
        void execute("onPropsChange", prev, props);
      }, [props, execute]);

      // 相位变化 → 领域事件钩子 + 总线广播。首次挂载（prev === undefined）不触发。
      const phase = ctx.phase;
      const prevPhaseRef = useRef<CouponPhase | undefined>(undefined);
      useEffect(() => {
        const prev = prevPhaseRef.current;
        if (prev === undefined) {
          prevPhaseRef.current = phase;
          return;
        }
        if (prev === phase) return;
        prevPhaseRef.current = phase;
        void execute("onPhaseChange", phase, prev);
        runtime.bus.emit("coupon:phase", { phase, prev });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [phase, execute]);

      // 有效期判定结果变化 → 领域事件钩子 + 总线广播（ClaimState 借此联动降级）。
      // 与 phase 不同：validity 首次产出也要触发 —— 挂载即过期的券没有第二次机会。
      const validity = ctx.validity;
      const prevValidityRef = useRef<CouponValidity | null | undefined>(undefined);
      useEffect(() => {
        const prev = prevValidityRef.current;
        prevValidityRef.current = validity;
        if (!validity) return;
        if (prev === validity) return;
        void execute("onValidityChange", validity);
        runtime.bus.emit("coupon:validity", { validity });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [validity, execute]);

      // 逐段插槽：让 Core 能精确排布 before/after/footer/overlay。
      // 渲染钩子只读 state / coupon / order（phase / validity / rulesExpanded 都是 state 派生值），
      // 因此按这三者 memo 即可：父组件无关重渲染不再重跑 14 个插件的渲染钩子与 ErrorBoundary。
      const slots = useMemo<CouponSlots>(
        () => ({
          before: renderPluginSlot(runtime.orderedPlugins, ctx, {
            hook: "renderHeader",
            position: "before",
          }),
          after: renderPluginSlot(runtime.orderedPlugins, ctx, {
            hook: "renderHeader",
            position: "after",
          }),
          footer: renderPluginSlot(runtime.orderedPlugins, ctx, {
            hook: "renderFooter",
          }),
          overlay: renderPluginSlot(runtime.orderedPlugins, ctx, {
            hook: "renderOverlay",
          }),
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.orderedPlugins, ctx.state, ctx.coupon, ctx.order, setPhase, toggleRules]
      );

      const transformedProps = runtime.transformProps(props) as CouponCoreProps;

      const enhancedProps: CouponCoreProps = {
        ...transformedProps,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,

        slots,
        phase: ctx.phase,

        // 用户原始生命周期回调（插件链由上面 useEffect 触发，避免重复）
        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
      };

      return <WrappedComponent ref={ref} {...enhancedProps} />;
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(CouponCore)";
  return WithPluginsComponent;
}

/** 券面数据浅比较：父组件重建同内容对象时不触发 onPropsChange */
function sameCouponData(a: CouponData | undefined, b: CouponData | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => Object.is(a[key], b[key]));
}

/** 订单上下文浅比较（applied / items 数组按引用比较，内容变化由宿主保证引用变化） */
function sameOrder(
  a: CouponOrderContext | undefined,
  b: CouponOrderContext | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) =>
    Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

export type { WithPluginsConfig } from "vane-plugin-core";
