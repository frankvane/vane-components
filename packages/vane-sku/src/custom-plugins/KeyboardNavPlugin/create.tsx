import type { SkuPlugin, SkuPluginContext } from "../../components/SkuPlugin/plugins/types";

/**
 * KeyboardNavPlugin — 键盘漫游（无障碍）。
 *
 * 让规格按钮支持方向键操作：
 *   ← → 在同一属性行内切换选项（自动跳过被禁用推导置灰的选项）
 *   ↑ ↓ 在属性行之间跳转（尽量保持列位置）
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
    description: "键盘漫游：方向键在规格按钮间移动并选择",
    priority: 25,
    config,
    hooks: {
      onMount: (context: SkuPluginContext) => {
        const root = context.refs.getContainer?.() ?? null;
        if (!root) return;

        const optsOf = (row: Element) =>
          Array.from(
            row.querySelectorAll<HTMLButtonElement>('[data-testid^="sku-opt-"]')
          ).filter((b) => !b.disabled);

        const handler = (e: KeyboardEvent) => {
          const isHorizontal = e.key === "ArrowLeft" || e.key === "ArrowRight";
          const isVertical = e.key === "ArrowUp" || e.key === "ArrowDown";
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
            const list = optsOf(rows[rowIndex]);
            const cur = list.indexOf(btn);
            if (cur < 0 || !list.length) return;
            const next =
              list[
                (cur + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length
              ];
            next.focus();
            next.click();
            return;
          }

          const dir = e.key === "ArrowDown" ? 1 : -1;
          const targetRow = rows[rowIndex + dir];
          if (!targetRow) return;
          const list = optsOf(targetRow);
          if (!list.length) return;
          const col = optsOf(rows[rowIndex]).indexOf(btn);
          const next = list[Math.min(Math.max(col, 0), list.length - 1)];
          next.focus();
          next.click();
        };

        root.addEventListener("keydown", handler);
        // 返回清理函数：内核会在 clear() 时逆序执行
        return () => root.removeEventListener("keydown", handler);
      },
    },
  };
}
