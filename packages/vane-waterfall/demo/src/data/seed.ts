/**
 * 演示数据生成器
 *
 * 为什么不用真实图片：示例页要能离线、秒开、离线跑体检脚本，外链图床既有 CSP/CORS
 * 风险，也会让「卡片高度不等高」这件事随网络状况抖动。这里统一用确定性的
 * 伪随机 + 渐变色块模拟缩略图，高度由数据本身给定，正好压测瀑布流的可变高。
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
  /** 色相，决定缩略图配色 */
  hue: number;
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
    return {
      id: `c${seed}-${i}`,
      title: TOPICS[i % TOPICS.length] + (i >= TOPICS.length ? ` · ${Math.floor(i / TOPICS.length) + 1}` : ""),
      author: AUTHORS[Math.floor(r1 * AUTHORS.length)] ?? AUTHORS[0],
      // 量化到 8px，避免亚像素导致的布局抖动，也更接近真实图片的整数高
      height: Math.round((minH + r2 * (maxH - minH)) / 8) * 8,
      hue: Math.floor(r3 * 360),
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
