import type {
  ItemPosition,
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

export type PinItemConfig = {
  /** 要钉在顶部的项索引（建议用 0 起的小索引） */
  pinnedIndices: number[];
  /** 钉到第几列，默认 0（最左列） */
  column?: number;
};

/**
 * PinItemPlugin - 把指定项钉在顶部指定列，其余项从置顶块下方继续排。
 *
 * 旧版这里是个空转插件：全部逻辑压在 `calculateItemPosition` 上，而 Core 里
 * **没有任何地方执行这个钩子**（tasks/07 · 4.5 的死钩子清单），`renderOverlay`
 * 又返回 null —— 上线至今什么都没做。D1-A 把钩子接上后这里才是真的实现。
 *
 * 语义与限制（写在这里，避免变成"看起来能用"的坑）：
 *  - 置顶项在**同列普通项之前**被布局时最干净（通常 pinnedIndices 是 0..n）。
 *    若置顶项的索引大于该列已排好的项，它会按 floor 规则把后续项往下推，
 *    但已布局的项不会回退，视觉上会重叠。
 *  - 置顶项不参与列轮转，永远落在 `config.column`。
 *  - 同一列多条置顶按 pinnedIndices 顺序纵向堆叠。
 */
export function createPinItemPlugin<T = any>(config: PinItemConfig): WaterfallPlugin<T> {
  const pinned = new Set(config.pinnedIndices);
  const targetColumn = Math.max(0, config.column ?? 0);
  /** column → 置顶块底部（含 rowGap）；每次布局前清空 */
  const floorByColumn = new Map<number, number>();

  return {
    name: "PinItemPlugin",
    priority: 100,
    enabled: true,
    hooks: {
      onBeforeLayout: () => {
        floorByColumn.clear();
        return true;
      },

      calculateItemPosition: (
        context: WaterfallPluginContext<T>,
        index: number,
        itemHeight: number,
        base: ItemPosition
      ): Partial<ItemPosition> | void => {
        const rowGap = context.props.rowGap ?? context.props.gap ?? 0;

        if (!pinned.has(index)) {
          // 普通项：落在被置顶的那一列、且高于置顶块底部 → 推下去
          const floor = floorByColumn.get(base.column);
          if (floor !== undefined && base.y < floor) {
            return { y: floor };
          }
          return undefined;
        }

        const pitch = base.width + (context.props.columnGap ?? rowGap);
        const y = floorByColumn.get(targetColumn) ?? 0;
        floorByColumn.set(targetColumn, y + itemHeight + rowGap);

        return {
          x: base.x + (targetColumn - base.column) * pitch,
          y,
          width: base.width,
          height: itemHeight,
          column: targetColumn,
          row: 0,
        };
      },
    },
  };
}
