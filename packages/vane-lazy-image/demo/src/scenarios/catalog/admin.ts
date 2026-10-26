import type { ScenarioMeta } from "../types";

/** G · 后台 SaaS：小图密集、附件受保护，失败必须可解释。 */
export const ADMIN: ScenarioMeta[] = [
  {
    id: "g1-admin-avatars",
    code: "G1",
    cat: "admin",
    title: "成员列表小头像",
    ref: { site: "Ant Design Pro", page: "用户管理列表", url: "https://pro.ant.design/" },
    pain: "一屏 40 个 22px 头像，翻页就重拉，主线程也跟着抖。",
    tone: "light",
    plugs: [
      { fn: "createCropPlugin", arg: "{ focusPoint: { x: 0.5, y: 0.5 } }", why: "小尺寸也不变形" },
      { fn: "createMemoryCachePlugin", arg: "{ maxEntries: 400 }", why: "翻页不重复请求" },
      { fn: "createFallbackImagePlugin", arg: "{ fallbackSrc: … }", why: "缺图不留空洞" },
    ],
  },
  {
    id: "g2-ticket-attachments",
    code: "G2",
    cat: "admin",
    title: "工单附件缩略",
    ref: { site: "工单系统", page: "附件列表", url: "https://pro.ant.design/" },
    pain: "附件走鉴权接口，越权时给一张破图，用户根本不知道发生了什么。",
    tone: "light",
    plugs: [
      { fn: "createAuthPlugin", arg: '{ tokenParam: "access_token" }', why: "带上登录态" },
      { fn: "createErrorBadgePlugin", arg: '{ text: "无权限" }', why: "失败要可读" },
      { fn: "createGalleryPlugin", arg: "{ enableLightbox: true }", why: "点开放大" },
    ],
    note: "第三张用过期凭证，返回 401 invalid_token，右上角出现「无权限」角标。需 pnpm serve:demo。",
  },
  {
    id: "g3-protected-401",
    code: "G3",
    cat: "admin",
    title: "受保护资源三态",
    ref: { site: "SaaS 后台", page: "受保护图片", url: "https://pro.ant.design/" },
    pain: "200 / 401 / 403 三种结果必须在 UI 上区分开，否则排查全靠猜。",
    tone: "light",
    plugs: [
      { fn: "createAuthPlugin", arg: '{ token: "demo-token-1f2e3d" }', why: "按凭证取图" },
      { fn: "createRetryOnErrorPlugin", arg: "{ maxRetries: 1 }", why: "瞬时失败自愈" },
      { fn: "createErrorOverlayPlugin", arg: '{ retryText: "重试" }', why: "给出可点出口" },
    ],
    note: "接口是演示站自带的 /protected/image：401 missing_credentials、401 invalid_token、403 insufficient_scope。",
  },
  {
    id: "g4-table-image-cell",
    code: "G4",
    cat: "admin",
    title: "表格图片列",
    ref: { site: "后台列表", page: "商品/资产表格", url: "https://pro.ant.design/" },
    pain: "行高固定，缩略图一失败就把整行撑开或塌掉。",
    tone: "light",
    plugs: [
      { fn: "createSkeletonPlugin", arg: '{ type: "pulse" }', why: "骨架与图同尺寸" },
      { fn: "createFallbackImagePlugin", arg: "{ fallbackSrc: … }", why: "缺图不塌行" },
      { fn: "createErrorBadgePlugin", arg: '{ text: "!" }', why: "角标提示异常" },
    ],
  },
];
