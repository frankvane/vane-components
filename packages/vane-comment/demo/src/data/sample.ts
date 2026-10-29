import type { Comment } from "vane-comment";

/**
 * 演示用样例评论（多页共用）。
 *
 * 刻意覆盖各能力：置顶 / 点赞数 / 楼中楼嵌套 / 图片 / 已删除 / 审核中 / @提及。
 * 头像用内联 SVG data-uri，避免演示站依赖外网图片；时间用相对当前时刻的固定偏移。
 */
const NOW = Date.now();
const min = 60 * 1000;

function avatar(letter: string, color: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="18" fill="${color}"/><text x="18" y="23" font-size="16" font-family="sans-serif" fill="#fff" text-anchor="middle">${letter}</text></svg>`
  )}`;
}

function pic(seed: string): string {
  return `https://picsum.photos/seed/${seed}/200/200`;
}

export const MENTIONS = [
  { id: "u-rachel", name: "Rachel" },
  { id: "u-monica", name: "Monica" },
  { id: "u-phoebe", name: "Phoebe" },
];

const rachel = { id: "u-rachel", name: "Rachel", avatar: avatar("R", "#d4380d"), verified: true };
const monica = { id: "u-monica", name: "Monica", avatar: avatar("M", "#2b7de9") };
const phoebe = { id: "u-phoebe", name: "Phoebe", avatar: avatar("P", "#389e0d") };
const chandler = { id: "u-chandler", name: "Chandler", avatar: avatar("C", "#722ed1") };
const joey = { id: "u-joey", name: "Joey", avatar: avatar("J", "#eb2f96") };
const ross = { id: "u-ross", name: "Ross", avatar: avatar("R", "#fa8c16"), badge: "UP主" };

export const COMMENTS: Comment[] = [
  {
    id: "c-1",
    author: ross,
    content: [
      { type: "text", value: "这期视频的转场也太丝滑了吧，" },
      { type: "emoji", value: "🔥" },
      { type: "text", value: " 求个工程文件链接～" },
    ],
    createdAt: NOW - 28 * min,
    likeCount: 128,
    liked: false,
    pinned: true,
    replyCount: 2,
    replies: [
      {
        id: "c-1-r1",
        author: rachel,
        content: [{ type: "text", value: "同求，蹲一个工程文件 🤝" }],
        createdAt: NOW - 20 * min,
        likeCount: 12,
        liked: false,
      },
      {
        id: "c-1-r2",
        author: monica,
        content: [
          { type: "text", value: "工程文件已放评论置顶啦 " },
          { type: "mention", userId: "u-ross", name: "Ross" },
        ],
        createdAt: NOW - 12 * min,
        likeCount: 31,
        liked: true,
      },
    ],
  },
  {
    id: "c-2",
    author: chandler,
    content: [{ type: "text", value: "前排！这个 BGM 叫什么名字？循环了一整天了" }],
    createdAt: NOW - 22 * min,
    likeCount: 64,
    liked: true,
    images: [{ url: pic("scene-a"), alt: "名场面截图" }],
  },
  {
    id: "c-3",
    author: phoebe,
    content: [
      { type: "text", value: "刚发完评论就有人点赞，社交平台的即时反馈真的上头 " },
      { type: "emoji", value: "😂" },
    ],
    createdAt: NOW - 9 * min,
    likeCount: 7,
    liked: false,
    status: "pending",
  },
  {
    id: "c-4",
    author: joey,
    content: [{ type: "text", value: "这条评论已经被我手滑删掉了" }],
    createdAt: NOW - 5 * min,
    likeCount: 0,
    liked: false,
    status: "deleted",
  },
  {
    id: "c-5",
    author: monica,
    content: [
      { type: "text", value: "电商场景实测：这个 SKU 的评论区排序切到「最热」之后，" },
      { type: "text", value: "优质长评一下子就浮上来了，转化应该会好不少。" },
    ],
    createdAt: NOW - 3 * min,
    likeCount: 42,
    liked: false,
  },
];

/** 重置一份全新引用（演示里点赞/回复会改它，重置控件用得到） */
export function freshComments(): Comment[] {
  return JSON.parse(JSON.stringify(COMMENTS)) as Comment[];
}
