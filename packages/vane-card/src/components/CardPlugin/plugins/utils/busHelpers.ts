import type { CardPluginContext } from "../types";
import type { BusKey } from "../BusKeys";

/**
 * 在指定总线键变化时触发强制更新，减少不相关变更引起的重渲染。
 *
 * 订阅后立刻 forceUpdate 一次，不是冗余：钩子按 priority 降序执行，
 * 「发布方」往往排在「订阅方」前面（如 SKUPlugin 60 → ImagePlugin 10），
 * 首次写入发生在我们订阅之前。首渲染又早于所有 onMount，于是不做这次补偿，
 * 界面会一直停在「总线还没数据」的旧结果上（选规格主图不换、售罄不显示）。
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
  // 补偿订阅前已经发生的写入
  context.forceUpdate();
  return () => {
    for (const u of unsubs) {
      try {
        u();
      } catch {}
    }
  };
}