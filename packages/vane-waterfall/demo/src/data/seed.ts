/**
 * 演示数据生成器
 *
 * 缩略图用 picsum.photos 的真实照片（`seed` 路径参数是确定性的，同一张卡每次都是同
 * 一张图，截图比对才有意义），底下仍垫一层由 `hue` 算出的渐变——图床不可达、离线、
 * 或触发 CSP 时 `onError` 把 <img> 藏掉，回落到渐变块，版式不会塌。
 *
 * 卡片高度自始至终来自 `height` 字段，与图片何时加载、加载成功与否无关，所以瀑布流的
 * 可变高与体检脚本的几何断言都不受网络影响。
 */

/** 线性同余，保证同一 seed 每次生成同一批数据（截图比对才有意义） */
function lcg(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const AUTHORS = [
  "林一白", "苏见月", "陈默", "阿岚", "周知夏", "陆青野", "许星河",
  "沈迟", "顾亦", "南野", "唐小满", "白露",
];

const TOPICS = [
  "阴天里的海边公路", "手冲咖啡的第 30 天", "把阳台改成了书房", "城市夜行的三小时",
  "一碗面的做法", "老相机与新胶卷", "周三的菜市场", "窗台上的第四盆绿植",
  "独居第五年的厨房", "关于晨跑的碎念", "旧书店的午后", "这条街的雨",
];

const TAGS = ["摄影", "家居", "美食", "穿搭", "旅行", "手作", "阅读", "数码"];

export interface SeedCard {
  id: string;
  title: string;
  author: string;
  /**
   * 缩略图区域高度（px）——瀑布流的可变高就来自这里。
   * 字段名就叫 height：FixedHeightPlugin 是按「项上有 height 字段」来统一高度的，
   * 用别的名字那个插件就成了空转（旧版遗留的坑，这里对齐）。
   */
  height: number;
  /** 色相，决定缩略图的渐变底色（也是图片加载前的占位色） */
  hue: number;
  /**
   * 缩略图地址。
   *
   * picsum 的 `/seed/<任意串>/<w>/<h>` 是确定性的：同一个串永远返回同一张图，
   * 所以卡片内容在刷新、截图、体检之间保持一致。尺寸按 4:5 出（卡片列宽 130–360，
   * 容器靠 `object-fit: cover` 裁切），单张 20–30KB，避免 13 个场景同时挂载时打爆流量。
   */
  image: string;
  tag: string;
  price: number;
  /** 收藏 / 点赞数 */
  likes: number;
  /** 售卖 / 发布距今多少分钟（排序插件用） */
  minutesAgo: number;
}

export interface MakeOptions {
  count?: number;
  seed?: number;
  /** 高度范围，默认 [140, 300] */
  heightRange?: [number, number];
  /** 商品类：带价格 */
  commerce?: boolean;
}

export function makeCards(options: MakeOptions = {}): SeedCard[] {
  const { count = 40, seed = 20261026, heightRange = [140, 300], commerce = false } = options;
  const rand = lcg(seed);
  const [minH, maxH] = heightRange;

  return Array.from({ length: count }, (_v, i) => {
    const r1 = rand();
    const r2 = rand();
    const r3 = rand();
    const id = `c${seed}-${i}`;
    return {
      id,
      title: TOPICS[i % TOPICS.length] + (i >= TOPICS.length ? ` · ${Math.floor(i / TOPICS.length) + 1}` : ""),
      author: AUTHORS[Math.floor(r1 * AUTHORS.length)] ?? AUTHORS[0],
      // 量化到 8px，避免亚像素导致的布局抖动，也更接近真实图片的整数高
      height: Math.round((minH + r2 * (maxH - minH)) / 8) * 8,
      hue: Math.floor(r3 * 360),
      image: `https://picsum.photos/seed/${id}/400/500`,
      tag: TAGS[Math.floor(r1 * TAGS.length) % TAGS.length] ?? TAGS[0],
      price: commerce ? Math.round((29 + r2 * 870) / 10) * 10 : 0,
      likes: Math.floor(20 + r3 * 9800),
      minutesAgo: Math.floor(r1 * 60 * 24 * 14),
    };
  });
}

/** 12 小时制的相对时间，列表里比 ISO 字符串好读 */
export function timeAgo(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, minutes)} 分钟前`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} 小时前`;
  return `${Math.floor(minutes / 60 / 24)} 天前`;
}
