/**
 * 独占槽位去重（装配期纯函数，不依赖 React）。
 *
 * 规则：按内核执行序（priority 降序）扫描插件；插件声明了 exclusiveSlots 时，
 * 若其中任一槽位已被更高 priority 的独占者占走，则该插件被「整体丢弃」；
 * 否则登记它声明的全部槽位。未声明独占的插件永不丢弃（同槽位可与独占者共存，
 * 但独占者之间的竞争只留一个，避免 TaskList/TaskGrid 双渲染任务区这类重影）。
 *
 * 丢弃发生在 withPlugins 装配期（组件外，每次调用只算一次），被丢弃的插件不进
 * 内核运行时——它的所有钩子（含 transformData 等副作用链）一并失效。
 */

import type { ActivityPlugin, ActivitySlotName } from "./plugins/types";

export interface ExclusiveDrop {
  /** 被丢弃的插件名 */
  name: string;
  /** 引发丢弃的槽位 */
  slot: ActivitySlotName;
  /** 该槽位的胜出插件名 */
  winner: string;
}

export interface ExclusiveResolution<T = any> {
  /** 留下的插件（保持调用方传入的相对顺序） */
  kept: ActivityPlugin<T>[];
  /** 被丢弃记录（供装配期 console.warn） */
  dropped: ExclusiveDrop[];
}

export function resolveExclusivePlugins<T = any>(
  plugins: ActivityPlugin<T>[]
): ExclusiveResolution<T> {
  // 内核执行序：priority 降序（ADR-10「priority 大者先行」）。稳定排序保证同分时先声明者优先。
  const byPriority = [...plugins].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  const claimed = new Map<ActivitySlotName, string>();
  const droppedSet = new Set<ActivityPlugin<T>>();
  const dropped: ExclusiveDrop[] = [];

  for (const p of byPriority) {
    const slots = p.exclusiveSlots ?? [];
    if (slots.length === 0) continue;
    const conflict = slots.find((s) => claimed.has(s));
    if (conflict) {
      droppedSet.add(p);
      dropped.push({ name: p.name, slot: conflict, winner: claimed.get(conflict)! });
      continue;
    }
    for (const s of slots) claimed.set(s, p.name);
  }

  if (droppedSet.size === 0) return { kept: plugins, dropped };

  // 保持调用方原相对顺序，仅剔除被丢弃者
  const kept = plugins.filter((p) => !droppedSet.has(p));
  return { kept, dropped };
}
