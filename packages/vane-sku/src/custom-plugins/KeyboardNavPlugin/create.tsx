import type { SkuPlugin, SkuPluginContext } from "../../components/SkuPlugin/plugins/types";

/**
 * KeyboardNavPlugin — 键盘漫游（无障碍）。
 *
 * 让规格按钮支持方向键：
 *   ← → 在同一属性行内移动焦点（自动跳过被禁用推导置灰的选项）
 *   ↑ ↓ 在属性行之间移动焦点（按完整候选列表的列位置就近落点）
 * Enter / Space 由按钮原生行为触发选择 —— 移动焦点不等于改变选择，
 * 键盘用户终于可以「只浏览不选择」了。
 *
 * 实现走 DOM 查询（按钮都带 data-testid），不侵入 core 渲染；
 * 挂载时挂监听、卸载时返回清理函数（内核 onMount 的 React 式写法）。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface KeyboardNavConfig {
  /** 是否阻止方向键的默认滚动行为，默认 true */
  preventDefault?: boolean;
}

export function createKeyboardNavPlugin(
  config: KeyboardNavConfig = {}
): SkuPlugin {
  const prevent = config.preventDefault ?? true;

  return {
    name: "KeyboardNav",
    version: "0.1.0",
    description: "键盘漫游：方向键移动焦点，Enter/Space 选择",
    priority: 25,
    config,
    hooks: {
      onMount: (context: SkuPluginContext) => {
        const root = context.refs.getContainer?.() ?? null;
        if (!root) return;

        /** 行内全部候选（含禁用项：列位置要按完整列表算，否则会漂移） */
        const allOf = (row: Element) =>
          Array.from(
            row.querySelectorAll<HTMLButtonElement>('[data-testid^="sku-opt-"]')
          );

        const handler = (e: KeyboardEvent) => {
          const isHorizontal = e.key === "ArrowLeft" || e.key === "ArrowRight";
          const isVertical = e.key === "ArrowUp" || e.key === "ArrowDown";
          // Enter / Space 交给按钮原生行为（本插件不 preventDefault，不重复触发 click）
          if (!isHorizontal && !isVertical) return;

          const btn = (e.target as HTMLElement | null)?.closest?.(
            '[data-testid^="sku-opt-"]'
          ) as HTMLButtonElement | null;
          if (!btn) return;

          const rows = Array.from(
            root.querySelectorAll<HTMLElement>('[data-testid^="sku-attr-"]')
          );
          const rowIndex = rows.findIndex((r) => r.contains(btn));
          if (rowIndex < 0) return;
          if (prevent) e.preventDefault();

          if (isHorizontal) {
            const all = allOf(rows[rowIndex]);
            const cur = all.indexOf(btn);
            if (cur < 0 || !all.length) return;
            const dir = e.key === "ArrowRight" ? 1 : -1;
            // 在完整候选列表里按方向找下一个可用项（禁用项直接跳过，可跨过它继续找）
            for (let step = 1; step <= all.length; step += 1) {
              const index = ((cur + dir * step) % all.length + all.length) % all.length;
              const candidate = all[index];
              if (candidate.disabled) continue;
              // 只移动焦点，不点击（P2-7：移动 ≠ 选择）
              candidate.focus();
              return;
            }
            return;
          }

          const targetRow = rows[rowIndex + (e.key === "ArrowDown" ? 1 : -1)];
          if (!targetRow) return;
          const curCol = allOf(rows[rowIndex]).indexOf(btn);
          // 目标行按完整列表的列位置就近取「可用」项，避免过滤后下标漂移
          const target = allOf(targetRow);
          let best: HTMLButtonElement | null = null;
          let bestDistance = Infinity;
          for (let i = 0; i < target.length; i += 1) {
            const candidate = target[i];
            if (candidate.disabled) continue;
            const distance = Math.abs(i - curCol);
            if (distance < bestDistance) {
              bestDistance = distance;
              best = candidate;
            }
          }
          best?.focus();
        };

        root.addEventListener("keydown", handler);
        // 返回清理函数：内核会在 clear() 时逆序执行
        return () => root.removeEventListener("keydown", handler);
      },
    },
  };
}
