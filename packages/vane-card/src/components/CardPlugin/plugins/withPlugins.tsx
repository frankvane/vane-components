/**
 * withPlugins - HOC 组合器
 * 为 CardCore 注入插件系统，支持插件生命周期管理和钩子执行
 */

import type { CardCoreProps, CardCoreRef } from "../core/CardCore";
import type {
  CardPlugin,
  CardPluginContext,
  CardSize,
  CardState,
  DeviceInfo,
  PluginManager,
} from "./types";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPluginBus } from "./PluginBus";
import { createPluginManager } from "./PluginManager";
import { PluginSlotsProvider } from "./SlotsContext";

export interface WithPluginsConfig<T = any> {
  plugins: CardPlugin<T>[];
  enableDebug?: boolean;
}

// 检测设备信息
function detectDevice(): DeviceInfo {
  const width = typeof window !== "undefined" ? window.innerWidth : 1024;
  const height = typeof window !== "undefined" ? window.innerHeight : 768;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const type: DeviceInfo["type"] = isTablet
    ? "tablet"
    : isMobile
    ? "mobile"
    : "desktop";

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  return {
    type,
    os: ua,
    browser: ua,
    devicePixelRatio: dpr,
    viewportWidth: width,
    viewportHeight: height,
    isTouchDevice,
    isRetina: dpr >= 2,
  };
}

export function withPlugins<T = any>(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<CardCoreProps<T>> & React.RefAttributes<CardCoreRef>
  >,
  config: WithPluginsConfig<T> | CardPlugin<T>[]
) {
  const normalized: WithPluginsConfig<T> = Array.isArray(config)
    ? { plugins: config, enableDebug: false }
    : config;

  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<CardCoreRef, CardCoreProps<T>>(
    (props, ref) => {
      // 插件管理器和事件总线
      const pluginManagerRef = useRef<PluginManager<T>>(
        createPluginManager<T>()
      );
      const pluginManager = pluginManagerRef.current;
      const busRef = useRef(createPluginBus());
      const bus = busRef.current;

      // Refs
      const containerRef = useRef<HTMLDivElement | null>(null);
      const sharedDataRef = useRef<Map<string, any>>(new Map());
      const coreRef = useRef<CardCoreRef>(null);

      // State
      const [cardState, setCardState] = useState<CardState>({
        isHovered: false,
        isVisible: false,
        isActive: false,
        isSelected: false,
        cart: false,
        wishlist: false,
      });

      const [cardSize, setCardSize] = useState<CardSize>({
        width: 0,
        height: 0,
      });

      // 设备信息
      const deviceInfo = useMemo(() => detectDevice(), []);

      // 构造插件上下文
      const pluginContext: CardPluginContext<T> = useMemo(
        () => ({
          cardId: props.cardId,
          data: props.data,
          containerRef,
          getContainer: () => containerRef.current,
          state: cardState,
          setState: (updates: Partial<CardState>) => {
            setCardState((prev) => {
              const next = { ...prev, ...updates };
              // 触发状态变化钩子
              pluginManager
                .executeHook("onStateChange", pluginContext, prev, next)
                .catch(() => {});
              return next;
            });
          },
          size: cardSize,
          props: props as CardCoreProps<T>,
          bus,
          sharedData: sharedDataRef.current,
          deviceInfo,
          forceUpdate: () => coreRef.current?.forceUpdate(),
          getSize: () => coreRef.current?.getSize() || { width: 0, height: 0 },
        }),
        [props, cardState, cardSize, bus, deviceInfo, pluginManager]
      );

      // 注册插件
      const prevPluginNamesRef = useRef<string[]>([]);
      const currentNames = plugins.map((p) => p.name);
      if (
        prevPluginNamesRef.current.length === 0 ||
        prevPluginNamesRef.current.join("|") !== currentNames.join("|")
      ) {
        if (enableDebug) {
          console.debug("[withPlugins] register plugins:", currentNames);
        }
        pluginManager.clear();
        pluginManager.registerAll(plugins);
        prevPluginNamesRef.current = currentNames;
      }

      // Props 变化时触发插件钩子
      const prevPropsRef = useRef(props);
      useEffect(() => {
        const prevProps = prevPropsRef.current;
        if (prevProps !== props) {
          pluginManager
            .executeHook("onPropsChange", pluginContext, prevProps, props)
            .catch(() => {});
          prevPropsRef.current = props;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [props]);

      // transformProps 链式处理
      const transformedProps = useMemo(() => {
        let p = { ...props } as CardCoreProps<T>;
        plugins.forEach((plugin) => {
          if (plugin.hooks.transformProps) {
            p = plugin.hooks.transformProps(p);
          }
        });
        return p;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [props, plugins]);

      // 生命周期钩子注入
      const enhancedProps: CardCoreProps<T> = {
        ...transformedProps,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,

        // 挂载/卸载
        onMount: () => {
          transformedProps.onMount?.();
          pluginManager.executeHook("onMount", pluginContext).catch(() => {});
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
          pluginManager.executeHook("onUnmount", pluginContext).catch(() => {});
        },

        // 点击
        onClick: (event: React.MouseEvent) => {
          transformedProps.onClick?.(event);
          pluginManager
            .executeHook("onClick", pluginContext, event)
            .catch(() => {});
        },

        // 悬停
        onHover: (isHovered: boolean) => {
          setCardState((prev) => ({ ...prev, isHovered }));
          transformedProps.onHover?.(isHovered);
          pluginManager
            .executeHook("onHover", pluginContext, isHovered)
            .catch(() => {});
        },

        // 可见性变化
        onVisibilityChange: (isVisible: boolean) => {
          setCardState((prev) => ({ ...prev, isVisible }));
          transformedProps.onVisibilityChange?.(isVisible);
          pluginManager
            .executeHook("onVisibilityChange", pluginContext, isVisible)
            .catch(() => {});
        },

        // 子元素 + 插件渲染区域（支持位置与顺序控制）
        children: (
          <>
            {/* 头部内容：在 children 之前的 Header */}
            {plugins
              .filter((p) => p.hooks.renderHeader && p.config?.headerPosition === "before")
              .sort((a, b) => (a.config?.order ?? 0) - (b.config?.order ?? 0))
              .map((plugin, idx) => {
                const header = plugin.hooks.renderHeader?.(pluginContext);
                if (!header) return null;
                return (
                  <React.Fragment key={`plugin-header-before-${plugin.name}-${idx}`}>
                    {header}
                  </React.Fragment>
                );
              })}

            {transformedProps.children}

            {/* 插件渲染的覆盖层（通常为绝对定位叠加），保留在 children 之后 */}
            {plugins.map((plugin, idx) => {
              const overlay = plugin.hooks.renderOverlay?.(pluginContext);
              if (!overlay) return null;
              return (
                <React.Fragment key={`plugin-overlay-${plugin.name}-${idx}`}>
                  {overlay}
                </React.Fragment>
              );
            })}

            {/* 头部内容：在 children 之后的 Header（默认） */}
            {plugins
              .filter((p) => p.hooks.renderHeader && p.config?.headerPosition !== "before")
              .sort((a, b) => (a.config?.order ?? 0) - (b.config?.order ?? 0))
              .map((plugin, idx) => {
                const header = plugin.hooks.renderHeader?.(pluginContext);
                if (!header) return null;
                return (
                  <React.Fragment key={`plugin-header-after-${plugin.name}-${idx}`}>
                    {header}
                  </React.Fragment>
                );
              })}

            {/* 插件渲染的底部 */}
            {plugins.map((plugin, idx) => {
              const footer = plugin.hooks.renderFooter?.(pluginContext);
              if (!footer) return null;
              return (
                <React.Fragment key={`plugin-footer-${plugin.name}-${idx}`}>
                  {footer}
                </React.Fragment>
              );
            })}
          </>
        ),
      };

      // 监听尺寸变化
      useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry) return;

          const { width, height } = entry.contentRect;
          setCardSize({ width, height });

          pluginManager
            .executeHook("onResize", pluginContext, width, height)
            .catch(() => {});
        });

        resizeObserver.observe(containerRef.current);

        return () => {
          resizeObserver.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      // 暴露给外部的 ref
      React.useImperativeHandle(ref, () => ({
        getContainer: () => coreRef.current?.getContainer() || null,
        forceUpdate: () => coreRef.current?.forceUpdate(),
        getSize: () => coreRef.current?.getSize() || { width: 0, height: 0 },
      }));

      return (
        <PluginSlotsProvider pluginContext={pluginContext} plugins={plugins}>
          <WrappedComponent ref={coreRef} {...enhancedProps} />
        </PluginSlotsProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(CardCore)";
  return WithPluginsComponent;
}
