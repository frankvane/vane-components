/**
 * 依赖解析：拓扑排序 + 循环依赖检测。
 * 旧仓库里 card 没有这层，lazy-image 有——现在统一收进内核。
 */

export interface DepNode {
  name: string;
  dependencies?: string[];
}

export function resolveDependencyOrder<T extends DepNode>(items: T[]): T[] {
  const byName = new Map(items.map((item) => [item.name, item]));
  const result: T[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const missing: string[] = [];

  const visit = (item: T, chain: string[]) => {
    if (visited.has(item.name)) return;
    if (visiting.has(item.name)) {
      throw new Error(
        `[vane/plugin-core] 插件循环依赖: ${[...chain, item.name].join(" -> ")}`
      );
    }
    visiting.add(item.name);
    for (const dep of item.dependencies ?? []) {
      const target = byName.get(dep);
      if (!target) {
        missing.push(`${item.name} -> ${dep}`);
        continue;
      }
      visit(target, [...chain, item.name]);
    }
    visiting.delete(item.name);
    visited.add(item.name);
    result.push(item);
  };

  for (const item of items) visit(item, []);

  if (missing.length > 0) {
    console.warn(
      `[vane/plugin-core] 以下插件依赖未注册，将被忽略:\n  ${missing.join("\n  ")}`
    );
  }

  return result;
}
