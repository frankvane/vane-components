/**
 * 页面内几何体检（项目约定：用几何断言代替截图验收）
 *
 * 截图看不出「叠卡 / 溢出 / 零尺寸」，几何断言能。检查项：
 *  1. 零尺寸：顶层评论项宽或高为 0
 *  2. 负坐标：评论项相对宿主容器的 left/top 为负
 *  3. 越界：评论项右/下边界超出宿主容器
 *  4. 重叠：顶层评论项两两相交
 *  5. 容器未能撑开：scrollHeight 小于内容底边
 *
 * 只量**顶层**评论项：嵌套回复是顶层项的子节点，父子天然包含，
 * 跨层级判重叠会误报，故过滤掉「父节点也是 comment-item」的项。
 *
 * @param root 体检根节点（通常是 demo 容器）
 * @returns { problems: string[], checked: number }
 */
export interface AuditResult {
  problems: string[];
  checked: number;
}

export function auditComment(root: HTMLElement | null): AuditResult {
  const problems: string[] = [];
  if (!root) return { problems: ["体检根节点不存在"], checked: 0 };

  // 顶层评论项：父节点不是 comment-item 的项（排除嵌套回复）
  const items = Array.from(
    root.querySelectorAll<HTMLElement>('[data-testid="comment-item"]')
  ).filter((el) => !el.parentElement?.closest('[data-testid="comment-item"]'));
  let checked = 0;

  // 无布局引擎的 DOM 环境（happy-dom / jsdom）：getBoundingClientRect 恒返回全 0，
  // 几何断言会无一例外地误报「零尺寸 / 负坐标 / 越界」。这类环境本就无法测量几何，
  // 直接跳过，把判定权交还给真实浏览器（?selftest=1 跑的就是真布局）。
  const hostRect = root.getBoundingClientRect();
  const hasLayout =
    hostRect.width !== 0 ||
    hostRect.height !== 0 ||
    items.some((b) => {
      const r = b.getBoundingClientRect();
      return r.width !== 0 || r.height !== 0;
    });
  if (!hasLayout) return { problems: [], checked: 0 };

  // 1) 零尺寸 + 2) 负坐标 + 3) 越界
  for (const item of items) {
    checked += 1;
    const r = item.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) {
      problems.push(`零尺寸评论项（${r.width}×${r.height}）`);
      continue;
    }
    const left = r.left - hostRect.left;
    const top = r.top - hostRect.top;
    if (left < -0.5 || top < -0.5) {
      problems.push(`负坐标评论项（left=${left.toFixed(1)}, top=${top.toFixed(1)}）`);
    }
    if (r.right - hostRect.right > 1 || r.bottom - hostRect.bottom > 1) {
      problems.push(
        `越界评论项（超出宿主右/下边界 ${(r.right - hostRect.right).toFixed(1)}/${(r.bottom - hostRect.bottom).toFixed(1)}px）`
      );
    }
  }

  // 4) 顶层评论项两两重叠（同一列表内不应相交）
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i].getBoundingClientRect();
      const b = items[j].getBoundingClientRect();
      const overlap =
        a.left < b.right - 1 &&
        b.left < a.right - 1 &&
        a.top < b.bottom - 1 &&
        b.top < a.bottom - 1;
      if (overlap) {
        problems.push(`评论项重叠：顶层第 ${i + 1} 与第 ${j + 1} 项`);
      }
    }
  }

  // 5) 容器是否撑开到内容底边
  const contentBottom = items.reduce(
    (max, b) => Math.max(max, b.getBoundingClientRect().bottom - hostRect.top),
    0
  );
  if (items.length && root.scrollHeight + 1 < contentBottom) {
    problems.push(
      `容器未撑开：scrollHeight=${root.scrollHeight} 小于内容底边 ${contentBottom.toFixed(1)}`
    );
  }

  // 去重后返回，避免同一问题刷屏
  return { problems: Array.from(new Set(problems)), checked };
}
