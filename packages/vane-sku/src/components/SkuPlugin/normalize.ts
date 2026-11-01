import type {
  SkuAttribute,
  SkuOption,
  SkuSelection,
  SkuVariant,
} from "./plugins/types";

/**
 * SKU 数据归一化（P0-1 / P0-3 / P2-3）。
 *
 * 外部输入（宿主接口 / URL 查询串 / localStorage）一律视为不可信：
 *  - attributes 的 options 缺失或元素缺 id → 丢弃该选项（不再渲染期 TypeError）
 *  - variants 的 attrValues 缺失或含非字符串值 → 按空值处理
 *  - 缺 name / 缺 sku 的项丢弃
 *  - 重复的属性名 / 选项 id / sku 去重（保留首个），避免 React duplicate key 与选中态串联
 *
 * 纯函数，不依赖 React，便于单测。
 */

export interface NormalizedSkuData {
  attributes: SkuAttribute[];
  variants: SkuVariant[];
  /** 归一化过程中发现的数据问题，供宿主排查（开发环境 warn，生产可忽略） */
  issues: string[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** 归一化规格数据：补齐缺失字段、过滤非法元素、去重 */
export function normalizeSkuData(
  attributes: SkuAttribute[] | null | undefined,
  variants: SkuVariant[] | null | undefined
): NormalizedSkuData {
  const issues: string[] = [];

  const normalizedAttributes: SkuAttribute[] = [];
  const attrNames = new Set<string>();

  const rawAttributes: unknown[] = Array.isArray(attributes) ? attributes : [];
  for (let index = 0; index < rawAttributes.length; index += 1) {
    const attr = asRecord(rawAttributes[index]);
    if (!attr || !nonEmptyString(attr.name)) {
      issues.push(`attributes[${index}] 缺少 name，已忽略`);
      continue;
    }
    if (attrNames.has(attr.name)) {
      issues.push(`属性名「${attr.name}」重复，已忽略重复项`);
      continue;
    }
    attrNames.add(attr.name);

    const rawOptions = attr.options;
    if (!Array.isArray(rawOptions)) {
      issues.push(`属性「${attr.name}」缺少 options，按空列表处理`);
    }

    const options: SkuOption[] = [];
    const optionIds = new Set<string>();
    for (const rawOption of Array.isArray(rawOptions) ? rawOptions : []) {
      const option = asRecord(rawOption);
      if (!option || !nonEmptyString(option.id)) {
        issues.push(`属性「${attr.name}」存在缺少 id 的选项，已忽略`);
        continue;
      }
      if (optionIds.has(option.id)) {
        issues.push(`属性「${attr.name}」的选项 id「${option.id}」重复，已忽略重复项`);
        continue;
      }
      optionIds.add(option.id);

      const nextOption: SkuOption = {
        id: option.id,
        label: nonEmptyString(option.label) ? option.label : option.id,
      };
      if (nonEmptyString(option.image)) nextOption.image = option.image;
      options.push(nextOption);
    }

    normalizedAttributes.push({ name: attr.name, options });
  }

  const normalizedVariants: SkuVariant[] = [];
  const skus = new Set<string>();

  const rawVariants: unknown[] = Array.isArray(variants) ? variants : [];
  for (let index = 0; index < rawVariants.length; index += 1) {
    const raw = asRecord(rawVariants[index]);
    if (!raw || !nonEmptyString(raw.sku)) {
      issues.push(`variants[${index}] 缺少 sku，已忽略`);
      continue;
    }
    if (skus.has(raw.sku)) {
      issues.push(`变体 sku「${raw.sku}」重复，已忽略重复项`);
      continue;
    }
    skus.add(raw.sku);

    const attrValues: Record<string, string> = {};
    const rawAttrValues = asRecord(raw.attrValues);
    if (!rawAttrValues) {
      issues.push(`变体「${raw.sku}」缺少 attrValues，按空值处理`);
    } else {
      for (const [key, value] of Object.entries(rawAttrValues)) {
        if (nonEmptyString(value)) attrValues[key] = value;
      }
    }

    normalizedVariants.push({
      ...(raw as unknown as SkuVariant),
      sku: raw.sku,
      attrValues,
    });
  }

  return { attributes: normalizedAttributes, variants: normalizedVariants, issues };
}

/**
 * 选择态归一化（P0-1）：按 attributes 的 optionId 白名单过滤。
 *
 * 目的：URL / localStorage / defaultSelection 带进来的键值不属于当前商品时，
 * 若原样写进 state，会让「所有属性的所有选项」同时置灰（选中项本身没有按钮可点，
 * 用户连取消都做不到）。归一化后脏键值被丢弃，矩阵重新可点。
 */
export function normalizeSelection(
  attributes: SkuAttribute[],
  selection: SkuSelection | null | undefined
): SkuSelection {
  const next: SkuSelection = {};
  if (!selection || typeof selection !== "object") return next;

  const optionIdsByAttr = new Map<string, Set<string>>();
  for (const attr of attributes) {
    optionIdsByAttr.set(attr.name, new Set((attr.options ?? []).map((o) => o.id)));
  }

  for (const [attrName, optionId] of Object.entries(selection)) {
    if (typeof optionId !== "string" || !optionId) continue;
    const allowed = optionIdsByAttr.get(attrName);
    if (!allowed || !allowed.has(optionId)) continue;
    next[attrName] = optionId;
  }
  return next;
}

/** 两个选择是否等价（浅比较，用于受控同步时避免无意义 setState） */
export function isSameSelection(
  a: SkuSelection | null | undefined,
  b: SkuSelection | null | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}
