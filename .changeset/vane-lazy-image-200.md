---
"@vane/plugin-core": minor
"vane-lazy-image": minor
---

vane-components 首个发布周期：插件化图片懒加载组件 2.0.0

**vane-lazy-image**（破坏性大版本，插件系统内核更换为 `@vane/plugin-core`）：

- 60 个内置插件、8 大领域分组（视觉 / 加载策略 / 网络 / 缓存 / 可访问性 / 错误处理 / 监控 / 视口），插件只增不减；
- 5 个场景配方：社交信息流 / 商品画廊 / 长文阅读 / 性能优先 / 离线优先（`vane-lazy-image/presets/<name>` 子路径）；
- 引入方式改为子路径按需引入：插件 `vane-lazy-image/custom-plugins/<XxxPlugin>`，根入口只保留核心 + 插件系统 + 类型（13.6KB gzip）；
- 领域 API 保持兼容：`createXxxPlugin(config)` 工厂签名与「priority 越小越优先」语义不变；`render` 钩子合并为 `renderOverlay`；
- 移除插件热更新 / hookFactory / renderDeps / bus 通配符（1.x 无内置插件使用）。

**@vane/plugin-core**：新增 `extendContext` 选项（领域上下文注入）；卸载时先执行 onUnmount 链再清理插件；钩子类型改方法语法（领域可收窄 context 类型）。
