import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { renderPluginSlot, usePluginRuntime } from "vane-plugin-core";
import type { WithPluginsConfig } from "vane-plugin-core";
import type {
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

      // 领域上下文扩展：内核 context + 券领域字段。
      // 返回类型放宽到 any：领域 CouponPluginContext 是内核 context 的超集，结构兼容。
      const extendContext = useCallback(
        (base: any): any => {
          const state = base.state ?? {};
          const ctx: CouponPluginContext = {
            ...base,
            coupon: props.coupon,
            phase: (state.phase ?? "available") as CouponPhase,
            setPhase: (phase: CouponPhase) => base.setState({ phase }),
            validity: (state.validity ?? null) as CouponValidity | null,
            rulesExpanded: state.rulesExpanded ?? false,
            toggleRules: () =>
              base.setState({ rulesExpanded: !(state.rulesExpanded ?? false) }),
          };
          return ctx;
        },
        [props]
      );

      const runtime = usePluginRuntime<CouponCoreProps, unknown>({
        plugins: plugins as any,
        props,
        data: props.data,
        containerRef,
        extendContext,
        enableDebug,
      });

      const ctx = runtime.context as unknown as CouponPluginContext;

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as any, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      // onMount：挂载后触发钩子链（内核不自动跑 onMount）
      useEffect(() => {
        void execute("onMount");
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [execute]);

      // onUnmount 由内核在卸载的 useLayoutEffect 内统一执行

      // onPropsChange
      const prevPropsRef = useRef(props);
      useEffect(() => {
        const prev = prevPropsRef.current;
        if (prev !== props) {
          prevPropsRef.current = props;
          void execute("onPropsChange", prev, props);
        }
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

      // 逐段插槽：让 Core 能精确排布 before/after/footer/overlay
      const slots: CouponSlots = {
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
      };

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

export type { WithPluginsConfig } from "vane-plugin-core";
