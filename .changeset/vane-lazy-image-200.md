---
"@vane/plugin-core": minor
"vane-lazy-image": minor
---

vane-components 首个发布周期：插件化图片懒加载组件 2.0.0

**vane-lazy-image**（破坏性大版本，插件系统内核更换为 `@vane/plugin-core`）：

- 60 个内置插件、8 大领域分组（视觉 / 加载策略 / 网络 / 缓存 / 可访问性 / 错误处理 / 监控 / 视口），插件只增不减；
- 5 个场景配方：社交信息流 / 商品画廊 / 长文阅读 / 性能优先 / 离线优先（`vane-lazy-image/presets/<name>` 子路径）；
- 引入方式：插件走 `vane-lazy-image/custom-plugins/<XxxPlugin>` 子路径最省体积（0.14KB 起）；根入口 `vane-lazy-image` 为兼容 1.x 保留全部插件工厂的桶导出，静态图上限 26.9KB（未 tree-shake 上界，`sideEffects: false`）；只要核心走 `vane-lazy-image/core`（6.9KB）；
- 领域 API 保持兼容：`createXxxPlugin(config)` 工厂签名与「priority 越小越优先」语义不变；`render` 钩子合并为 `renderOverlay`；
- 移除插件热更新 / hookFactory / renderDeps / bus 通配符（1.x 无内置插件使用）；
- 补齐 `AnimatedCursorPlugin` / `CustomEffectsPlugin` / `DepthMapPlugin` / `GlitchEffectPlugin` / `MorphPlugin` / `RevealAnimationPlugin` 六个插件的 `exports` 子路径（此前目录已落库但未导出，消费方按子路径引入会解析失败）。

**@vane/plugin-core**：新增 `extendContext` 选项（领域上下文注入）；卸载时先执行 onUnmount 链再清理插件；钩子类型改方法语法（领域可收窄 context 类型）。
