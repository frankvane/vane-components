/**
 * 签到自检（页面内跑，不是外挂脚本）
 *
 * 场景卡 / 工坊预览里装的是真实组件，坏味道和静态检查不同：
 * 这里主要查「没渲染出来」「横向溢出容器」「根节点塌成 0 高度」三类。
 * 每条断言只读 DOM，不做任何修复；返回空数组表示这张卡是干净的。
 */

export interface AuditIssue {
  /** 场景 id（找不到就退回容器索引） */
  scenario: string;
  kind: "empty" | "overflow" | "zero-size";
  detail: string;
}

const TOL = 1.5;

export function auditSignIn(root: ParentNode = document): AuditIssue[] {
  const issues: AuditIssue[] = [];

  root
    .querySelectorAll<HTMLElement>(".scn-card, .ws-stage")
    .forEach((card) => {
      const container = card.querySelector<HTMLElement>("[data-testid='si-root']");
      const name =
        card.dataset.scenario ??
        card.querySelector(".scn-id")?.textContent ??
        card.className ??
        "unknown";

      if (!container) {
        issues.push({
          scenario: name,
          kind: "empty",
          detail: "卡片里找不到签到组件根节点 [data-testid=si-root]",
        });
        return;
      }

      const cw = container.clientWidth;
      const ch = container.offsetHeight;
      if (ch <= 0) {
        issues.push({
          scenario: name,
          kind: "empty",
          detail: "根节点高度 <= 0，组件没有真正渲染",
        });
        return;
      }

      // 1. 横向溢出：任何可见子节点比根节点还宽（多半是某段忘了 box-sizing / 负 margin）
      container.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w > 0 && h > 0 && w > cw + TOL) {
          issues.push({
            scenario: name,
            kind: "overflow",
            detail: `.${el.className} 宽 ${w} > 容器 ${cw}`,
          });
        }
      });
    });

  return issues;
}

/** 一行摘要，给页面上的体检面板用 */
export function summarize(issues: AuditIssue[], cards: number): string {
  if (issues.length === 0) return `${cards} 张卡 · 0 命中`;
  const kinds = new Map<string, number>();
  for (const i of issues) kinds.set(i.kind, (kinds.get(i.kind) ?? 0) + 1);
  return `${cards} 张卡 · ${issues.length} 命中（${[...kinds]
    .map(([k, v]) => `${k}:${v}`)
    .join(" ")}）`;
}
