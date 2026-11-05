import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import {
  PluginErrorBoundary,
  renderPluginSlot,
  usePluginRuntime,
} from "vane-plugin-core";
import type { PluginContext, WithPluginsConfig } from "vane-plugin-core";
import {
  buildAvailability,
  isPurchasable,
  isSelectionComplete,
  matchVariant,
} from "./matrix";
import { isSameSelection, normalizeSelection, normalizeSkuData } from "./normalize";
import type {
  SkuPlugin,
  SkuPluginContext,
  SkuSelection,
  SkuSelectorCoreProps,
  SkuSelectorCoreRef,
  SkuSlots,
} from "./plugins/types";

/** 入参缺省时的稳定空数组：避免每次渲染新建引用而击穿依赖比较（P2-4） */
const EMPTY_ATTRIBUTES: NonNullable<SkuSelectorCoreProps["attributes"]> = [];
const EMPTY_VARIANTS: NonNullable<SkuSelectorCoreProps["variants"]> = [];

/** props 浅比较：父组件内联 props 时不再每次渲染都跑一遍插件 onPropsChange（P2-8） */
function shallowEqualProps(
  a: SkuSelectorCoreProps,
  b: SkuSelectorCoreProps
): boolean {
  if (a === b) return true;
  const aKeys = Object.keys(a) as (keyof SkuSelectorCoreProps)[];
  const bKeys = Object.keys(b) as (keyof SkuSelectorCoreProps)[];
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}

/**
 * withPlugins — SKU 领域 HOC（接 vane-plugin-core）。
 *
 * 与内核 withPlugins 的差别：内核版不带 extendContext，而 SKU 需要把
 * 「选择态 / 禁用集 / 命中变体」注入上下文供插件读取，故自行装配。
 *
 * 选择态写在内核 state（base.setState）上 —— 写入即触发 context 重建，
 * 插件与 Core 拿到的都是最新值，无需额外的订阅机制。
 *
 * 外部输入（attributes / variants / defaultSelection / URL / localStorage）一律先归一化：
 * 形状缺失不再抛 TypeError（P0-3），非法选择值不再把矩阵拖死（P0-1）。
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
  const defaultPlugins = normalized.plugins;
  const { enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<SkuSelectorCoreRef, SkuSelectorCoreProps>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);

      // 数据归一化：补齐缺失字段 / 过滤非法元素 / 去重（P0-3 / P2-3）。
      // 结果按入参引用缓存，避免每次渲染重建数组与变体对象。
      const skuData = useMemo(
        () =>
          normalizeSkuData(
            props.attributes ?? EMPTY_ATTRIBUTES,
            props.variants ?? EMPTY_VARIANTS
          ),
        [props.attributes, props.variants]
      );
      const { attributes, variants, issues } = skuData;

      useEffect(() => {
        if (!issues.length) return;
        console.warn(
          "[vane-sku] 规格数据存在异常，已按归一化结果渲染：",
          issues.join("；")
        );
      }, [issues]);

      // 受控模式（P1-2）：传了 selection 就以 props 为准
      const isControlled = props.selection !== undefined;
      const ignoreOutOfStock = props.ignoreOutOfStock ?? true;
      const onSelectionChange = props.onSelectionChange;

      // 插件可运行时替换（P2-6）：未传则用装配时绑定的那一组
      const plugins = props.plugins ?? defaultPlugins;

      // 归一化选择态的引用缓存：context 每次重建都会重新调用 extendContext，
      // 若每次都产出新对象，下游「selection 变化 → onSkuChange」的引用比较会无限自激。
      // 以 (原始 state.selection, attributes) 为缓存键，保证同一份输入产出同一个引用。
      const selectionCacheRef = useRef<{
        source: unknown;
        attributes: SkuPluginContext["attributes"];
        value: SkuSelection;
      } | null>(null);
      const stableSelectionOf = useCallback(
        (raw: unknown): SkuSelection => {
          const cached = selectionCacheRef.current;
          if (cached && cached.source === raw && cached.attributes === attributes) {
            return cached.value;
          }
          const value = normalizeSelection(attributes, raw as SkuSelection);
          selectionCacheRef.current = { source: raw, attributes, value };
          return value;
        },
        [attributes]
      );

      // 禁用推导缓存（P2-4）：O(A·O·V) 的矩阵只在
      // [attributes, variants, selection, ignoreOutOfStock] 变化时重算
      const availabilityCacheRef = useRef<{
        attributes: SkuPluginContext["attributes"];
        variants: SkuPluginContext["variants"];
        selection: SkuSelection;
        ignoreOutOfStock: boolean;
        value: { disabledMap: Record<string, Set<string>> };
      } | null>(null);
      const availabilityOf = useCallback(
        (selection: SkuSelection) => {
          const cached = availabilityCacheRef.current;
          if (
            cached &&
            cached.attributes === attributes &&
            cached.variants === variants &&
            cached.selection === selection &&
            cached.ignoreOutOfStock === ignoreOutOfStock
          ) {
            return cached.value;
          }
          const value = buildAvailability(attributes, variants, selection, {
            ignoreOutOfStock,
          });
          availabilityCacheRef.current = {
            attributes,
            variants,
            selection,
            ignoreOutOfStock,
            value,
          };
          return value;
        },
        [attributes, variants, ignoreOutOfStock]
      );

      // 领域上下文扩展：内核 context + SKU 领域字段。
      // 领域 SkuPluginContext 是内核 context 的超集，结构兼容，
      // 返回时按内核签名标注，避免显式 any。
      const extendContext = useCallback(
        (
          base: PluginContext<SkuSelectorCoreProps, unknown>
        ): PluginContext<SkuSelectorCoreProps, unknown> => {
          const selection = stableSelectionOf(base.state?.selection);
          const { disabledMap } = availabilityOf(selection);
          const variant = matchVariant(variants, attributes, selection);
          const purchasable = isPurchasable(variant, { ignoreOutOfStock });

          // 选择态的唯一写入口：写前归一化，受控模式下额外回传宿主
          const commitSelection = (nextInput: SkuSelection) => {
            const next = normalizeSelection(attributes, nextInput);
            base.setState({ selection: next });
            if (isControlled) {
              onSelectionChange?.(
                next,
                matchVariant(variants, attributes, next)
              );
            }
          };

          const ctx: SkuPluginContext = {
            ...base,
            // 插件写 state 同样过白名单：UrlSync / StatePersistence 的原始键值
            // 不会再原样落进 selection（P0-1）
            setState: (patch: Record<string, unknown>) => {
              if (patch && "selection" in patch) {
                return base.setState({
                  ...patch,
                  selection: normalizeSelection(
                    attributes,
                    patch.selection as SkuSelection
                  ),
                });
              }
              return base.setState(patch);
            },
            selection,
            attributes,
            variants,
            ignoreOutOfStock,
            disabledMap,
            variant,
            purchasable,
            isComplete: isSelectionComplete(attributes, selection),
            // 再点一次同值 = 取消该属性的选择
            selectOption: (attrName: string, optionId: string) => {
              commitSelection(
                selection[attrName] === optionId
                  ? Object.fromEntries(
                      Object.entries(selection).filter(([k]) => k !== attrName)
                    )
                  : { ...selection, [attrName]: optionId }
              );
            },
            // 整段重置：不逐个 toggle，直接写空 selection
            clearSelection: () => commitSelection({}),
            // 外部来源整段写入（同样走归一化）
            setSelection: (next: SkuSelection) => commitSelection(next),
          };
          return ctx as unknown as PluginContext<
            SkuSelectorCoreProps,
            unknown
          >;
        },
        [
          attributes,
          variants,
          ignoreOutOfStock,
          isControlled,
          onSelectionChange,
          stableSelectionOf,
          availabilityOf,
        ]
      );

      const runtime = usePluginRuntime<SkuSelectorCoreProps, unknown>({
        plugins,
        props,
        data: props.data,
        // 选择态初值只生效一次（useState 语义），后续一律由 setState 驱动。
        // 初值同样归一化，脏 defaultValue 不会让矩阵死锁（P0-1）。
        initialState: {
          selection: normalizeSelection(
            attributes,
            props.selection ?? props.defaultSelection ?? {}
          ),
        },
        containerRef,
        extendContext,
        enableDebug,
      });

      const ctx = runtime.context as unknown as SkuPluginContext;
      const { selection, variant, purchasable } = ctx;

      // 受控同步：props.selection 变化写回内核 state，保证父级重置 / 异步预选生效。
      // 用等价比较挡住重复写入，避免 setState → 渲染 → 再同步的循环（P1-2）。
      const stateSelection = runtime.state.selection as SkuSelection | undefined;
      const setRuntimeState = runtime.setState;
      useEffect(() => {
        if (!isControlled) return;
        const next = normalizeSelection(attributes, props.selection);
        if (isSameSelection(stateSelection, next)) return;
        setRuntimeState({ selection: next });
      }, [isControlled, props.selection, attributes, setRuntimeState, stateSelection]);

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as never, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      // onMount：挂载后触发钩子链（内核不自动跑 onMount）。
      // 插件数组被替换时对新注册的实例补跑一次，否则 KeyboardNav 的监听会丢失（P2-6）。
      const mountedPluginsRef = useRef<SkuPlugin[]>([]);
      const didMountRef = useRef(false);
      useEffect(() => {
        const prev = mountedPluginsRef.current;
        mountedPluginsRef.current = plugins;
        const same =
          prev.length === plugins.length &&
          plugins.every((plugin, index) => plugin === prev[index]);
        if (same && didMountRef.current) return;
        didMountRef.current = true;
        void execute("onMount");
      }, [plugins, execute]);

      // onUnmount 由内核在卸载的 useLayoutEffect 内统一执行

      // onPropsChange：浅比较后再触发，父组件内联 props 时不再每次渲染都跑钩子链（P2-8）
      const prevPropsRef = useRef(props);
      useEffect(() => {
        const prev = prevPropsRef.current;
        if (shallowEqualProps(prev, props)) return;
        prevPropsRef.current = props;
        void execute("onPropsChange", prev, props);
      }, [props, execute]);

      // 选择 / 命中变体变化 → 领域事件钩子 + 用户回调 + 总线广播。
      // 首次挂载（prev === null）不触发回调，避免一上来就回调。
      // 变体数据变化（库存轮询把 stock 改成 0）也要通知：否则 onValidSkuChange 会继续
      // 把缺货变体当成「有效 SKU」抛给宿主（P1-1 / P0-2 的数量重收敛依赖于此）。
      const prevSelRef = useRef<SkuSelection | null>(null);
      const prevVariantRef = useRef<SkuPluginContext["variant"] | undefined>(
        undefined
      );
      useEffect(() => {
        const prevSelection = prevSelRef.current;
        const prevVariant = prevVariantRef.current;
        prevSelRef.current = selection;
        prevVariantRef.current = variant;

        if (prevSelection === null || prevVariant === undefined) return;
        if (prevSelection === selection && prevVariant === variant) return;

        void execute("onSkuChange", selection, variant);
        runtime.bus.emit("sku:change", { attrs: selection, variant });
        props.onChange?.(selection, variant);
        // 只在可售时宣告「有效 SKU」：缺货变体不再触发（P1-1）
        if (variant && purchasable) props.onValidSkuChange?.(variant);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [selection, variant, purchasable, execute]);

      // 逐段插槽：让 Core 能精确排布 before/overlay/after/footer。
      // 按「插件 / context」缓存，父组件无关重渲染不再重跑所有渲染钩子（P2-4）。
      const slots: SkuSlots = useMemo(
        () => ({
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
        }),
        [runtime.orderedPlugins, ctx]
      );

      const transformedProps = runtime.transformProps(props) as SkuSelectorCoreProps;

      const enhancedProps: SkuSelectorCoreProps = {
        ...transformedProps,
        // 归一化后的数据才是渲染与推导的事实来源
        attributes,
        variants,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,

        slots,
        selection,
        disabledMap: ctx.disabledMap,
        variant,
        purchasable,
        onSelectOption: ctx.selectOption,

        // 用户原始生命周期回调（插件链由上面 useEffect 触发，避免重复）
        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
      };

      // 数据修正后允许错误边界自愈：key 随归一化结果变化而重置（P0-3）
      const boundaryKeyRef = useRef(0);
      const prevSkuDataRef = useRef(skuData);
      if (prevSkuDataRef.current !== skuData) {
        prevSkuDataRef.current = skuData;
        boundaryKeyRef.current += 1;
      }

      return (
        <PluginErrorBoundary
          key={boundaryKeyRef.current}
          fallback={() => (
            <div
              data-testid="sku-error"
              style={{ fontSize: 12, color: "#b32d08", padding: "6px 0" }}
            >
              规格信息加载异常，请稍后重试
            </div>
          )}
        >
          <WrappedComponent ref={ref} {...enhancedProps} />
        </PluginErrorBoundary>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(SkuSelectorCore)";
  return WithPluginsComponent;
}

export type { WithPluginsConfig } from "vane-plugin-core";
