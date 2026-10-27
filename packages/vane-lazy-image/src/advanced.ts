/**
 * @module vane-lazy-image/advanced
 * 高级能力：依赖解析（内核）+ 版本比较工具 + 插件沙箱 + 依赖解析器。
 */

export { resolveDependencyOrder, type DepNode } from "vane-plugin-core";

export {
  compareVersions,
  isVersionInRange,
  parseVersion,
  isValidVersion,
  formatVersion,
  isVersionEqual,
  isVersionGreater,
  isVersionLess,
} from "./utils/versionCompare";

// ---------- 插件沙箱 ----------
// 兼容旧版示例 `import { wrapPluginHook, SandboxConfig } from "vane-lazy-image/advanced"`。
// 将一个可能抛错的钩子包装为“沙箱钩子”：执行异常被捕获（不污染其它插件 / 不崩溃应用），
// 可选 hookTimeout 超时保护、debug 时打印告警。
export interface SandboxConfig {
  pluginName?: string;
  enabled?: boolean;
  hookTimeout?: number;
  autoCleanup?: boolean;
  debug?: boolean;
}

export function wrapPluginHook<H extends (...args: any[]) => any>(
  hook: H,
  config?: SandboxConfig
): H {
  const enabled = config?.enabled !== false;
  const timeout = config?.hookTimeout ?? 0;
  return function sandboxedHook(this: any, ...args: any[]) {
    if (!enabled) return hook.apply(this, args);
    if (timeout > 0) {
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
      }, timeout);
      try {
        const result = hook.apply(this, args);
        clearTimeout(timer);
        return result;
      } catch (err) {
        clearTimeout(timer);
        if (config?.debug)
          console.warn(`[sandbox:${config?.pluginName}] 钩子异常已被捕获`, err);
        return undefined;
      }
    }
    try {
      return hook.apply(this, args);
    } catch (err) {
      if (config?.debug)
        console.warn(`[sandbox:${config?.pluginName}] 钩子异常已被捕获`, err);
      return undefined;
    }
  } as H;
}

// ---------- 依赖解析器 ----------
// 兼容旧版示例 `import { DependencyResolver } from "vane-lazy-image/advanced"`。
// 提供插件依赖图的拓扑排序、循环依赖检测、冲突检测、依赖满足性检查。
export class DependencyResolver {
  private nodes = new Map<
    string,
    { deps: string[]; optDeps: string[]; conflicts: string[] }
  >();

  addPlugin(
    name: string,
    deps: string[] = [],
    optDeps: string[] = [],
    conflicts: string[] = []
  ): void {
    this.nodes.set(name, {
      deps: [...deps],
      optDeps: [...optDeps],
      conflicts: [...conflicts],
    });
  }

  /** 检测循环依赖，返回所有环（每个环是节点名数组）。 */
  detectCycles(): string[][] {
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const stack: string[] = [];
    const cycles: string[][] = [];

    const dfs = (node: string) => {
      if (inStack.has(node)) {
        const idx = stack.indexOf(node);
        if (idx >= 0) cycles.push([...stack.slice(idx), node]);
        return;
      }
      if (visited.has(node)) return;
      visited.add(node);
      inStack.add(node);
      stack.push(node);
      const n = this.nodes.get(node);
      const edges = n ? [...n.deps, ...n.optDeps] : [];
      for (const dep of edges) {
        if (this.nodes.has(dep)) dfs(dep);
      }
      stack.pop();
      inStack.delete(node);
    };

    for (const name of this.nodes.keys()) dfs(name);
    // 去重（同一环的多种起始点）
    const seen = new Set<string>();
    const unique: string[][] = [];
    for (const cyc of cycles) {
      const key = [...cyc].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(cyc);
      }
    }
    return unique;
  }

  /** 拓扑排序：给定需要排序的节点名，返回合法的加载顺序（空数组表示失败/存在环）。 */
  getTopologicalOrder(names: string[]): string[] {
    if (this.detectCycles().length > 0) return [];
    const indeg = new Map<string, number>();
    for (const name of names) indeg.set(name, 0);
    for (const name of names) {
      const n = this.nodes.get(name);
      if (!n) continue;
      for (const dep of n.deps) {
        if (indeg.has(dep)) indeg.set(dep, (indeg.get(dep) || 0) + 1);
      }
    }
    const queue: string[] = [];
    for (const [name, d] of indeg) if (d === 0) queue.push(name);
    queue.sort();
    const order: string[] = [];
    while (queue.length) {
      const cur = queue.shift()!;
      order.push(cur);
      const n = this.nodes.get(cur);
      if (!n) continue;
      for (const dep of n.deps) {
        if (!indeg.has(dep)) continue;
        const nd = (indeg.get(dep) || 0) - 1;
        indeg.set(dep, nd);
        if (nd === 0) {
          // 插入并保持稳定顺序
          queue.push(dep);
          queue.sort();
        }
      }
    }
    return order.length === names.length ? order : [];
  }

  /** 检查某插件与当前已装载集合是否存在冲突。 */
  checkConflicts(
    name: string,
    present: Set<string>
  ): { hasConflict: boolean; conflicts: string[] } {
    const n = this.nodes.get(name);
    if (!n) return { hasConflict: false, conflicts: [] };
    const conflicts = n.conflicts.filter((c) => present.has(c));
    return { hasConflict: conflicts.length > 0, conflicts };
  }

  /** 检查某插件的依赖是否已被满足。 */
  checkDependencies(
    name: string,
    present: Set<string>
  ): { satisfied: boolean; missing: string[] } {
    const n = this.nodes.get(name);
    if (!n) return { satisfied: true, missing: [] };
    const missing = n.deps.filter((d) => !present.has(d));
    return { satisfied: missing.length === 0, missing };
  }
}
