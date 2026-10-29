// 子路径入口 `vane-comment/custom-plugins`（桶文件 · 17 个官方插件）
//
// 桶文件是「逃生口」：一次拿全量，适合工坊 / 内部后台 / 原型。
// 业务包更推荐逐插件子路径引入（`vane-comment/custom-plugins/LikePlugin`）——
// 每个薄壳只指向自己那一份实现，不牵动其余插件。

export * from "./LikePlugin";
export * from "./SortPlugin";
export * from "./ThreadPlugin";
export * from "./RichComposerPlugin";
export * from "./ReportPlugin";
export * from "./SharePlugin";
export * from "./CopyPlugin";
export * from "./ReactionPlugin";
export * from "./FavoritePlugin";
export * from "./PinPlugin";
export * from "./LocationPlugin";
export * from "./TimestampPlugin";
export * from "./CountPlugin";
export * from "./FilterPlugin";
export * from "./SearchPlugin";
export * from "./ModerationPlugin";
export * from "./LoginPromptPlugin";
