/**
 * 场景自检（页面内跑，不是外挂脚本）
 *
 * 为什么放在页面里：瀑布流最典型的坏味道全在几何上 —— 卡片叠在一起、超出容器、
 * 总高不够导致滚不到底、某一列空着。这些只有真实布局引擎能发现，happy-dom 单测
 * 只能验纯函数。与其写一份要装浏览器的外挂脚本，不如让页面自己体检。
 *
 * 每条断言都只读 DOM，不做任何修复；返回空数组表示这张卡是干净的。
 */

export interface AuditIssue {
  /** 场景 id（找不到就退回容器索引） */
  scenario: string;
  kind: "overlap" | "overflow" | "negative" | "zero-size" | "height" | "empty";
  detail: string;
}

interface Box {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const TOL = 1.5;

/** 从 computed transform 里取位移；没有 transform 说明这项还没被布局 */
function translateOf(el: HTMLElement): { x: number; y: number } | null {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return null;
  // matrix(a, b, c, d, tx, ty) / matrix3d(...)
  const m = /matrix\(([^)]+)\)/.exec(t);
  if (m) {
    const parts = m[1].split(",").map(Number);
    return { x: parts[4], y: parts[5] };
  }
  return null;
}

function collect(container: HTMLElement): Box[] {
  const boxes: Box[] = [];
  container.querySelectorAll<HTMLElement>("[data-index]").forEach((el) => {
    const pos = translateOf(el);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!pos || w <= 0 || h <= 0) return;
    boxes.push({ index: Number(el.dataset.index), x: pos.x, y: pos.y, w, h });
  });
  return boxes;
}

export function auditWaterfall(root: ParentNode = document): AuditIssue[] {
  const issues: AuditIssue[] = [];

  root.querySelectorAll<HTMLElement>("[data-vane-waterfall]").forEach((container) => {
    const card = container.closest<HTMLElement>(".scn-card, .ws-stage");
    const name =
      card?.dataset.scenario ??
      card?.querySelector(".scn-id")?.textContent ??
      card?.className ??
      "unknown";

    const boxes = collect(container);
    if (boxes.length === 0) {
      issues.push({ scenario: name, kind: "empty", detail: "容器里没有任何已布局的项" });
      return;
    }

    const clientWidth = container.clientWidth;

    // 1. 越界 / 负坐标
    for (const b of boxes) {
      if (b.x < -TOL) {
        issues.push({ scenario: name, kind: "negative", detail: `#${b.index} x=${b.x.toFixed(1)}` });
      }
      if (b.x + b.w > clientWidth + TOL) {
        issues.push({
          scenario: name,
          kind: "overflow",
          detail: `#${b.index} 右边界 ${(b.x + b.w).toFixed(1)} > 容器 ${clientWidth}`,
        });
      }
      if (b.w <= 0 || b.h <= 0) {
        issues.push({ scenario: name, kind: "zero-size", detail: `#${b.index} ${b.w}×${b.h}` });
      }
    }

    // 2. 两两重叠（含跨列）—— 瀑布流最致命的坏味道
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > TOL && oy > TOL) {
          issues.push({
            scenario: name,
            kind: "overlap",
            detail: `#${a.index} 与 #${b.index} 重叠 ${ox.toFixed(0)}×${oy.toFixed(0)}`,
          });
        }
      }
    }

    // 3. 滚动高度要盖住所有项（否则滚不到底，也就是「最后一屏看不到」）
    const maxBottom = Math.max(...boxes.map((b) => b.y + b.h));
    if (container.scrollHeight + TOL < maxBottom) {
      issues.push({
        scenario: name,
        kind: "height",
        detail: `内容底 ${maxBottom.toFixed(0)} > scrollHeight ${container.scrollHeight}`,
      });
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
