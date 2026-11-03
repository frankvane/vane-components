/**
 * 场景自检（页面内跑，不是外挂脚本）
 *
 * 看板流水线的坏味道和纵向文档不同，这里查四类：
 *  1. 没渲染出来：舞台高度为 0，或容器里找不到 .vcd-root；
 *  2. 看板塌陷：.vcd-kanban 存在却一列都没有；
 *  3. 横向溢出：可见子元素比舞台还宽（.vcd-kanban 自身是横向滚动容器，
 *     列在它里面超出舞台是合法行为，不计入）；
 *  4. 列塌陷：某列高度为 0（列头在、卡片区塌了）。
 *
 * 每条断言只读 DOM，不做任何修复；返回空数组表示这张卡是干净的。
 * 无布局引擎的环境（happy-dom / jsdom）getBoundingClientRect 恒为 0，
 * 几何断言会全部误报 —— 先探测布局可用性，不可用时只做结构性检查（layout-skip）。
 */

export interface AuditIssue {
  /** 场景 id（找不到就退回容器索引） */
  scenario: string;
  kind: "empty" | "overflow" | "zero-size" | "hidden-slot";
  detail: string;
}

const TOL = 1.5;

/** 探测环境是否真的算了几何（真实浏览器 = 可用；happy-dom = 全 0） */
function layoutAvailable(root: ParentNode): boolean {
  const probe = root.querySelector<HTMLElement>(".vcd-root, .scn-stage, .ws-scroll");
  if (probe) {
    const r = probe.getBoundingClientRect();
    if (r.width !== 0 || r.height !== 0) return true;
  }
  const inner = root.querySelector<HTMLElement>(".vcd-card, .vcd-column");
  if (!inner) return false;
  const r = inner.getBoundingClientRect();
  return r.width !== 0 || r.height !== 0;
}

/**
 * 元素到舞台之间（含舞台自身）是否存在横向滚动容器。
 * 看板的列宽天然可能超出舞台（.vcd-kanban / .scn-stage / .ws-scroll 都是
 * overflow-x 滚动容器）—— 滚动区内的「溢出」是合法行为，不作断言。
 */
function insideScrollX(el: Element, stage: HTMLElement): boolean {
  let cur: Element | null = el;
  while (cur) {
    if (cur instanceof HTMLElement) {
      const ox = getComputedStyle(cur).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
    }
    if (cur === stage) break;
    cur = cur.parentElement;
  }
  return false;
}

export function auditCandidate(root: ParentNode = document): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const measurable = layoutAvailable(root);

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

    const ch = stage.offsetHeight;
    if (measurable && ch <= 0) {
      issues.push({ scenario: name, kind: "empty", detail: "舞台高度 <= 0，组件没有真正渲染" });
      return;
    }

    // 1. 根容器存在性：装了 CandidateCore 却没有 .vcd-root
    const rootEl = stage.querySelector<HTMLElement>(".vcd-root");
    if (!rootEl) {
      issues.push({ scenario: name, kind: "empty", detail: "找不到 .vcd-root（CandidateCore 没渲染？）" });
      return;
    }
    if (measurable && rootEl.offsetHeight <= 0) {
      issues.push({ scenario: name, kind: "zero-size", detail: ".vcd-root 高度为 0（CandidateCore 没渲染？）" });
    }

    // 2. 看板骨架：kanban 在但一列都没有 = 骨架塌陷
    const kanban = stage.querySelector<HTMLElement>(".vcd-kanban");
    if (kanban) {
      const columns = stage.querySelectorAll(".vcd-column");
      if (columns.length === 0) {
        issues.push({ scenario: name, kind: "zero-size", detail: ".vcd-kanban 存在但 0 列（stages 没渲染？）" });
      }
      for (const col of columns) {
        if (measurable && col.clientHeight <= 0) {
          const key = (col as HTMLElement).dataset.stageKey ?? "?";
          issues.push({ scenario: name, kind: "hidden-slot", detail: `列 ${key} 高度为 0（塌陷）` });
        }
      }
    }

    if (!measurable) return;

    // 3. 横向溢出：跳过横向滚动容器内的元素（滚动是合法的消化方式）
    const cw = stage.clientWidth;
    stage.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (insideScrollX(el, stage)) return;
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
