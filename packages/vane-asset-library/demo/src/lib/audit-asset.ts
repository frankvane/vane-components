/**
 * 素材墙几何体检（页面内跑，不是外挂脚本）
 *
 * 素材墙的坏味道和纵向版式不同，主要查五类：
 *  1. 舞台没渲染 / 高度为 0
 *  2. 横向溢出容器（卡片比网格还宽，通常是 columnWidth 小于内容最小宽度）
 *  3. 网格列数为 0（auto-fill 在零宽容器里会塌成 0 列，整墙空白）
 *  4. 卡片零尺寸（渲染了但没高度，图片加载失败却没占位）
 *  5. 空态缺失（0 张卡但没有 `.vc-asset__empty`，用户面对一片空白）
 *
 * 每条断言只读 DOM，不做任何修复；返回空数组表示这张卡是干净的。
 * 浮层（`.vc-asset-lightbox`）是 fixed 定位，不参与溢出判定 —— 它本来就该盖住整页。
 */

export interface AuditIssue {
  /** 场景 id（找不到就退回容器索引） */
  scenario: string;
  kind: "empty" | "overflow" | "zero-size" | "no-columns" | "no-empty-hint";
  detail: string;
}

const TOL = 1.5;

/** 读网格实际列数：computedStyle 的 grid-template-columns 是列宽序列 */
export function columnCount(el: HTMLElement): number {
  const template = getComputedStyle(el).gridTemplateColumns;
  if (!template || template === "none") return 0;
  return template.trim().split(/\s+/).filter((v) => v && v !== "0px").length;
}

function auditStage(stage: HTMLElement, name: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const root = stage.querySelector<HTMLElement>(".vc-asset");

  if (!root) {
    issues.push({ scenario: name, kind: "empty", detail: "舞台里找不到 .vc-asset（组件没渲染）" });
    return issues;
  }

  if (root.offsetHeight <= 0) {
    issues.push({ scenario: name, kind: "zero-size", detail: ".vc-asset 高度为 0" });
  }

  const grid = root.querySelector<HTMLElement>(".vc-asset__grid");
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".vc-asset-card"));

  if (grid) {
    const cols = columnCount(grid);
    if (cols < 1) {
      issues.push({
        scenario: name,
        kind: "no-columns",
        detail: `网格列数为 0（宽 ${grid.clientWidth}px，可能是容器宽度不足或 display 被覆盖）`,
      });
    }

    // 横向溢出：卡片宽度超过网格内容宽
    const gw = grid.clientWidth;
    if (gw > 0) {
      for (const card of cards) {
        if (card.offsetWidth > gw + TOL) {
          issues.push({
            scenario: name,
            kind: "overflow",
            detail: `卡片 ${card.dataset.assetId ?? "?"} 宽 ${card.offsetWidth} > 网格 ${gw}`,
          });
          break; // 同一舞台只报一次，免得 48 张卡刷屏
        }
      }
    }
  }

  // 卡片零尺寸：渲染了但看不到
  const flat = cards.filter((c) => c.offsetHeight <= 0);
  if (flat.length && cards.length) {
    issues.push({
      scenario: name,
      kind: "zero-size",
      detail: `${flat.length}/${cards.length} 张卡片高度为 0`,
    });
  }

  // 0 张卡却没有空态提示 —— 用户会以为页面挂了
  if (!cards.length && !root.querySelector(".vc-asset__empty")) {
    issues.push({ scenario: name, kind: "no-empty-hint", detail: "没有卡片，也没有空态文案" });
  }

  return issues;
}

export function auditAssets(root: ParentNode = document): AuditIssue[] {
  const issues: AuditIssue[] = [];

  root.querySelectorAll<HTMLElement>(".scn-card, .ws-stage").forEach((card, i) => {
    const stage = card.querySelector<HTMLElement>(".scn-stage, .ws-scroll");
    const name =
      card.dataset.scenario ??
      card.querySelector(".scn-id")?.textContent ??
      `stage-${i + 1}`;

    if (!stage) {
      issues.push({ scenario: name, kind: "empty", detail: "卡片里找不到舞台容器" });
      return;
    }
    if (stage.offsetHeight <= 0) {
      issues.push({ scenario: name, kind: "empty", detail: "舞台高度 <= 0，组件没有真正渲染" });
      return;
    }

    issues.push(...auditStage(stage, name));
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
