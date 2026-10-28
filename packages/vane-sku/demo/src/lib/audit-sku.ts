/**
 * 页面内几何体检（项目约定：用几何断言代替截图验收）
 *
 * 截图看不出「叠卡 / 溢出 / 零尺寸」，几何断言能。检查项：
 *  1. 零尺寸：可交互元素（规格按钮）宽或高为 0
 *  2. 负坐标：元素相对宿主容器的 left/top 为负
 *  3. 越界：元素右/下边界超出宿主容器
 *  4. 重叠：规格按钮两两相交
 *  5. 容器未能撑开：scrollHeight 小于内容底边
 *
 * @param root 体检根节点（通常是 demo 容器）
 * @returns { problems: string[], checked: number }
 */
export interface AuditResult {
  problems: string[];
  checked: number;
}

export function auditSku(root: HTMLElement | null): AuditResult {
  const problems: string[] = [];
  if (!root) return { problems: ["体检根节点不存在"], checked: 0 };

  const hostRect = root.getBoundingClientRect();
  const buttons = Array.from(
    root.querySelectorAll<HTMLElement>('[data-testid^="sku-opt-"]')
  );
  let checked = 0;

  // 1) 零尺寸 + 2) 负坐标 + 3) 越界
  for (const btn of buttons) {
    checked += 1;
    const r = btn.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) {
      problems.push(`零尺寸元素：${btn.dataset.testid}（${r.width}×${r.height}）`);
      continue;
    }
    const left = r.left - hostRect.left;
    const top = r.top - hostRect.top;
    if (left < -0.5 || top < -0.5) {
      problems.push(`负坐标：${btn.dataset.testid}（left=${left.toFixed(1)}, top=${top.toFixed(1)}）`);
    }
    if (r.right - hostRect.right > 1 || r.bottom - hostRect.bottom > 1) {
      problems.push(
        `越界：${btn.dataset.testid}（超出宿主右/下边界 ${(r.right - hostRect.right).toFixed(1)}/${(r.bottom - hostRect.bottom).toFixed(1)}px）`
      );
    }
  }

  // 4) 两两重叠（同一属性行内的按钮不该相交）
  for (let i = 0; i < buttons.length; i += 1) {
    for (let j = i + 1; j < buttons.length; j += 1) {
      const a = buttons[i].getBoundingClientRect();
      const b = buttons[j].getBoundingClientRect();
      const overlap =
        a.left < b.right - 1 &&
        b.left < a.right - 1 &&
        a.top < b.bottom - 1 &&
        b.top < a.bottom - 1;
      if (overlap) {
        problems.push(
          `元素重叠：${buttons[i].dataset.testid} 与 ${buttons[j].dataset.testid}`
        );
      }
    }
  }

  // 5) 容器是否撑开到内容底边
  const contentBottom = buttons.reduce(
    (max, b) => Math.max(max, b.getBoundingClientRect().bottom - hostRect.top),
    0
  );
  if (buttons.length && root.scrollHeight + 1 < contentBottom) {
    problems.push(
      `容器未撑开：scrollHeight=${root.scrollHeight} 小于内容底边 ${contentBottom.toFixed(1)}`
    );
  }

  // 去重后返回，避免同一问题刷屏
  return { problems: Array.from(new Set(problems)), checked };
}
