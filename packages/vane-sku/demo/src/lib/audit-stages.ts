/**
 * 场景页体检（页面内跑，不是外挂脚本）
 *
 * 遍历页面上每张场景卡，把卡片里的 `.scn-stage` 交给通用几何体检 `auditSku`
 * （零尺寸 / 负坐标 / 越界 / 重叠，见同目录 audit-sku.ts），再把问题摊平成
 * 「哪张卡 · 什么问题」的列表。另加一条断言：舞台本身尺寸非零 ——
 * 组件炸了或懒加载没回来时，stage 会是空的，这一条能先兜住。
 */
import { auditSku } from "./audit-sku";

export interface StageIssue {
  /** 场景 id（取卡片的 data-scenario / id，找不到退回索引） */
  scenario: string;
  detail: string;
}

export function auditStages(): StageIssue[] {
  const issues: StageIssue[] = [];
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".scn-card"));

  cards.forEach((card, index) => {
    const name =
      card.dataset.scenario ?? card.id.replace(/^scn-/, "") ?? `#${index + 1}`;
    const stage = card.querySelector<HTMLElement>(".scn-stage");

    if (!stage) {
      issues.push({ scenario: name, detail: "卡片里找不到 .scn-stage 舞台节点" });
      return;
    }

    // 舞台自身先得站得住：宽高为 0 说明里面的组件根本没渲染出来
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      issues.push({ scenario: name, detail: "舞台未渲染（.scn-stage 宽高为 0）" });
      return;
    }

    // 复用通用体检：规格按钮零尺寸 / 负坐标 / 越界 / 两两重叠 / 容器未撑开
    const { problems, checked } = auditSku(stage);
    for (const p of problems) {
      issues.push({ scenario: name, detail: `${p}${checked ? `（查了 ${checked} 个规格按钮）` : ""}` });
    }
    if (!problems.length && checked === 0) {
      // 有布局环境却一个规格按钮都没查到 —— 多半是组件渲染异常，别静默放过
      issues.push({ scenario: name, detail: "舞台内没有可体检的规格按钮（[data-testid^=sku-opt-]）" });
    }
  });

  return issues;
}

/** 一行摘要，给页面上的体检面板用 */
export function summarizeStages(issues: StageIssue[], cards: number): string {
  if (issues.length === 0) return `${cards} 张卡 · 0 命中`;
  const byCard = new Map<string, number>();
  for (const i of issues) byCard.set(i.scenario, (byCard.get(i.scenario) ?? 0) + 1);
  return `${cards} 张卡 · ${issues.length} 命中（${[...byCard]
    .map(([k, v]) => `${k}:${v}`)
    .join(" ")}）`;
}
