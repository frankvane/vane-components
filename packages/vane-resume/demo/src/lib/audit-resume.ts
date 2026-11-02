/**
 * 场景自检（页面内跑，不是外挂脚本）
 *
 * 场景卡是纵向简历版式，坏味道和瀑布流不同：
 * 这里主要查「没渲染出来」「横向溢出容器」「某个槽位塌成 0 高度」三类。
 * 每条断言只读 DOM，不做任何修复；返回空数组表示这张卡是干净的。
 */

export interface AuditIssue {
  /** 场景 id（找不到就退回容器索引） */
  scenario: string;
  kind: "empty" | "overflow" | "zero-size" | "hidden-slot";
  detail: string;
}

const TOL = 1.5;

export function auditResume(root: ParentNode = document): AuditIssue[] {
  const issues: AuditIssue[] = [];

  root.querySelectorAll<HTMLElement>(".scn-card, .ws-stage").forEach((card) => {
    const stage = card.querySelector<HTMLElement>(".scn-stage, .ws-scroll");
    const name =
      card.dataset.scenario ??
      card.querySelector(".scn-id")?.textContent ??
      card.className ??
      "unknown";

    if (!stage) {
      issues.push({ scenario: name, kind: "empty", detail: "卡片里找不到舞台容器" });
      return;
    }

    const cw = stage.clientWidth;
    const ch = stage.offsetHeight;
    if (ch <= 0) {
      issues.push({ scenario: name, kind: "empty", detail: "舞台高度 <= 0，组件没有真正渲染" });
      return;
    }

    // 1. 横向溢出：任何可见子节点比舞台还宽
    stage.querySelectorAll<HTMLElement>("*").forEach((el) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0 && w > cw + TOL) {
        issues.push({
          scenario: name,
          kind: "overflow",
          detail: `.${el.className} 宽 ${w} > 舞台 ${cw}`,
        });
      }
    });

    // 2. 根容器塌成 0：装了 ResumeCore 却没高度
    const rootEl = stage.querySelector<HTMLElement>(".vr-root");
    if (rootEl && rootEl.offsetHeight <= 0) {
      issues.push({ scenario: name, kind: "zero-size", detail: ".vr-root 高度为 0（ResumeCore 没渲染？）" });
    }
  });

  return issues;
}

/** 一行摘要，给页面上的体检面板用 */
export function summarize(issues: AuditIssue[], cards: number): string {
  if (issues.length === 0) return `${cards} 张卡 · 0 命中`;
  const kinds = new Map<string, number>();
  for (const i of issues) kinds.set(i.kind, (kinds.get(i.kind) ?? 0) + 1);
  return `${cards} 张卡 · ${issues.length} 命中（${[...kinds].map(([k, v]) => `${k}:${v}`).join(" ")}）`;
}
