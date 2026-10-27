/**
 * PluginManager - 插件管理器
 * 负责插件的注册、启用/禁用、钩子执行等
 */

import type {
  CardPlugin,
  CardPluginContext,
  CardPluginHooks,
  PluginManager,
} from "./types";

export function createPluginManager<T = any>(): PluginManager<T> {
  const plugins = new Map<string, CardPlugin<T>>();

  // 注册插件
  const register = (plugin: CardPlugin<T>) => {
    // 检查依赖
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!plugins.has(dep)) {
          console.warn(
            `[PluginManager] plugin ${plugin.name} depends on ${dep}, but it's not registered`
          );
        }
      }
    }

    // 注册插件
    plugins.set(plugin.name, { ...plugin, enabled: plugin.enabled ?? true });

    // 初始化插件
    if (plugin.init) {
      Promise.resolve(plugin.init()).catch((error) => {
        console.warn(`[PluginManager] init failed for ${plugin.name}`, error);
      });
    }
  };

  // 批量注册插件
  const registerAll = (pluginList: CardPlugin<T>[]) => {
    // 按优先级排序（优先级高的先注册）
    const sorted = [...pluginList].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
    for (const plugin of sorted) {
      register(plugin);
    }
  };

  // 注销插件
  const unregister = (pluginName: string) => {
    const plugin = plugins.get(pluginName);
    if (!plugin) return;

    // 销毁插件
    if (plugin.destroy) {
      Promise.resolve(plugin.destroy()).catch((error) => {
        console.warn(
          `[PluginManager] destroy failed for ${plugin.name}`,
          error
        );
      });
    }

    plugins.delete(pluginName);
  };

  // 获取插件
  const getPlugin = (pluginName: string): CardPlugin<T> | undefined => {
    return plugins.get(pluginName);
  };

  // 获取所有插件
  const getAllPlugins = (): CardPlugin<T>[] => {
    return Array.from(plugins.values());
  };

  // 获取启用的插件
  const getEnabledPlugins = (): CardPlugin<T>[] => {
    return Array.from(plugins.values()).filter((p) => p.enabled !== false);
  };

  // 启用插件
  const enablePlugin = (pluginName: string) => {
    const plugin = plugins.get(pluginName);
    if (plugin) {
      plugin.enabled = true;
    }
  };

  // 禁用插件
  const disablePlugin = (pluginName: string) => {
    const plugin = plugins.get(pluginName);
    if (plugin) {
      plugin.enabled = false;
    }
  };

  // 检查插件是否已注册
  const hasPlugin = (pluginName: string): boolean => {
    return plugins.has(pluginName);
  };

  // 执行钩子
  const executeHook = async <K extends keyof CardPluginHooks<T>>(
    hookName: K,
    context: CardPluginContext<T>,
    ...args: any[]
  ): Promise<any> => {
    const enabledPlugins = getEnabledPlugins();

    // 按优先级排序执行
    const sorted = [...enabledPlugins].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );

    for (const plugin of sorted) {
      const hook = plugin.hooks[hookName];
      if (!hook) continue;

      try {
        // @ts-ignore - 动态调用钩子
        const result = await Promise.resolve(hook(context, ...args));

        // 如果钩子返回 false，中止后续执行
        if (result === false) {
          return false;
        }

        // 如果钩子返回非 undefined/true 的值，直接返回该值
        if (result !== undefined && result !== true) {
          return result;
        }
      } catch (error) {
        console.warn(
          `[PluginManager] hook ${String(hookName)} failed in ${plugin.name}`,
          error
        );

        // 如果是 onError 钩子，则不再执行其他插件的 onError
        if (hookName === "onError") {
          break;
        }
      }
    }

    return undefined;
  };

  // 清空所有插件
  const clear = () => {
    // 销毁所有插件
    for (const plugin of plugins.values()) {
      if (plugin.destroy) {
        Promise.resolve(plugin.destroy()).catch((error) => {
          console.warn(
            `[PluginManager] destroy failed for ${plugin.name}`,
            error
          );
        });
      }
    }
    plugins.clear();
  };

  return {
    register,
    registerAll,
    unregister,
    getPlugin,
    getAllPlugins,
    getEnabledPlugins,
    enablePlugin,
    disablePlugin,
    hasPlugin,
    executeHook,
    clear,
  };
}
