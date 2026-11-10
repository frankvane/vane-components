import { describe, expect, it } from "vitest";
import {
  buildFolderFacets,
  buildTagFacets,
  filterAssets,
  formatDuration,
  formatSize,
  isAssetSelectable,
  normalizeAssets,
  normalizeSelection,
  paginateAssets,
  resolveEmptyReason,
  sortAssets,
  titleOf,
  toTimestamp,
} from "../src/components/AssetLibraryPlugin/domain";
import type { AssetItem } from "../src/components/AssetLibraryPlugin/plugins/types";

/** 领域纯函数：本包的判断全在这里，插件只负责表达 —— 所以这里必须全覆盖 */

const make = (over: Partial<AssetItem> & { id: string }): AssetItem => ({
  kind: "image",
  src: `https://cdn.test/${over.id}.png`,
  ...over,
});

describe("normalizeAssets", () => {
  it("丢弃缺 id / 重复 id，并按出现顺序保留首个", () => {
    const { items, issues } = normalizeAssets([
      { id: "a", kind: "image", src: "x" },
      { kind: "image", src: "no-id" },
      { id: "a", kind: "video", src: "dup" },
      null,
      { id: "  ", kind: "image", src: "blank" },
      { id: "b", kind: "video", src: "y" },
    ]);
    expect(items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(items[0].kind).toBe("image");
    expect(issues.join()).toContain("缺合法 id");
    expect(issues.join()).toContain("id 重复");
  });

  it("非法 kind / status 归一到 image / ready，并记录 issue", () => {
    const { items, issues } = normalizeAssets([
      { id: "a", kind: "audio", src: "x", status: "queued" },
    ]);
    expect(items[0].kind).toBe("image");
    expect(items[0].status).toBe("ready");
    expect(issues.join()).toContain("kind 非法");
    expect(issues.join()).toContain("status 非法");
  });

  it("tags 去重去空白；src 非字符串归空串但不丢素材", () => {
    const { items } = normalizeAssets([
      { id: "a", kind: "image", src: 42, tags: ["  x ", "x", "", "y"] },
    ]);
    expect(items[0].src).toBe("");
    expect(items[0].tags).toEqual(["x", "y"]);
  });

  it("非数组入参返回空集而不是抛错", () => {
    expect(normalizeAssets(undefined).items).toEqual([]);
    expect(normalizeAssets("nope").issues.length).toBe(1);
  });
});

describe("normalizeSelection", () => {
  const items = [make({ id: "a" }), make({ id: "b" }), make({ id: "c" })];

  it("剔除未知 id、去重、保留顺序", () => {
    expect(normalizeSelection(["c", "zzz", "a", "c"], items)).toEqual(["c", "a"]);
  });

  it("超过上限时截断（受控入参越界不该把组件拖进坏状态）", () => {
    expect(normalizeSelection(["a", "b", "c"], items, 2)).toEqual(["a", "b"]);
  });

  it("非数组返回空集", () => {
    expect(normalizeSelection("a", items)).toEqual([]);
  });
});

describe("isAssetSelectable", () => {
  it("只有 ready 可选；缺省视为 ready", () => {
    expect(isAssetSelectable(make({ id: "a" }))).toBe(true);
    expect(isAssetSelectable(make({ id: "a", status: "ready" }))).toBe(true);
    expect(isAssetSelectable(make({ id: "a", status: "processing" }))).toBe(false);
    expect(isAssetSelectable(make({ id: "a", status: "failed" }))).toBe(false);
  });
});

describe("filterAssets", () => {
  const items: AssetItem[] = [
    make({ id: "a", title: "首页 Banner", tags: ["官网", "banner"], folderId: "f1" }),
    make({ id: "b", kind: "video", title: "宣传片", tags: ["官网"], duration: 96 }),
    make({ id: "c", title: "产品图", tags: ["产品"], folderId: "f2" }),
  ];
  const empty = { query: "", kinds: [], tags: [], folderId: null };

  it("关键词命中标题 / 标签 / 文件名", () => {
    expect(filterAssets(items, { ...empty, query: "banner" }).map((i) => i.id)).toEqual(["a"]);
    expect(filterAssets(items, { ...empty, query: "产品" }).map((i) => i.id)).toEqual(["c"]);
    expect(filterAssets(items, { ...empty, query: "b.png" }).map((i) => i.id)).toEqual(["b"]);
  });

  it("kinds 为空表示不限；否则按类型过滤", () => {
    expect(filterAssets(items, empty)).toHaveLength(3);
    expect(filterAssets(items, { ...empty, kinds: ["video"] }).map((i) => i.id)).toEqual(["b"]);
  });

  it("tags 是 OR 语义", () => {
    expect(
      filterAssets(items, { ...empty, tags: ["产品", "banner"] }).map((i) => i.id)
    ).toEqual(["a", "c"]);
  });

  it("folderId 精确匹配", () => {
    expect(filterAssets(items, { ...empty, folderId: "f2" }).map((i) => i.id)).toEqual(["c"]);
  });

  it("条件叠加", () => {
    const result = filterAssets(items, {
      query: "官网",
      kinds: ["image"],
      tags: ["官网"],
      folderId: "f1",
    });
    expect(result.map((i) => i.id)).toEqual(["a"]);
  });
});

describe("sortAssets", () => {
  const items: AssetItem[] = [
    make({ id: "a", size: 300 }),
    make({ id: "b" }), // 无 size
    make({ id: "c", size: 100 }),
    make({ id: "d", size: 300 }),
  ];

  it("升序 / 降序", () => {
    expect(sortAssets(items, { key: "size", dir: "asc" }).map((i) => i.id)).toEqual([
      "c",
      "a",
      "d",
      "b",
    ]);
    expect(sortAssets(items, { key: "size", dir: "desc" }).map((i) => i.id)).toEqual([
      "a",
      "d",
      "c",
      "b",
    ]);
  });

  it("缺值恒沉底，不随方向翻转", () => {
    const asc = sortAssets(items, { key: "size", dir: "asc" });
    const desc = sortAssets(items, { key: "size", dir: "desc" });
    expect(asc[asc.length - 1].id).toBe("b");
    expect(desc[desc.length - 1].id).toBe("b");
  });

  it("同值保持入参顺序（稳定）", () => {
    const same = sortAssets(items, { key: "size", dir: "asc" })
      .filter((item) => item.size === 300)
      .map((item) => item.id);
    expect(same).toEqual(["a", "d"]);
  });

  it("名称按中文排序；createdAt 归一化后比较", () => {
    const named: AssetItem[] = [
      make({ id: "1", title: "乙" }),
      make({ id: "2", title: "甲" }),
    ];
    expect(sortAssets(named, { key: "name", dir: "asc" }).map((i) => i.id)).toEqual(["2", "1"]);

    const dated: AssetItem[] = [
      make({ id: "old", createdAt: "2026-01-01" }),
      make({ id: "new", createdAt: "2026-11-01" }),
    ];
    expect(sortAssets(dated, { key: "createdAt", dir: "desc" }).map((i) => i.id)).toEqual([
      "new",
      "old",
    ]);
  });
});

describe("paginateAssets", () => {
  const items = Array.from({ length: 25 }, (_, i) => make({ id: String(i) }));

  it("分页切片与页数", () => {
    const page2 = paginateAssets(items, 2, 10);
    expect(page2.page).toBe(2);
    expect(page2.pageCount).toBe(3);
    expect(page2.visible).toHaveLength(10);
    expect(page2.visible[0].id).toBe("10");
  });

  it("页码越界夹到最后一页", () => {
    expect(paginateAssets(items, 99, 10).page).toBe(3);
    expect(paginateAssets(items, 0, 10).page).toBe(1);
    expect(paginateAssets(items, -3, 10).page).toBe(1);
  });

  it("pageSize 为 0 / 非法时不分页", () => {
    const all = paginateAssets(items, 3, 0);
    expect(all.visible).toHaveLength(25);
    expect(all.pageCount).toBe(1);
    expect(paginateAssets(items, 1, Number.NaN).visible).toHaveLength(25);
  });

  it("空集也返回 1 页", () => {
    const empty = paginateAssets([], 5, 10);
    expect(empty.page).toBe(1);
    expect(empty.pageCount).toBe(1);
    expect(empty.visible).toEqual([]);
  });
});

describe("格式化与面", () => {
  it("formatDuration", () => {
    expect(formatDuration(9)).toBe("0:09");
    expect(formatDuration(96)).toBe("1:36");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(undefined)).toBe("");
    expect(formatDuration(-1)).toBe("");
  });

  it("formatSize", () => {
    expect(formatSize(512)).toBe("512 B");
    expect(formatSize(1536)).toBe("1.5 KB");
    expect(formatSize(1024 * 1024 * 3.4)).toBe("3.4 MB");
    expect(formatSize("big")).toBe("");
  });

  it("toTimestamp 接受 string / number / Date，脏值归 undefined", () => {
    expect(toTimestamp(new Date("2026-01-01T00:00:00Z"))).toBe(1767225600000);
    expect(toTimestamp(1000)).toBe(1000);
    expect(typeof toTimestamp("2026-01-01")).toBe("number");
    expect(toTimestamp("not-a-date")).toBeUndefined();
    expect(toTimestamp(Number.NaN)).toBeUndefined();
  });

  it("titleOf 回落顺序 title → 文件名 → id", () => {
    expect(titleOf(make({ id: "a", title: "封面" }))).toBe("封面");
    expect(titleOf(make({ id: "a", src: "https://x/y/z.png?w=1" }))).toBe("z.png");
    expect(titleOf(make({ id: "a", src: "" }))).toBe("a");
  });

  it("buildTagFacets 按次数降序", () => {
    const facets = buildTagFacets([
      make({ id: "a", tags: ["x", "y"] }),
      make({ id: "b", tags: ["x"] }),
      make({ id: "c", tags: ["z"] }),
    ]);
    expect(facets[0]).toEqual({ tag: "x", count: 2 });
    expect(facets.map((f) => f.tag)).toEqual(["x", "y", "z"]);
  });

  it("buildFolderFacets 计数取真实 items，忽略 folder.count 脏值", () => {
    const facets = buildFolderFacets(
      [make({ id: "a", folderId: "f1" }), make({ id: "b", folderId: "f1" })],
      [
        { id: "f1", name: "官网", count: 99 },
        { id: "f2", name: "空组" },
      ]
    );
    expect(facets).toEqual([
      { id: "f1", name: "官网", count: 2 },
      { id: "f2", name: "空组", count: 0 },
    ]);
  });

  it("resolveEmptyReason 区分空库与筛选无结果", () => {
    expect(resolveEmptyReason(0, 0)).toBe("empty");
    expect(resolveEmptyReason(5, 0)).toBe("filtered");
    expect(resolveEmptyReason(5, 3)).toBeNull();
  });
});
