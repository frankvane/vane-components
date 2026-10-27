/**
 * 插件管理器
 * 负责插件的注册、注销和钩子执行
 */

import type {
  FileInfo,
  FilePreviewPlugin,
  PluginContext,
  PluginHooks,
  PluginManager,
} from "./types";

export function createPluginManager(): PluginManager {
  const plugins = new Map<string, FilePreviewPlugin>();

  const register = (plugin: FilePreviewPlugin) => {
    plugins.set(plugin.name, plugin);
    if (plugin.init) {
      Promise.resolve(plugin.init()).catch((error) => {
        console.warn(`[PluginManager] init failed for ${plugin.name}`, error);
      });
    }
  };

  const unregister = (pluginName: string) => {
    const plugin = plugins.get(pluginName);
    if (!plugin) return;
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

  const getPlugin = (pluginName: string): FilePreviewPlugin | undefined =>
    plugins.get(pluginName);

  const getAllPlugins = (): FilePreviewPlugin[] => Array.from(plugins.values());

  /**
   * 根据文件信息查找最适合的插件
   * 基于 canHandle 和 getPriority
   */
  const findPluginForFile = async (
    file: FileInfo
  ): Promise<FilePreviewPlugin | null> => {
    const list = Array.from(plugins.values());
    const candidates: Array<{ plugin: FilePreviewPlugin; priority: number }> =
      [];

    for (const plugin of list) {
      // 检查是否支持该文件类型
      const canHandle = plugin.hooks.canHandle
        ? await Promise.resolve(plugin.hooks.canHandle(file))
        : checkDefaultSupport(plugin, file);

      if (!canHandle) continue;

      // 获取优先级
      const priority = plugin.hooks.getPriority
        ? plugin.hooks.getPriority(file)
        : 0;

      candidates.push({ plugin, priority });
    }

    // 按优先级排序，返回优先级最高的
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates[0].plugin;
  };

  /**
   * 默认支持检查：基于 supportedTypes 和 supportedExtensions
   */
  const checkDefaultSupport = (
    plugin: FilePreviewPlugin,
    file: FileInfo
  ): boolean => {
    const { supportedTypes, supportedExtensions } = plugin;

    if (supportedTypes && supportedTypes.length > 0) {
      if (supportedTypes.some((type) => matchMimeType(file.type, type))) {
        return true;
      }
    }

    if (supportedExtensions && supportedExtensions.length > 0) {
      if (
        supportedExtensions.some((ext) =>
          file.extension.toLowerCase().endsWith(ext.toLowerCase())
        )
      ) {
        return true;
      }
    }

    return false;
  };

  /**
   * MIME type 匹配（支持通配符）
   */
  const matchMimeType = (fileType: string, pattern: string): boolean => {
    if (pattern === "*/*") return true;
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      return fileType.startsWith(prefix);
    }
    return fileType === pattern;
  };

  /**
   * 执行钩子
   *
   * 注意这里是**动态派发**：`hookName` 是联合类型的键，各钩子的签名互不相同
   * （`canHandle(file)` / `renderOverlay(ctx)` / `onLoadError(ctx, err)`），
   * TS 无法把「键」和「参数列表」关联起来。迁移前用 `@ts-ignore` 压掉，
   * 这里改成显式把钩子断言成「统一调用签名」—— 同样是放宽，但放宽的位置可见，
   * 而且不会在将来某天类型开始报错时被 `@ts-ignore` 静默吞掉。
   *
   * P2 会删掉这个文件（换内核的 `executeHooks`），这段只是过渡。
   */
  const executeHook = async <K extends keyof PluginHooks>(
    hookName: K,
    context: PluginContext,
    ...args: any[]
  ): Promise<any> => {
    const list = Array.from(plugins.values());
    for (const plugin of list) {
      const hook = plugin.hooks[hookName] as
        | ((ctx: PluginContext, ...rest: any[]) => unknown)
        | undefined;
      if (!hook) continue;
      try {
        const result = await Promise.resolve(hook(context, ...args));

        // 返回 false 表示中止后续执行
        if (result === false) {
          return false;
        }

        // 非 undefined 的返回值直接返回
        if (result !== undefined && result !== true) {
          return result;
        }
      } catch (error) {
        console.warn(
          `[PluginManager] hook ${String(hookName)} failed in ${plugin.name}`,
          error
        );
      }
    }
    return undefined;
  };

  return {
    register,
    unregister,
    getPlugin,
    getAllPlugins,
    findPluginForFile,
    executeHook,
  };
}
