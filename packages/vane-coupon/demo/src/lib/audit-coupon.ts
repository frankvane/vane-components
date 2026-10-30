/**
 * 页面内几何体检（项目约定：用几何断言代替截图验收）
 *
 * 针对 coupon 的交互元素（领取按钮 / 规则切换 / 角标）检查：
 *  1. 零尺寸  2. 负坐标  3. 越界出宿主容器  4. 交互元素两两相交  5. 容器没撑开
 *
 * 无布局引擎的 DOM 环境（happy-dom / jsdom）getBoundingClientRect 恒为 0，
 * 先探测布局可用性，测不了就跳过（不误报），判定权交还给真实浏览器。
 */
export interface AuditResult {
  problems: string[];
  checked: number;
}

const INTERACTIVE_SEL = '[data-testid="coupon-claim-btn"], [data-testid="coupon-rules-toggle"], [data-testid="coupon-stack-badge"]';

export function auditCoupon(root: HTMLElement | null): AuditResult {
  const problems: string[] = [];
  if (!root) return { problems: ["体检根节点不存在"], checked: 0 };

  const targets = Array.from(
    root.querySelectorAll<HTMLElement>(INTERACTIVE_SEL)
  );
  let checked = 0;

  const hostRect = root.getBoundingClientRect();
  // 布局可用性只看交互元素本身：宿主可能带固定宽度样式（happy-dom 里 rect 也能
  // 返回非 0），但子元素 rect 恒 0 —— 此时几何断言必然误报「零尺寸」。
  const hasLayout = targets.some((el) => {
    const r = el.getBoundingClientRect();
    return r.width !== 0 || r.height !== 0;
  });
  if (!hasLayout) return { problems: [], checked: 0 };

  const rects = targets.map((el) => {
    checked += 1;
    return { el, r: el.getBoundingClientRect() };
  });

  for (const { el, r } of rects) {
    const id = el.dataset.testid ?? el.tagName;
    if (r.width === 0 || r.height === 0) {
      problems.push(`零尺寸元素：${id}（${r.width}×${r.height}）`);
      continue;
    }
    const left = r.left - hostRect.left;
    const top = r.top - hostRect.top;
    if (left < -1 || top < -1) {
      problems.push(`负坐标：${id}（left=${left.toFixed(1)}, top=${top.toFixed(1)}）`);
    }
    if (r.right - hostRect.right > 1 || r.bottom - hostRect.bottom > 1) {
      problems.push(
        `越界：${id}（右溢 ${(r.right - hostRect.right).toFixed(1)}px，下溢 ${(r.bottom - hostRect.bottom).toFixed(1)}px）`
      );
    }
  }

  // 两两相交（同一容器内的交互元素不应叠在一起）
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].r;
      const b = rects[j].r;
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (overlapX > 1 && overlapY > 1) {
        problems.push(
          `重叠：${rects[i].el.dataset.testid} × ${rects[j].el.dataset.testid}`
        );
      }
    }
  }

  // 容器没撑开
  if (root.scrollHeight < hostRect.height - 2) {
    problems.push("容器没撑开：scrollHeight 盖不住内容底边");
  }

  return { problems, checked };
}
