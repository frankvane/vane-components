/**
 * 演示素材
 *
 * 图片一律用内联 SVG data-URI：
 *  - 离线可跑、不依赖外网（断网/限速会让 demo 与体检脚本一起挂）；
 *  - 尺寸稳定，截图与几何体检不会因为图片加载慢而抖；
 *  - 不用 picsum / placeholder.com 这类需要联网的服务。
 *
 * 视频不给真实文件，只给缩略图 + duration：组件本来就不加载媒体元数据，
 * 时长是素材数据的一部分（由宿主写入）。
 */
import type { AssetFolder, AssetItem } from "vane-asset-library";

const svg = (hue: number, label: string): string => {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 62% 56%)"/>` +
    `<stop offset="1" stop-color="hsl(${(hue + 38) % 360} 58% 38%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="320" height="240" fill="url(#g)"/>` +
    `<circle cx="256" cy="52" r="30" fill="rgba(255,255,255,.18)"/>` +
    `<text x="18" y="212" font-family="monospace" font-size="15" fill="rgba(255,255,255,.92)">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
};

export const SAMPLE_FOLDERS: AssetFolder[] = [
  { id: "f-brand", name: "品牌" },
  { id: "f-product", name: "产品" },
  { id: "f-video", name: "视频" },
  { id: "f-ugc", name: "用户投稿" },
];

type Seed = {
  id: string;
  title: string;
  kind?: "image" | "video";
  hue: number;
  tags: string[];
  folderId: string;
  folderName: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  status?: "ready" | "processing" | "failed";
  favorite?: boolean;
  createdAt: string;
};

const SEEDS: Seed[] = [
  { id: "a-01", title: "首页主视觉 2026", hue: 8, tags: ["banner", "首页"], folderId: "f-brand", folderName: "品牌", size: 486233, width: 1920, height: 1080, favorite: true, createdAt: "2026-11-02" },
  { id: "a-02", title: "春季节日海报", hue: 336, tags: ["海报", "节日"], folderId: "f-brand", folderName: "品牌", size: 265117, width: 1200, height: 1600, createdAt: "2026-10-28" },
  { id: "a-03", title: "品牌 Logo 墙", hue: 214, tags: ["品牌", "logo"], folderId: "f-brand", folderName: "品牌", size: 98244, width: 1600, height: 900, createdAt: "2026-10-20" },
  { id: "a-04", title: "618 大促 KV", hue: 22, tags: ["活动", "banner"], folderId: "f-brand", folderName: "品牌", size: 731882, width: 2560, height: 1440, createdAt: "2026-10-15" },
  { id: "a-05", title: "移动端 Banner", hue: 46, tags: ["banner", "移动端"], folderId: "f-brand", folderName: "品牌", size: 154220, width: 750, height: 400, createdAt: "2026-10-12" },
  { id: "a-06", title: "产品主图 · 白底", hue: 194, tags: ["产品", "主图"], folderId: "f-product", folderName: "产品", size: 322486, width: 2000, height: 2000, createdAt: "2026-10-30" },
  { id: "a-07", title: "产品场景图 · 客厅", hue: 168, tags: ["产品", "场景"], folderId: "f-product", folderName: "产品", size: 611002, width: 3000, height: 2000, favorite: true, createdAt: "2026-10-29" },
  { id: "a-08", title: "详情页长图", hue: 282, tags: ["详情页", "电商"], folderId: "f-product", folderName: "产品", size: 1288310, width: 1080, height: 9600, createdAt: "2026-10-27" },
  { id: "a-09", title: "UI 组件截图", hue: 232, tags: ["UI", "组件"], folderId: "f-product", folderName: "产品", size: 187334, width: 1440, height: 900, createdAt: "2026-10-25" },
  { id: "a-10", title: "图标素材包", hue: 262, tags: ["图标", "素材包"], folderId: "f-product", folderName: "产品", size: 45210, width: 512, height: 512, createdAt: "2026-10-22" },
  { id: "a-11", title: "发布会宣传片", kind: "video", hue: 356, duration: 96, tags: ["短视频", "发布会"], folderId: "f-video", folderName: "视频", size: 18422014, width: 1920, height: 1080, createdAt: "2026-11-01" },
  { id: "a-12", title: "教程 01 · 快速上手", kind: "video", hue: 206, duration: 252, tags: ["教程", "短视频"], folderId: "f-video", folderName: "视频", size: 42118802, width: 1920, height: 1080, createdAt: "2026-10-31" },
  { id: "a-13", title: "教程 02 · 进阶技巧", kind: "video", hue: 176, duration: 215, tags: ["教程"], folderId: "f-video", folderName: "视频", size: 38220441, width: 1920, height: 1080, createdAt: "2026-10-30" },
  { id: "a-14", title: "品牌循环动画", kind: "video", hue: 300, duration: 12, tags: ["品牌", "动效"], folderId: "f-video", folderName: "视频", size: 8841220, width: 1080, height: 1080, createdAt: "2026-10-26" },
  { id: "a-15", title: "用户投稿 · 开箱", hue: 96, tags: ["UGC", "实拍"], folderId: "f-ugc", folderName: "用户投稿", size: 288910, width: 1500, height: 2000, createdAt: "2026-10-24" },
  { id: "a-16", title: "用户投稿 · 街拍", hue: 118, tags: ["UGC", "实拍"], folderId: "f-ugc", folderName: "用户投稿", size: 402118, width: 1600, height: 1067, createdAt: "2026-10-23" },
  { id: "a-17", title: "用户短视频 · 露营", kind: "video", hue: 132, duration: 28, tags: ["UGC", "短视频"], folderId: "f-ugc", folderName: "用户投稿", size: 12004488, width: 1080, height: 1920, createdAt: "2026-10-21" },
  { id: "a-18", title: "媒体实拍 · 展会", hue: 28, tags: ["实拍", "媒体"], folderId: "f-brand", folderName: "品牌", size: 733991, width: 2400, height: 1600, createdAt: "2026-10-18" },
  { id: "a-19", title: "头像兜底图", hue: 320, tags: ["头像", "占位"], folderId: "f-product", folderName: "产品", size: 8422, width: 200, height: 200, createdAt: "2026-10-16" },
  { id: "a-20", title: "深色占位底图", hue: 226, tags: ["占位"], folderId: "f-product", folderName: "产品", size: 12211, width: 800, height: 600, createdAt: "2026-10-14" },
  { id: "a-21", title: "上传中 · 新品实拍 01", hue: 60, tags: ["上传中"], folderId: "f-product", folderName: "产品", size: 0, status: "processing", createdAt: "2026-11-03" },
  { id: "a-22", title: "上传中 · 新品实拍 02", hue: 84, tags: ["上传中"], folderId: "f-product", folderName: "产品", size: 0, status: "processing", createdAt: "2026-11-03" },
  { id: "a-23", title: "转码失败 · 素材 07", kind: "video", hue: 0, tags: ["失败"], folderId: "f-video", folderName: "视频", size: 0, status: "failed", createdAt: "2026-11-02" },
];

const PAD_TAGS = ["素材包", "节日", "活动", "实拍", "UI", "教程"];

function pad(to: number): Seed[] {
  const out: Seed[] = [];
  for (let i = SEEDS.length; i < to; i += 1) {
    const n = i + 1;
    out.push({
      id: `a-${String(n).padStart(2, "0")}`,
      title: `运营备用素材 ${String(n - SEEDS.length).padStart(2, "0")}`,
      hue: (i * 37) % 360,
      tags: [PAD_TAGS[i % PAD_TAGS.length]],
      folderId: i % 2 ? "f-ugc" : "f-product",
      folderName: i % 2 ? "用户投稿" : "产品",
      size: 96000 + ((i * 7919) % 400000),
      width: 1600,
      height: 1200,
      createdAt: `2026-09-${String((i % 28) + 1).padStart(2, "0")}`,
    });
  }
  return out;
}

const toItem = (seed: Seed): AssetItem => ({
  id: seed.id,
  kind: seed.kind ?? "image",
  src: svg(seed.hue, seed.id),
  thumbnail: seed.kind === "video" ? svg(seed.hue, `${seed.id} · poster`) : undefined,
  title: seed.title,
  width: seed.width,
  height: seed.height,
  duration: seed.duration,
  size: seed.size,
  mimeType: seed.kind === "video" ? "video/mp4" : "image/svg+xml",
  tags: seed.tags,
  folderId: seed.folderId,
  folderName: seed.folderName,
  createdAt: seed.createdAt,
  status: seed.status ?? "ready",
  favorite: seed.favorite,
  owner: "设计中心",
});

/** 演示站共用素材：48 项，含 5 个视频、2 个处理中、1 个失败、4 个分组 */
export const SAMPLE_ASSETS: AssetItem[] = [...SEEDS, ...pad(48)].map(toItem);

/** 大库场景用：在样例基础上批量补足到 n 项（默认 240） */
export function bulkAssets(total = 240): AssetItem[] {
  const out = [...SAMPLE_ASSETS];
  for (let i = SAMPLE_ASSETS.length; i < total; i += 1) {
    const n = i + 1;
    out.push(
      toItem({
        id: `bulk-${n}`,
        title: `批量素材 ${String(n).padStart(3, "0")}`,
        kind: n % 9 === 0 ? "video" : "image",
        hue: (n * 23) % 360,
        tags: [PAD_TAGS[n % PAD_TAGS.length]],
        folderId: n % 3 === 0 ? "f-ugc" : "f-product",
        folderName: n % 3 === 0 ? "用户投稿" : "产品",
        size: 120000 + ((n * 6151) % 900000),
        width: 1600,
        height: 1200,
        duration: n % 9 === 0 ? 30 + (n % 200) : undefined,
        createdAt: `2026-08-${String((n % 28) + 1).padStart(2, "0")}`,
      })
    );
  }
  return out;
}

/** 演示用的「上传后新增」素材：status 先 processing，1.2s 后转 ready */
export function makeUploadingAsset(index: number): AssetItem {
  return toItem({
    id: `up-${Date.now()}-${index}`,
    title: `新上传素材 ${index + 1}`,
    hue: (index * 61 + 180) % 360,
    tags: ["新上传"],
    folderId: "f-product",
    folderName: "产品",
    size: 260000,
    width: 1600,
    height: 1200,
    status: "processing",
    createdAt: new Date().toISOString(),
  });
}
