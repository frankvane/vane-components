import type { CardPluginContext } from "../types";
import type { BusKey } from "../BusKeys";

/**
 * 在指定总线键变化时触发强制更新，减少不相关变更引起的重渲染。
 */
export function setupForceUpdateOnBusKeys(
  context: CardPluginContext,
  keys: BusKey[]
) {
  const unsubs: Array<() => void> = [];
  for (const key of keys) {
    const off = context.bus?.on?.(key, () => {
      context.forceUpdate();
    });
    if (typeof off === "function") unsubs.push(off);
  }
  return () => {
    for (const u of unsubs) {
      try {
        u();
      } catch {}
    }
  };
}