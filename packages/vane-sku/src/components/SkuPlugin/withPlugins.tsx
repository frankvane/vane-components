import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { renderPluginSlot, usePluginRuntime } from "vane-plugin-core";
import type { WithPluginsConfig } from "vane-plugin-core";
import { buildAvailability, isSelectionComplete, matchVariant } from "./matrix";
import type {
  SkuPlugin,
  SkuPluginContext,
  SkuSelection,
  SkuSelectorCoreProps,
  SkuSelectorCoreRef,
  SkuSlots,
} from "./plugins/types";

/**
 * withPlugins — SKU 领域 HOC（接 vane-plugin-core）。
 *
 * 与内核 withPlugins 的差别：内核版不带 extendContext，而 SKU 需要把
 * 「选择态 / 禁用集 / 命中变体」注入上下文供插件读取，故自行装配。
 *
 * 选择态写在内核 state（base.setState）上 —— 写入即触发 context 重建，
 * 插件与 Core 拿到的都是最新值，无需额外的订阅机制。
 *
 * priority 同向：内核「越大越先执行」，渲染插槽内「越大越靠后」，不做反转。
 */
export function withPlugins(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<SkuSelectorCoreProps> &
      React.RefAttributes<SkuSelectorCoreRef>
  >,
  config: WithPluginsConfig<SkuSelectorCoreProps> | SkuPlugin[]
) {
  const normalized: WithPluginsConfig<SkuSelectorCoreProps> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<SkuSelectorCoreRef, SkuSelectorCoreProps>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const attributes = props.attributes ?? [];
      const variants = props.variants ?? [];

      // 领域上下文扩展：内核 context + SKU 领域字段。
      // 返回类型放宽到 any：领域 SkuPluginContext 是内核 context 的超集，结构兼容，
      // 仅需绕过类型系统的精确匹配。
      const extendContext = useCallback(
        (base: any): any => {
          const selection = (base.state?.selection ?? {}) as SkuSelection;
          const { disabledMap } = buildAvailability(attributes, variants, selection, {
            ignoreOutOfStock: props.ignoreOutOfStock ?? true,
          });
          const variant = matchVariant(variants, attributes, selection);
          const ctx: SkuPluginContext = {
            ...base,
            selection,
            disabledMap,
            variant,
            isComplete: isSelectionComplete(attributes, selection),
            // 再点一次同值 = 取消该属性的选择
            selectOption: (attrName: string, optionId: string) => {
              const next: SkuSelection =
                selection[attrName] === optionId
                  ? Object.fromEntries(
                      Object.entries(selection).filter(([k]) => k !== attrName)
                    )
                  : { ...selection, [attrName]: optionId };
              base.setState({ selection: next });
            },
            // 整段重置：不逐个 toggle，直接写空 selection
            clearSelection: () => base.setState({ selection: {} }),
          };
          return ctx;
        },
        [props, attributes, variants]
      );

      const runtime = usePluginRuntime<SkuSelectorCoreProps, unknown>({
        plugins: plugins as any,
        props,
        data: props.data,
        // 选择态初值只生效一次（useState 语义），后续一律由 setState 驱动
        initialState: { selection: props.defaultSelection ?? {} },
        containerRef,
        extendContext,
        enableDebug,
      });

      const ctx = runtime.context as unknown as SkuPluginContext;

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

      // 选择/命中变体变化 → 领域事件钩子 + 用户回调 + 总线广播。
      // 首次挂载（prev === null）不触发 onChange，避免一上来就回调。
      const { selection, variant } = ctx;
      const prevSelRef = useRef<SkuSelection | null>(null);
      useEffect(() => {
        const prev = prevSelRef.current;
        prevSelRef.current = selection;
        if (prev === null || prev === selection) return;
        void execute("onSkuChange", selection, variant);
        runtime.bus.emit("sku:change", { attrs: selection, variant });
        props.onChange?.(selection, variant);
        if (variant) props.onValidSkuChange?.(variant);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [selection, variant, execute]);

      // 逐段插槽：让 Core 能精确排布 before/overlay/after/footer
      const slots: SkuSlots = {
        before: renderPluginSlot(runtime.orderedPlugins, ctx, {
          hook: "renderHeader",
          position: "before",
        }),
        overlay: renderPluginSlot(runtime.orderedPlugins, ctx, {
          hook: "renderOverlay",
        }),
        after: renderPluginSlot(runtime.orderedPlugins, ctx, {
          hook: "renderHeader",
          position: "after",
        }),
        footer: renderPluginSlot(runtime.orderedPlugins, ctx, {
          hook: "renderFooter",
        }),
      };

      const transformedProps = runtime.transformProps(props) as SkuSelectorCoreProps;

      const enhancedProps: SkuSelectorCoreProps = {
        ...transformedProps,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,

        slots,
        selection: ctx.selection,
        disabledMap: ctx.disabledMap,
        variant: ctx.variant,
        onSelectOption: ctx.selectOption,

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

  WithPluginsComponent.displayName = "WithPlugins(SkuSelectorCore)";
  return WithPluginsComponent;
}

export type { WithPluginsConfig } from "vane-plugin-core";
