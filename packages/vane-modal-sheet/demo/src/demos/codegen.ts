/**
 * 最小装配代码生成器（拖控件 = 改代码）
 *
 * 输入 demo 控件的当前值，产出一段「消费者可以直接复制」的装配代码。
 * 与 01-multi-snap 页联动：改控件 → 代码片段实时跟着变。
 */

export interface SheetSnippetInput {
  /** 吸附档（视口比例 0–1） */
  snaps: number[];
  /** 是否显示档位指示点 */
  snapDots: boolean;
  /** 是否显示遮罩 */
  backdrop: boolean;
  /** 补间时长 ms */
  tween: number;
  /** 面板宽度（px；全宽时不生成该行） */
  width?: number;
  /** 水平停靠 */
  align?: "left" | "center" | "right";
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

export function generateSheetSnippet(input: SheetSnippetInput): string {
  const lines: string[] = [];

  lines.push("const Enhanced = withModalSheetPlugins(ModalSheetCore, [");
  if (input.backdrop) lines.push("  createBackdropPlugin(),");
  lines.push("  createDragHandlePlugin(),");
  if (input.snapDots) lines.push("  createSnapDotsPlugin(),");
  lines.push('  createHeaderPlugin({ title: "多档弹层" }),');
  lines.push("]);");
  lines.push("");
  lines.push("<Enhanced");
  lines.push("  isOpen={open}");
  lines.push("  onClose={() => setOpen(false)}");
  lines.push(
    `  snapPoints={[${input.snaps.map(fmt).join(", ")}]} // 升序，0–1 = 视口高度比例`,
  );
  lines.push(`  tweenDuration={${input.tween}}`);
  if (input.width !== undefined) {
    lines.push(`  width={${input.width}} // 面板宽度 px`);
    if (input.align && input.align !== "center") {
      lines.push(`  horizontalAlign="${input.align}"`);
    }
  }
  lines.push(">");

  return lines.join("\n");
}
