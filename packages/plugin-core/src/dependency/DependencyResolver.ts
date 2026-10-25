/**
 * 依赖解析：拓扑排序 + 循环依赖检测 + 优先级感知。
 *
 * 排序语义（内核执行顺序的唯一来源）：
 * 1. 依赖约束绝对优先——被依赖的插件一定先输出；
 * 2. 在「依赖已满足」的候选里选优先级最高的（priority 越大越先）；
 * 3. 平级保持注册顺序（items 的原始顺序）。
 *
 * 即：优先级只在互不依赖的插件之间起作用，永远不会把依赖方排到它的依赖前面。
 */

export interface DepNode {
  name: string;
  dependencies?: string[];
  /** 越大越先执行；平级保持注册顺序 */
  priority?: number;
}

export function resolveDependencyOrder<T extends DepNode>(items: T[]): T[] {
  const byName = new Map(items.map((item) => [item.name, item]));

  // 缺失依赖：预收集一次，避免循环内重复告警
  const missing: string[] = [];
  for (const item of items) {
    for (const dep of item.dependencies ?? []) {
      if (!byName.has(dep)) missing.push(`${item.name} -> ${dep}`);
    }
  }

  const result: T[] = [];
  const emitted = new Set<string>();
  const remaining = [...items];

  const isReady = (item: T) =>
    (item.dependencies ?? []).every((dep) => emitted.has(dep) || !byName.has(dep));

  while (remaining.length > 0) {
    const ready = remaining.filter(isReady);
    if (ready.length === 0) {
      throw new Error(
        `[vane/plugin-core] 插件循环依赖: ${remaining.map((i) => i.name).join(" <-> ")}`
      );
    }
    // 候选中选优先级最高；严格大于保证平级时保持注册顺序
    let best = ready[0];
    for (const item of ready) {
      if ((item.priority ?? 0) > (best.priority ?? 0)) best = item;
    }
    result.push(best);
    emitted.add(best.name);
    remaining.splice(remaining.indexOf(best), 1);
  }

  if (missing.length > 0) {
    console.warn(
      `[vane/plugin-core] 以下插件依赖未注册，将被忽略:\n  ${missing.join("\n  ")}`
    );
  }

  return result;
}
