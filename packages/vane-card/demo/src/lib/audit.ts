/**
 * 页内几何体检（场景页右上角「体检」按钮 + scripts/audit-cards.mjs 共用同一套口径）
 *
 * 为什么需要它：单测只能验「钩子被调用了几次」，插件勾稽起来之后的坏味道全在几何上 ——
 * 卡片被覆盖层挤扁、主图破图、价格区没渲染出来、卡片宽过舞台。
 * 这些只能用真实布局引擎量，肉眼逐卡看一定会漏。
 *
 * 断言（与 scripts/audit-cards.mjs 内联的那份完全一致）：
 *   no-card       场景/示例块里找不到 [data-card-id]
 *   zero-size     卡片宽或高 <= 0
 *   overflow      卡片右边界越过舞台容器（含边框容差）
 *   broken-image  <img> 存在但 naturalWidth === 0（破图 / 未解码）
 *   no-content    卡片里没有任何可见文本（插件全没装或渲染为 null）
 *   no-price      卡片有价格相关 class 但尺寸为 0（价格区塌了）
 */

export type AuditKind = "no-card" | "zero-size" | "overflow" | "broken-image" | "no-content" | "no-price";

export interface AuditIssue {
  /** 场景/示例的 id（data-scenario / data-demo） */
  scope: string;
  kind: AuditKind;
  detail: string;
}

const TOL = 1.5;

/** 卡片是否在「可横向滚动」的容器里（横滑列表本来就会溢出，不算问题） */
function inScroller(el: Element, stop: Element): boolean {
  let node: Element | null = el.parentElement;
  while (node && node !== stop) {
    const overflowX = getComputedStyle(node).overflowX;
    if (overflowX === "auto" || overflowX === "scroll") return true;
    node = node.parentElement;
  }
  return false;
}

function visibleText(el: Element): boolean {
  const text = (el.textContent ?? "").trim();
  return text.length > 0;
}

/** 逐个块体检；root 传 document 或某个容器都行 */
export function auditCards(root: ParentNode): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const blocks = Array.from(
    root.querySelectorAll<HTMLElement>("[data-scenario], [data-demo]")
  );
  if (blocks.length === 0) {
    issues.push({ scope: "page", kind: "no-card", detail: "页面上没有任何场景/示例块" });
    return issues;
  }

  for (const block of blocks) {
    const scope = block.dataset.scenario ?? block.dataset.demo ?? "unknown";
    const cards = Array.from(block.querySelectorAll<HTMLElement>("[data-card-id]"));
    if (cards.length === 0) {
      issues.push({ scope, kind: "no-card", detail: "块里没有 [data-card-id]" });
      continue;
    }

    // 舞台容器：示例页是 .demo-card，场景页是 .scn-stage / .scn-wall
    const stage =
      block.querySelector<HTMLElement>(".demo-card") ??
      block.querySelector<HTMLElement>(".scn-stage") ??
      block;

    for (const card of cards) {
      const cardId = card.dataset.cardId ?? "?";
      const rect = card.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        issues.push({
          scope,
          kind: "zero-size",
          detail: `卡片 ${cardId} 尺寸 ${Math.round(rect.width)}×${Math.round(rect.height)}`,
        });
        continue;
      }

      const stageRect = stage.getBoundingClientRect();
      if (
        !inScroller(card, stage) &&
        (rect.right > stageRect.right + TOL || rect.left < stageRect.left - TOL)
      ) {
        issues.push({
          scope,
          kind: "overflow",
          detail: `卡片 ${cardId} 右边界 ${Math.round(rect.right)} > 舞台 ${Math.round(stageRect.right)}`,
        });
      }

      const broken = Array.from(card.querySelectorAll("img")).filter(
        (img) => img.complete && img.naturalWidth === 0
      );
      for (const img of broken) {
        issues.push({
          scope,
          kind: "broken-image",
          detail: `卡片 ${cardId} 图片破图：${(img.currentSrc || img.src).slice(0, 60)}`,
        });
      }

      // 内容：卡片里既没有文本、也没有图片 → 装了插件但什么都没渲染出来
      const hasImage = Array.from(card.querySelectorAll("img")).some(
        (img) => img.naturalWidth > 0
      );
      if (!visibleText(card) && !hasImage) {
        issues.push({ scope, kind: "no-content", detail: `卡片 ${cardId} 没有任何可见内容` });
      }

      const price = card.querySelector<HTMLElement>(".vc-price, .vc-price__area");
      if (price) {
        const priceRect = price.getBoundingClientRect();
        if (priceRect.width <= 0 || priceRect.height <= 0) {
          issues.push({
            scope,
            kind: "no-price",
            detail: `卡片 ${cardId} 的价格区被压成 0：${price.className}`,
          });
        }
      }
    }
  }

  return issues;
}

/** 一句话结论（页面顶部的体检条用） */
export function summarize(issues: AuditIssue[], blockCount: number): string {
  if (issues.length === 0) return `${blockCount} 个场景全部通过：卡片在舞台内、图能解码、价格区有尺寸`;
  const byKind = new Map<AuditKind, number>();
  for (const i of issues) byKind.set(i.kind, (byKind.get(i.kind) ?? 0) + 1);
  const parts = Array.from(byKind.entries()).map(([k, n]) => `${k}×${n}`);
  return `${issues.length} 处命中（${parts.join(" · ")}）`;
}
