// 子路径入口 `vane-profile/custom-plugins`（桶文件 · 9 个官方插件）
//
// 桶文件是「逃生口」：一次拿全量，适合工坊 / 内部后台 / 原型。
// 业务包更推荐逐插件子路径引入（`vane-profile/custom-plugins/BannerSlotPlugin`）——
// 每个薄壳只指向自己那一份实现，不牵动其余 8 个。

export * from "./BannerSlotPlugin";
export * from "./StatRowPlugin";
export * from "./TabSyncPlugin";
export * from "./VerifyBadgePlugin";
export * from "./FollowEchoPlugin";
export * from "./BioSlotPlugin";
export * from "./SocialLinksPlugin";
export * from "./TagListPlugin";
export * from "./WorksGridPlugin";
export * from "./MembershipBadgePlugin";
export * from "./QRSharePlugin";
export * from "./LiveStatusPlugin";
export * from "./ContactCardPlugin";
export * from "./ActivitySummaryPlugin";
export * from "./MessageButtonPlugin";
export * from "./AchievementWallPlugin";
