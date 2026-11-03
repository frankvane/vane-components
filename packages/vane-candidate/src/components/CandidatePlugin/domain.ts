import type { Candidate, StageConfig } from "./plugins/types";

/**
 * 候选人流水线领域纯函数。核心与插件共用，禁止在此触达 React 或可变单例。
 */

/** 候选人在阶段列表中的下标；未定义阶段（如 rejected 不在列）返回 -1 */
export function stageIndexOf(stages: StageConfig[], stage: string): number {
  return stages.findIndex((s) => s.key === stage);
}

/**
 * 计算流转后的阶段 key。delta=+1 推进 / -1 退回，越界即停在首/末阶段；
 * 候选人当前阶段不在列表中时返回原值（不可流转）。
 */
export function moveStage(
  stages: StageConfig[],
  current: string,
  delta: number
): string {
  const idx = stageIndexOf(stages, current);
  if (idx < 0) return current;
  const next = Math.min(Math.max(idx + delta, 0), stages.length - 1);
  return stages[next].key;
}

/** 追加一条 history（不可变更新，最多保留 50 条） */
export function withHistory(
  candidate: Candidate,
  action: string,
  detail?: string
): Candidate {
  const item = { at: new Date().toISOString(), action, ...(detail ? { detail } : {}) };
  return { ...candidate, history: [item, ...(candidate.history ?? []).slice(0, 49)] };
}

/** 应用局部补丁（浅合并，不深改引用字段） */
export function applyCandidatePatch(
  list: Candidate[],
  id: string,
  patch: Partial<Candidate>
): Candidate[] {
  return list.map((c) => (c.id === id ? { ...c, ...patch } : c));
}

/** 浅比较两个 patch 是否无实际变化（避免无谓的 state 写入） */
export function patchMeaningful(patch: Partial<Candidate>): boolean {
  return Object.keys(patch).length > 0;
}

/** CSV 单元格转义（引号包裹 + 内部引号翻倍），防注入公式前缀 ' */
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** 手机号脱敏：保留前 3 后 4 */
export function maskPhone(phone?: string): string | undefined {
  if (!phone) return phone;
  return phone.replace(/^(\d{3})\d*(\d{4})$/, "$1****$2");
}

/** 邮箱脱敏：用户名保留首尾各 1 字符 */
export function maskEmail(email?: string): string | undefined {
  if (!email || !email.includes("@")) return email;
  const [name, domain] = email.split("@");
  if (name.length <= 2) return `${name[0] ?? "*"}***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}
