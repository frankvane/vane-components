// 子路径入口 `vane-comment/custom-plugins`（桶文件 · 4 个官方插件）
//
// 桶文件是「逃生口」：一次拿全量，适合工坊 / 内部后台 / 原型。
// 业务包更推荐逐插件子路径引入（`vane-comment/custom-plugins/LikePlugin`）——
// 每个薄壳只指向自己那一份实现，不牵动其余 3 个。

export * from "./LikePlugin";
export * from "./SortPlugin";
export * from "./ThreadPlugin";
export * from "./RichComposerPlugin";
