import type {
  SkuAttribute,
  SkuSelection,
  SkuVariant,
} from "./plugins/types";

/**
 * 组合矩阵 + 禁用推导（core 内置能力，B4）。
 *
 * 禁用推导是 vane-sku 的核心卖点：vane-card 的 SKUPlugin 每个选项永远可点，
 * 错配只是不命中；这里会在「当前选择」下算出哪些选项是死路（选它后不存在任何
 * 有效变体），从而把按钮置灰。
 *
 * 全部为纯函数，不依赖 React，便于单测。
 */

export interface AvailabilityOptions {
  /**
   * 缺货变体（stock===0）是否视为不存在。
   * 默认 true：通往「只有缺货变体」的选项会被置灰。
   */
  ignoreOutOfStock?: boolean;
}

export interface Availability {
  /** 属性名 → 被置灰的 optionId 集合 */
  disabledMap: Record<string, Set<string>>;
  /** 属性名 → 可选（未置灰）选项数 */
  availableCount: Record<string, number>;
}

/** 选出参与可用性推导的变体 */
function effectiveVariants(
  variants: SkuVariant[],
  opts: AvailabilityOptions
): SkuVariant[] {
  const ignoreOutOfStock = opts.ignoreOutOfStock ?? true;
  if (!ignoreOutOfStock) return variants;
  return variants.filter((v) => v.stock !== 0);
}

/**
 * 计算当前选择下每个属性的禁用选项集合。
 *
 * 判定方式：把该属性的候选 option 临时代入选择（已选则覆盖），
 * 检查是否存在变体匹配「所有已选属性」；不存在则该 option 是死路 → 置灰。
 */
export function buildAvailability(
  attributes: SkuAttribute[],
  variants: SkuVariant[],
  selection: SkuSelection,
  opts: AvailabilityOptions = {}
): Availability {
  const pool = effectiveVariants(variants, opts);
  const disabledMap: Record<string, Set<string>> = {};
  const availableCount: Record<string, number> = {};

  for (const attr of attributes) {
    const disabled = new Set<string>();

    for (const option of attr.options) {
      // 临时选择：以当前选择为基，把本属性覆盖为候选 option
      const tentative: SkuSelection = { ...selection, [attr.name]: option.id };
      const keys = Object.keys(tentative);
      const exists =
        keys.length > 0 &&
        pool.some((v) => keys.every((k) => v.attrValues[k] === tentative[k]));

      if (!exists) disabled.add(option.id);
    }

    disabledMap[attr.name] = disabled;
    availableCount[attr.name] = attr.options.length - disabled.size;
  }

  return { disabledMap, availableCount };
}

/** 选全并命中变体则返回该变体，否则 null */
export function matchVariant(
  variants: SkuVariant[],
  attributes: SkuAttribute[],
  selection: SkuSelection
): SkuVariant | null {
  if (!attributes.length) return null;
  for (const attr of attributes) {
    if (!selection[attr.name]) return null;
  }
  const keys = Object.keys(selection);
  return (
    variants.find((v) => keys.every((k) => v.attrValues[k] === selection[k])) ??
    null
  );
}

/** 所有属性是否都已选择 */
export function isSelectionComplete(
  attributes: SkuAttribute[],
  selection: SkuSelection
): boolean {
  if (!attributes.length) return false;
  return attributes.every((a) => Boolean(selection[a.name]));
}
