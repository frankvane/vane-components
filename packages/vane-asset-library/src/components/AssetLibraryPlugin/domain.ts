import type {
  AssetFilter,
  AssetFolder,
  AssetItem,
  AssetKind,
  AssetSort,
  AssetSortKey,
  AssetStatus,
} from "./plugins/types";

/**
 * 领域纯函数层：归一化 / 过滤 / 排序 / 分页 / 格式化。
 *
 * 全部无副作用、无 React 依赖，可单独单测 —— 这是本包「行为可验证」的底座：
 * 内核只负责把状态喂给这些函数，插件只负责表达，判断逻辑一律在这里。
 */

const KIND_SET = new Set<AssetKind>(["image", "video"]);
const STATUS_SET = new Set<AssetStatus>(["ready", "processing", "failed"]);

/** 归一化告警：去重后一次性输出，避免每个脏元素刷一条日志 */
export interface NormalizeResult {
  items: AssetItem[];
  issues: string[];
}

/** `createdAt` 接受 string / number / Date；脏值统一归 undefined（排序时排末尾） */
export function toTimestamp(value: unknown): number | undefined {
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** 从 src 里取文件名，作为缺省 title */
export function fileNameOf(src: string): string {
  if (!src) return "";
  const clean = src.split("?")[0].split("#")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] ?? "";
}

/** 展示名：title → 文件名 → id */
export function titleOf(item: AssetItem): string {
  const title = item.title?.trim();
  if (title) return title;
  const name = fileNameOf(item.src);
  return name || item.id;
}

/**
 * 素材归一化：
 *  - 丢弃缺 id / id 非字符串 / 重复 id 的元素（重复保留首次出现）
 *  - kind 非法归一到 image，status 非法归一到 ready，并记录 issue
 *  - tags 去重、去空白；src 允许为空字符串（卡片走占位块，不丢数据）
 */
export function normalizeAssets(input: unknown): NormalizeResult {
  const issues: string[] = [];
  if (!Array.isArray(input)) {
    if (input !== undefined && input !== null) issues.push("items 不是数组，已忽略");
    return { items: [], issues };
  }
  const seen = new Set<string>();
  const items: AssetItem[] = [];
  let missingId = 0;
  let duplicated = 0;
  let badKind = 0;
  let badStatus = 0;

  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      missingId += 1;
      continue;
    }
    const candidate = raw as AssetItem;
    const id = candidate.id;
    if (typeof id !== "string" || !id.trim()) {
      missingId += 1;
      continue;
    }
    if (seen.has(id)) {
      duplicated += 1;
      continue;
    }
    seen.add(id);

    let kind = candidate.kind;
    if (!KIND_SET.has(kind)) {
      kind = "image";
      badKind += 1;
    }
    let status = candidate.status;
    if (status !== undefined && !STATUS_SET.has(status)) {
      status = "ready";
      badStatus += 1;
    }
    const tags = Array.isArray(candidate.tags)
      ? Array.from(
          new Set(
            candidate.tags
              .filter((tag): tag is string => typeof tag === "string")
              .map((tag) => tag.trim())
              .filter(Boolean)
          )
        )
      : undefined;

    items.push({
      ...candidate,
      id,
      kind,
      src: typeof candidate.src === "string" ? candidate.src : "",
      status,
      tags,
    });
  }

  if (missingId) issues.push(`${missingId} 条素材缺合法 id，已丢弃`);
  if (duplicated) issues.push(`${duplicated} 条素材 id 重复，已保留首次出现`);
  if (badKind) issues.push(`${badKind} 条素材 kind 非法，已按 image 处理`);
  if (badStatus) issues.push(`${badStatus} 条素材 status 非法，已按 ready 处理`);
  return { items, issues };
}

export function normalizeFolders(input: unknown): AssetFolder[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const folders: AssetFolder[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const folder = raw as AssetFolder;
    if (typeof folder.id !== "string" || !folder.id.trim() || seen.has(folder.id)) {
      continue;
    }
    seen.add(folder.id);
    folders.push({
      ...folder,
      id: folder.id,
      name: typeof folder.name === "string" && folder.name ? folder.name : folder.id,
    });
  }
  return folders;
}

/**
 * 选择归一化：剔除不在 items 里的 id、去重、保留勾选顺序；
 * maxSelected > 0 时截断（受控入参越界不该把组件拖进「已超限」的坏状态）。
 */
export function normalizeSelection(
  ids: unknown,
  items: AssetItem[],
  maxSelected = 0
): string[] {
  if (!Array.isArray(ids)) return [];
  const known = new Set(items.map((item) => item.id));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || !known.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (maxSelected > 0 && out.length >= maxSelected) break;
  }
  return out;
}

/** 只有 ready 可选；processing / failed 仍展示（用户需要知道文件没就绪） */
export function isAssetSelectable(item: AssetItem): boolean {
  return (item.status ?? "ready") === "ready";
}

function matchesQuery(item: AssetItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.title,
    fileNameOf(item.src),
    item.folderName,
    item.mimeType,
    item.owner,
    ...(item.tags ?? []),
  ]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/** 过滤：query 命中任一文本字段；kinds 空 = 不限；tags 为 OR；folderId 精确匹配 */
export function filterAssets(items: AssetItem[], filter: AssetFilter): AssetItem[] {
  const kinds = filter.kinds.length ? new Set(filter.kinds) : null;
  const tags = filter.tags.length ? new Set(filter.tags) : null;
  return items.filter((item) => {
    if (kinds && !kinds.has(item.kind)) return false;
    if (filter.folderId && (item.folderId ?? null) !== filter.folderId) return false;
    if (tags) {
      const itemTags = item.tags ?? [];
      if (!itemTags.some((tag) => tags.has(tag))) return false;
    }
    if (!matchesQuery(item, filter.query)) return false;
    return true;
  });
}

function sortValueOf(item: AssetItem, key: AssetSortKey): number | string | undefined {
  switch (key) {
    case "name":
      return titleOf(item).toLowerCase();
    case "createdAt":
      return toTimestamp(item.createdAt);
    case "size":
      return typeof item.size === "number" && Number.isFinite(item.size)
        ? item.size
        : undefined;
    case "duration":
      return typeof item.duration === "number" && Number.isFinite(item.duration)
        ? item.duration
        : undefined;
    default:
      return undefined;
  }
}

/**
 * 稳定排序：缺值恒排末尾（不随升/降序翻转 —— 让「没有时长」的图片永远沉底），
 * 同值保持入参顺序（显式带 index 兜底，不依赖引擎的稳定排序实现）。
 */
export function sortAssets(items: AssetItem[], sort: AssetSort): AssetItem[] {
  const factor = sort.dir === "asc" ? 1 : -1;
  return items
    .map((item, index) => ({ item, index, value: sortValueOf(item, sort.key) }))
    .sort((a, b) => {
      const aMissing = a.value === undefined || a.value === "";
      const bMissing = b.value === undefined || b.value === "";
      if (aMissing || bMissing) {
        if (aMissing && bMissing) return a.index - b.index;
        return aMissing ? 1 : -1;
      }
      if (a.value === b.value) return a.index - b.index;
      if (typeof a.value === "string" && typeof b.value === "string") {
        return a.value.localeCompare(b.value, "zh-Hans-CN") * factor;
      }
      return ((a.value as number) - (b.value as number)) * factor;
    })
    .map((entry) => entry.item);
}

export interface PageResult {
  visible: AssetItem[];
  page: number;
  pageCount: number;
}

/** 分页：pageSize<=0 视为不分页；page 越界自动夹到 [1, pageCount] */
export function paginateAssets(
  items: AssetItem[],
  page: number,
  pageSize: number
): PageResult {
  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    return { visible: items, page: 1, pageCount: 1 };
  }
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return { visible: items.slice(start, start + pageSize), page: safePage, pageCount };
}

// ---------- 格式化 ----------

/** 秒 → `12:34` / `1:02:03`；非法值返回空串（调用方据此不渲染角标） */
export function formatDuration(seconds: unknown): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
    return "";
  }
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** 字节 → `860 B` / `1.2 KB` / `3.4 MB` */
export function formatSize(bytes: unknown): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

export interface TagFacet {
  tag: string;
  count: number;
}

/** 标签面（facet）：按出现次数降序，同数量按字典序，便于 TagFilter 直接渲染 */
export function buildTagFacets(items: AssetItem[]): TagFacet[] {
  const counter = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counter, ([tag, count]) => ({ tag, count })).sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-Hans-CN")
  );
}

/** 分组面：宿主给了 folders 就按给定顺序；计数优先用真实 items 现算 */
export function buildFolderFacets(
  items: AssetItem[],
  folders: AssetFolder[]
): Array<AssetFolder & { count: number }> {
  const counter = new Map<string, number>();
  for (const item of items) {
    const folderId = item.folderId ?? null;
    if (!folderId) continue;
    counter.set(folderId, (counter.get(folderId) ?? 0) + 1);
  }
  return folders.map((folder) => ({
    ...folder,
    count: counter.get(folder.id) ?? folder.count ?? 0,
  }));
}

/** 空态原因：库本身为空 vs 筛选无命中 —— 两种文案必须分叉 */
export function resolveEmptyReason(
  total: number,
  filtered: number
): "empty" | "filtered" | null {
  if (total === 0) return "empty";
  if (filtered === 0) return "filtered";
  return null;
}
