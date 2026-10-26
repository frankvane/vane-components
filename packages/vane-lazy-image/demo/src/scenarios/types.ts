/** 场景示例板块的数据契约：元信息（目录）与预览实现（specs/*.tsx）分离。 */

export type CatId =
  | "vod" // 影视点播
  | "ecommerce" // 电商
  | "video" // 视频社区
  | "social" // 图文社区
  | "news" // 资讯门户
  | "gallery" // 图库摄影
  | "admin" // 后台 SaaS
  | "travel" // 出行房产
  | "mobile" // 移动弱网
  | "marketing"; // 营销创意

export interface ScenarioPluginRef {
  /** 工厂函数名，如 createSkeletonPlugin —— 必须与 specs 里的装配逐字一致 */
  fn: string;
  /** 参数源码文本，如 `{ type: "shimmer" }`；无参省略 */
  arg?: string;
  /** 为什么在这个场景里用它（展示用） */
  why: string;
}

export interface ScenarioMeta {
  /** 同时是 specs 文件名：specs/<id>.tsx */
  id: string;
  /** 卡片序号，如 A1 */
  code: string;
  cat: CatId;
  title: string;
  /** 版式参照（不做内容复刻，只借版式） */
  ref: { site: string; page: string; url: string };
  /** 这个场景要解决的加载矛盾，一句话 */
  pain: string;
  plugs: ScenarioPluginRef[];
  /** 交互说明 / 口径 / 降级行为 */
  note?: string;
  /** 舞台底色：贴近参照站点的真实观感 */
  tone: "light" | "dark";
}

export interface CategoryMeta {
  id: CatId;
  label: string;
  en: string;
  /** 该类业务的加载矛盾概述 */
  blurb: string;
}
