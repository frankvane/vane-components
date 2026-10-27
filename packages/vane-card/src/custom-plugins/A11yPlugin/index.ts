/**
 * 子路径入口 `vane-card/custom-plugins/A11yPlugin`（infra 组）
 *
 * 薄壳再导出：实现仍住在 src/components/CardPlugin/custom-plugins/A11yPlugin，
 * 这里只把「源码路径 == 发布子路径」的约定补上（discover-entries 据此生成 exports）。
 * 单独引一个插件只付它自己的代码，不牵动其余 21 个。
 */

export * from "../../components/CardPlugin/custom-plugins/A11yPlugin";
