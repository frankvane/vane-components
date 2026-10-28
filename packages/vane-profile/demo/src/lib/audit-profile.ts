/**
 * 主页自检（页面内跑，不是外挂脚本）
 *
 * 主页是纵向三段式（头图区 / 数据行 / 页签栏 / 内容区），坏味道和瀑布流不同：
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

export function auditProfile(root: ParentNode = document): AuditIssue[] {
  const issues: AuditIssue[] = [];

  root.querySelectorAll<HTMLElement>(".scn-card, .ws-stage").forEach((card) => {
    const container = card.querySelector<HTMLElement>(".vp-profile");
    const name =
      card.dataset.scenario ??
      card.querySelector(".scn-id")?.textContent ??
      card.className ??
      "unknown";

    if (!container) {
      issues.push({ scenario: name, kind: "empty", detail: "卡片里找不到 .vp-profile 容器" });
      return;
    }

    const cw = container.clientWidth;
    const ch = container.offsetHeight;
    if (ch <= 0) {
      issues.push({ scenario: name, kind: "empty", detail: "容器高度 <= 0，组件没有真正渲染" });
      return;
    }

    // 1. 横向溢出：任何可见子节点比容器还宽（多半是某段忘了 box-sizing / 负 margin）
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

    // 2. 头图区塌成 0：装了 BannerSlot 却没高度（常见于父级 overflow:hidden 把浮层裁掉）
    const banner = container.querySelector<HTMLElement>(".vp-banner-area");
    if (banner) {
      const bh = banner.offsetHeight;
      if (bh <= 0) {
        issues.push({ scenario: name, kind: "zero-size", detail: "头图区高度为 0（BannerSlot 没渲染？）" });
      }
      const inner = banner.querySelector<HTMLElement>(".vp-banner");
      if (inner && inner.offsetHeight <= 0) {
        issues.push({ scenario: name, kind: "zero-size", detail: "BannerSlot 内层高度为 0" });
      }
    }

    // 3. 数据行：装了 StatRow 但没有可见指标节点
    const statInner = container.querySelector<HTMLElement>(".vp-stat-row-inner");
    if (statInner && statInner.children.length === 0) {
      issues.push({ scenario: name, kind: "hidden-slot", detail: "StatRow 渲染了但没有任何指标项" });
    }

    // 4. 页签栏：装了 TabSync 但按钮数为 0
    const tabInner = container.querySelector<HTMLElement>(".vp-tab-bar-inner");
    if (tabInner && tabInner.querySelectorAll("button").length === 0) {
      issues.push({ scenario: name, kind: "hidden-slot", detail: "TabSync 渲染了但没有任何页签按钮" });
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
