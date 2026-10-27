/**
 * withPlugins HOC
 * 为 FilePreviewCore 注入插件系统
 */

import type {
  FilePreviewCoreProps,
  FilePreviewCoreRef,
} from "../core/FilePreviewCore";
import type {
  FilePreviewPlugin,
  PluginContext,
  PluginManager,
  PreviewStateInfo,
} from "./types";
import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";

import { createPluginBus } from "./PluginBus";
import { createPluginManager } from "./PluginManager";

export interface WithPluginsConfig {
  plugins: FilePreviewPlugin[];
  enableDebug?: boolean;
}

export function withPlugins(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<FilePreviewCoreProps> &
      React.RefAttributes<FilePreviewCoreRef>
  >,
  config: WithPluginsConfig | FilePreviewPlugin[]
) {
  const normalized: WithPluginsConfig = Array.isArray(config)
    ? { plugins: config, enableDebug: false }
    : config;

  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<
    FilePreviewCoreRef,
    FilePreviewCoreProps
  >((props, ref) => {
    const { file } = props;

    // 插件管理
    const pluginManagerRef = useRef<PluginManager>(createPluginManager());
    const pluginManager = pluginManagerRef.current;
    const busRef = useRef(createPluginBus());
    const bus = busRef.current;

    // refs
    const containerRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    // 使用 useState 确保 sharedData Map 实例在组件生命周期内保持稳定
    const [sharedData] = useState<Map<string, any>>(() => {
      const map = new Map();
      return map;
    });
    const sharedDataRef = useRef(sharedData);

    // 状态
    const [state, setState] = useState<PreviewStateInfo>({
      state: "idle",
    });

    // 当前活动插件
    const [activePlugin, setActivePlugin] = useState<FilePreviewPlugin | null>(
      null
    );

    // 注册插件
    useEffect(() => {
      plugins.forEach((plugin) => {
        pluginManager.register(plugin);
      });

      return () => {
        plugins.forEach((plugin) => pluginManager.unregister(plugin.name));
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plugins]);

    // 查找适合的插件
    useEffect(() => {
      const findPlugin = async () => {
        const plugin = await pluginManager.findPluginForFile(file);
        setActivePlugin(plugin);

        if (!plugin) {
          setState({
            state: "unsupported",
            message: `No plugin found for file type: ${file.type}`,
          });
        }
      };

      findPlugin();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    // 调试日志
    useEffect(() => {
      if (enableDebug) {
        const names = plugins.map((p) => p.name);
        console.debug("[withPlugins] active plugins:", names);
        console.debug(
          "[withPlugins] active plugin for file:",
          activePlugin?.name
        );
      }
    }, [enableDebug, plugins, activePlugin]);

    // 构造插件上下文
    const pluginContext: PluginContext = useMemo(() => {
      const context = {
        file,
        state,
        containerRef,
        contentRef,
        bus,
        sharedData: sharedData,
      };
      return context;
    }, [file, state, bus, sharedData]);

    // 生命周期钩子
    useEffect(() => {
      const cleanups: Array<void | (() => void)> = [];
      plugins.forEach((plugin) => {
        const cleanup = plugin.hooks.onMount?.(pluginContext);
        if (cleanup) cleanups.push(cleanup);
      });

      return () => {
        plugins.forEach((plugin) => plugin.hooks.onUnmount?.(pluginContext));
        cleanups.forEach((fn) => typeof fn === "function" && fn());
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 渲染聚合
    const pluginRenders = useMemo(() => {
      if (!activePlugin) return null;

      const node = activePlugin.hooks.render?.(pluginContext);
      if (!node) return null;

      return (
        <React.Fragment key={`plugin-render-${activePlugin.name}`}>
          {node}
        </React.Fragment>
      );
    }, [pluginContext, activePlugin]);

    // 强制重新渲染的状态
    const [toolbarUpdateKey, setToolbarUpdateKey] = useState(0);

    // 监听 sharedData 变化
    useEffect(() => {
      const handleSharedDataChange = () => {
        setToolbarUpdateKey((prev) => prev + 1);
      };

      // 监听 sharedData 变化事件
      const unsubscribe = bus?.on("sharedDataChanged", handleSharedDataChange);

      return () => {
        unsubscribe?.();
      };
    }, [bus]);

    // 工具栏渲染 - 只显示当前激活插件的工具栏
    const pluginToolbars = useMemo(() => {
      if (!activePlugin) return null;

      const node = activePlugin.hooks.renderToolbar?.(pluginContext);
      if (!node) return null;

      return (
        <React.Fragment
          key={`plugin-toolbar-${activePlugin.name}-${toolbarUpdateKey}`}
        >
          {node}
        </React.Fragment>
      );
    }, [pluginContext, activePlugin, toolbarUpdateKey]);

    // 针对 PDF 插件，禁用外层滚动，仅保留内嵌查看器的滚动
    const isPdfPlugin = activePlugin?.name === "PdfPreviewPlugin";

    // 叠加层渲染
    const pluginOverlays = useMemo(() => {
      return plugins
        .map((plugin, idx) => {
          const node = plugin.hooks.renderOverlay?.(pluginContext);
          if (!node) return null;
          return (
            <React.Fragment key={`plugin-overlay-${plugin.name}-${idx}`}>
              {node}
            </React.Fragment>
          );
        })
        .filter(Boolean);
    }, [pluginContext, plugins]);

    // 增强的 props
    const enhancedProps: FilePreviewCoreProps = {
      ...props,
      containerRefExternal: containerRef,
      contentRefExternal: contentRef,
      children: (
        <>
          {pluginToolbars && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                display: "flex",
                gap: 8,
                padding: 8,
                background: "rgba(255, 255, 255, 0.95)",
                borderBottom: "1px solid #e0e0e0",
                flexShrink: 0,
                backdropFilter: "blur(8px)",
              }}
            >
              {pluginToolbars}
            </div>
          )}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "100%",
                overflow: isPdfPlugin ? "hidden" : "auto",
                overscrollBehavior: isPdfPlugin ? "none" : "contain",
                boxSizing: "border-box",
              }}
            >
              {pluginRenders}
            </div>
            {pluginOverlays}
            {props.children}
          </div>
        </>
      ),
      onBeforeLoad: async () => {
        const result = await pluginManager.executeHook(
          "onBeforeLoad",
          pluginContext
        );
        return result !== false;
      },
      onLoadStart: () => {
        setState({ state: "loading" });
        pluginManager.executeHook("onLoadStart", pluginContext).catch(() => {});
      },
      onLoadSuccess: () => {
        setState({ state: "loaded" });
        pluginManager
          .executeHook("onLoadSuccess", pluginContext)
          .catch(() => {});
      },
      onLoadError: (error) => {
        setState({
          state: "error",
          error,
          message: error.message,
        });
        pluginManager
          .executeHook("onLoadError", pluginContext, error)
          .catch(() => {});
      },
    };

    return <WrappedComponent ref={ref} {...enhancedProps} />;
  });

  WithPluginsComponent.displayName = "WithPlugins(FilePreviewCore)";
  return WithPluginsComponent;
}
