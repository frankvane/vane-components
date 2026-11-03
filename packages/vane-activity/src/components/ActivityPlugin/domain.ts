/**
 * 活动领域纯函数引擎（不依赖 React）。
 *
 * 单一事实来源：进度由任务完成度加权求得，奖励状态由进度 + 已领取集合派生。
 * 内核 withPlugins 在 extendContext 里调用这些函数，把派生结果写进
 * ActivityPluginContext，供 TaskList / ProgressFx / RewardClaim 等插件一致读取。
 */

import type {
  ActivityTask,
  ActivityReward,
  ActivityRewardWithStatus,
  ActivityRewardStatus,
} from "./plugins/types";

/** 总体进度 0..1：任务 progress 按 weight 加权平均（completed 任务 progress=1） */
export function computeProgress(tasks: ActivityTask[]): number {
  if (tasks.length === 0) return 0;
  let total = 0;
  let done = 0;
  for (const t of tasks) {
    // P2-1：接口可能给 NaN / Infinity / 负数权重，非法值回退为 1，避免进度变 NaN。
    const rawWeight = t.weight ?? 1;
    const w = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;
    total += w;
    const p = Math.max(0, Math.min(1, Number.isFinite(t.progress) ? t.progress : 0));
    done += p * w;
  }
  const progress = total === 0 ? 0 : done / total;
  return Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
}

/**
 * 单个奖励状态：已领取 > 进度达标可领 > 锁定。
 * P2-1：阈值夹取到 [0,1]；非有限值按 1 处理（宁可锁定，也不误放行）。
 */
export function deriveRewardStatus(
  reward: ActivityReward,
  progress: number,
  claimed: boolean
): ActivityRewardStatus {
  if (claimed) return "claimed";
  const threshold = Number.isFinite(reward.threshold)
    ? Math.max(0, Math.min(1, reward.threshold))
    : 1;
  return progress >= threshold ? "claimable" : "locked";
}

/** 批量派生奖励状态 */
export function deriveRewards(
  rewards: ActivityReward[],
  progress: number,
  claimedIds: string[]
): ActivityRewardWithStatus[] {
  return rewards.map((r) => ({
    ...r,
    status: deriveRewardStatus(r, progress, claimedIds.includes(r.id)),
  }));
}

/** 是否已全部领取（ProgressFx 庆祝特效触发条件之一） */
export function allClaimed(rewards: ActivityRewardWithStatus[]): boolean {
  return rewards.length > 0 && rewards.every((r) => r.status === "claimed");
}
